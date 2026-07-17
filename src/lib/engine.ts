import type { Message, Settings, ToolCall } from './types'
import responses from '@/seed/responses.json'

type Response = {
  id: string
  match: string[]
  answer: string
  tools?: { label: string; detail?: string }[]
}

export type StreamEvent =
  | { kind: 'tool-start'; tool: ToolCall }
  | { kind: 'tool-end'; id: string }
  | { kind: 'token'; value: string }

const uid = () => crypto.randomUUID()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const FALLBACKS = [
  (topic: string) =>
    `That's a good question about **${topic}**.\n\nThis demo runs on a small local mock engine rather than a live model, so I don't have a scripted answer for that one — but here's the shape a real reply would take:\n\n- Restate the core of what you're asking\n- Walk through the reasoning in a few clear steps\n- End with a concrete recommendation\n\nTo see full answers, try one of the starter prompts, or add your own API key in **Settings → API key** to stream from a real model.`,
  (topic: string) =>
    `Great prompt — **${topic}**.\n\nI'm the built-in mock engine for this portfolio demo, so my knowledge is limited to a handful of scripted topics. What I *can* show you is the product experience: streaming tokens, a Stop/Regenerate flow, agent-style tool steps, and rich markdown.\n\nAsk me to *explain HTTPS*, *write a palindrome checker*, *compare REST and GraphQL*, or *plan a trip to Kyoto* — or plug in an API key in Settings for the real thing.`,
]

function matchResponse(text: string): Response | null {
  const q = text.toLowerCase()
  let best: Response | null = null
  let bestScore = 0
  for (const r of responses as Response[]) {
    const score = r.match.reduce((n, kw) => (q.includes(kw) ? n + 1 : n), 0)
    if (score > bestScore) {
      bestScore = score
      best = r
    }
  }
  return bestScore > 0 ? best : null
}

// Split into word-ish tokens that keep their trailing whitespace/newlines,
// so streaming looks like natural typing without mangling code blocks.
function tokenize(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [text]
}

async function* runMock(
  prompt: string,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const hit = matchResponse(prompt)
  const answer = hit
    ? hit.answer
    : FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)](
        prompt.length > 60 ? prompt.slice(0, 57).trim() + '…' : prompt,
      )

  // Agent steps first (the signature moment).
  if (hit?.tools?.length) {
    for (const t of hit.tools) {
      if (signal.aborted) return
      const tool: ToolCall = { id: uid(), status: 'running', ...t }
      yield { kind: 'tool-start', tool }
      await sleep(700 + Math.random() * 700)
      if (signal.aborted) return
      yield { kind: 'tool-end', id: tool.id }
      await sleep(150)
    }
    await sleep(250)
  } else {
    // A beat of "thinking" before the first token.
    await sleep(500 + Math.random() * 400)
  }

  for (const token of tokenize(answer)) {
    if (signal.aborted) return
    yield { kind: 'token', value: token }
    await sleep(20 + Math.random() * 20)
  }
}

const OPENAI_MODEL: Record<Settings['model'], string> = {
  fast: 'gpt-4o-mini',
  balanced: 'gpt-4o',
  powerful: 'gpt-4o',
}

async function* runOpenAI(
  history: Message[],
  settings: Settings,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL[settings.model],
      stream: true,
      messages: history
        .filter((m) => m.content.trim())
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `OpenAI request failed (${res.status}). ${detail.slice(0, 200)}`,
    )
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) yield { kind: 'token', value: delta }
      } catch {
        /* ignore keep-alive / partial lines */
      }
    }
  }
}

// Unified entry point. Picks the real model when an API key is set.
export function run(
  history: Message[],
  settings: Settings,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  if (settings.apiKey.trim()) return runOpenAI(history, settings, signal)
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  return runMock(lastUser?.content ?? '', signal)
}

// Auto-title a conversation from the first user message.
export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 48) return clean || 'New chat'
  return clean.slice(0, 45).trim() + '…'
}
