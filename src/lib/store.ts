import { create } from 'zustand'
import type { Conversation, Message, Settings, ToolCall } from './types'
import * as db from './storage'
import { run, titleFrom, type StreamEvent } from './engine'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const DEFAULT_SETTINGS: Settings = { theme: 'dark', model: 'balanced', apiKey: '' }

// Non-reactive: the live stream's abort handle.
let controller: AbortController | null = null

interface State {
  conversations: Conversation[]
  activeId: string | null
  loading: boolean
  streaming: boolean
  error?: string
  settings: Settings

  init: () => Promise<void>
  activeConversation: () => Conversation | undefined
  setActive: (id: string | null) => void
  newChat: () => void

  send: (text: string) => Promise<void>
  stop: () => void
  regenerate: () => void
  editLastUser: (text: string) => void

  rename: (id: string, title: string) => void
  removeConversation: (id: string) => void
  clearAll: () => void

  updateSettings: (patch: Partial<Settings>) => void
  exportMarkdown: (id: string) => string
}

export const useStore = create<State>((set, get) => {
  // --- internal helpers -----------------------------------------------------
  const patchConvo = (id: string, fn: (c: Conversation) => Conversation) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
    }))

  const patchMessage = (
    convoId: string,
    msgId: string,
    fn: (m: Message) => Message,
  ) =>
    patchConvo(convoId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)),
    }))

  const applyEvent = (convoId: string, msgId: string, ev: StreamEvent) => {
    if (ev.kind === 'token') {
      patchMessage(convoId, msgId, (m) => ({ ...m, content: m.content + ev.value }))
    } else if (ev.kind === 'tool-start') {
      patchMessage(convoId, msgId, (m) => ({
        ...m,
        toolCalls: [...(m.toolCalls ?? []), ev.tool],
      }))
    } else if (ev.kind === 'tool-end') {
      patchMessage(convoId, msgId, (m) => ({
        ...m,
        toolCalls: (m.toolCalls ?? []).map((t): ToolCall =>
          t.id === ev.id ? { ...t, status: 'done' } : t,
        ),
      }))
    }
  }

  const persist = (convoId: string) => {
    const convo = get().conversations.find((c) => c.id === convoId)
    if (convo) db.save('conversations', { ...convo, updatedAt: now() })
  }

  const streamInto = async (convoId: string, asstId: string) => {
    controller = new AbortController()
    set({ streaming: true, error: undefined })
    const history = get()
      .conversations.find((c) => c.id === convoId)!
      .messages.filter((m) => m.id !== asstId)
    try {
      for await (const ev of run(history, get().settings, controller.signal)) {
        applyEvent(convoId, asstId, ev)
      }
    } catch (e) {
      if (!controller?.signal.aborted) {
        const msg = e instanceof Error ? e.message : String(e)
        set({ error: msg })
        patchMessage(convoId, asstId, (m) => ({
          ...m,
          content: m.content || `⚠️ ${msg}`,
        }))
      }
    } finally {
      set({ streaming: false })
      controller = null
      persist(convoId)
    }
  }

  // --- public API -----------------------------------------------------------
  return {
    conversations: [],
    activeId: null,
    loading: true,
    streaming: false,
    settings: DEFAULT_SETTINGS,

    init: async () => {
      const settings = db.readValue<Settings>('settings', DEFAULT_SETTINGS)
      set({ settings, loading: true })
      const conversations = await db.list<Conversation>('conversations')
      conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      set({ conversations, loading: false })
    },

    activeConversation: () =>
      get().conversations.find((c) => c.id === get().activeId),

    setActive: (id) => set({ activeId: id }),

    newChat: () => set({ activeId: null, error: undefined }),

    send: async (text) => {
      const content = text.trim()
      if (!content || get().streaming) return

      let convo = get().activeConversation()
      if (!convo) {
        convo = {
          id: uid(),
          title: titleFrom(content),
          messages: [],
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({
          conversations: [convo!, ...s.conversations],
          activeId: convo!.id,
        }))
      }

      const userMsg: Message = { id: uid(), role: 'user', content, createdAt: now() }
      const asst: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        toolCalls: [],
        createdAt: now(),
      }
      patchConvo(convo.id, (c) => ({
        ...c,
        title: c.messages.length ? c.title : titleFrom(content),
        messages: [...c.messages, userMsg, asst],
        updatedAt: now(),
      }))

      await streamInto(convo.id, asst.id)
    },

    stop: () => controller?.abort(),

    regenerate: () => {
      if (get().streaming) return
      const convo = get().activeConversation()
      if (!convo) return
      const last = convo.messages[convo.messages.length - 1]
      if (!last || last.role !== 'assistant') return
      patchMessage(convo.id, last.id, (m) => ({ ...m, content: '', toolCalls: [] }))
      void streamInto(convo.id, last.id)
    },

    editLastUser: (text) => {
      const content = text.trim()
      if (!content || get().streaming) return
      const convo = get().activeConversation()
      if (!convo) return
      const idx = convo.messages.map((m) => m.role).lastIndexOf('user')
      if (idx === -1) return
      const asst: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        toolCalls: [],
        createdAt: now(),
      }
      const trimmed = convo.messages.slice(0, idx + 1)
      trimmed[idx] = { ...trimmed[idx], content }
      patchConvo(convo.id, (c) => ({
        ...c,
        messages: [...trimmed, asst],
        updatedAt: now(),
      }))
      void streamInto(convo.id, asst.id)
    },

    rename: (id, title) => {
      const clean = title.trim() || 'Untitled chat'
      patchConvo(id, (c) => ({ ...c, title: clean }))
      persist(id)
    },

    removeConversation: (id) => {
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeId: s.activeId === id ? null : s.activeId,
      }))
      void db.remove('conversations', id)
    },

    clearAll: () => {
      set({ conversations: [], activeId: null })
      void db.clear('conversations')
    },

    updateSettings: (patch) => {
      const settings = { ...get().settings, ...patch }
      set({ settings })
      db.writeValue('settings', settings)
    },

    exportMarkdown: (id) => {
      const convo = get().conversations.find((c) => c.id === id)
      if (!convo) return ''
      const lines = [`# ${convo.title}`, '']
      for (const m of convo.messages) {
        lines.push(`**${m.role === 'user' ? 'You' : 'Aster'}**`, '')
        if (m.toolCalls?.length) {
          for (const t of m.toolCalls)
            lines.push(`> 🔧 ${t.label}${t.detail ? ` — ${t.detail}` : ''}`)
          lines.push('')
        }
        lines.push(m.content, '', '---', '')
      }
      return lines.join('\n')
    },
  }
})
