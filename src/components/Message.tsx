import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import type { Message as Msg, ToolCall } from '@/lib/types'
import { Orb } from './Orb'
import { Markdown } from './Markdown'

const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

export function Message({
  message,
  streaming,
  canEdit,
  canRegenerate,
}: {
  message: Msg
  streaming: boolean
  canEdit: boolean
  canRegenerate: boolean
}) {
  return message.role === 'user' ? (
    <UserMessage message={message} canEdit={canEdit} />
  ) : (
    <AssistantMessage
      message={message}
      streaming={streaming}
      canRegenerate={canRegenerate}
    />
  )
}

function UserMessage({ message, canEdit }: { message: Msg; canEdit: boolean }) {
  const editLastUser = useStore((s) => s.editLastUser)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  const save = () => {
    if (draft.trim()) editLastUser(draft)
    setEditing(false)
  }

  return (
    <motion.div {...rise} className="group flex justify-end">
      {editing ? (
        <div className="w-full max-w-[85%] rounded-2xl border border-accent bg-surface-2 p-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                save()
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            rows={Math.min(6, draft.split('\n').length)}
            className="w-full resize-none bg-transparent px-2 py-1 text-[15px] text-text focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex max-w-[85%] items-start gap-1.5">
          {canEdit && (
            <button
              onClick={() => {
                setDraft(message.content)
                setEditing(true)
              }}
              aria-label="Edit message"
              className="mt-2 rounded-lg p-1.5 text-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-text group-hover:opacity-100"
            >
              <Pencil size={14} />
            </button>
          )}
          <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-md border border-border bg-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
            {message.content}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function AssistantMessage({
  message,
  streaming,
  canRegenerate,
}: {
  message: Msg
  streaming: boolean
  canRegenerate: boolean
}) {
  const regenerate = useStore((s) => s.regenerate)
  const [copied, setCopied] = useState(false)
  const hasContent = message.content.length > 0
  const toolsRunning = message.toolCalls?.some((t) => t.status === 'running')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <motion.div {...rise} className="group flex gap-3">
      <Orb className="mt-0.5 h-7 w-7" />
      <div className="min-w-0 flex-1">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolSteps tools={message.toolCalls} />
        )}

        {hasContent ? (
          <Markdown content={message.content} streaming={streaming} />
        ) : streaming && !toolsRunning ? (
          <ThinkingDots />
        ) : !streaming ? (
          <span className="text-sm italic text-muted">(stopped)</span>
        ) : null}

        {!streaming && hasContent && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {copied ? (
                <Check size={13} className="text-cyan" />
              ) : (
                <Copy size={13} />
              )}
              Copy
            </button>
            {canRegenerate && (
              <button
                onClick={regenerate}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// The signature element: collapsible agent tool-call steps.
function ToolSteps({ tools }: { tools: ToolCall[] }) {
  const running = tools.some((t) => t.status === 'running')
  const [open, setOpen] = useState(true)

  return (
    <div className="mb-2.5 overflow-hidden rounded-xl border border-border bg-surface/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Sparkles size={14} className="text-accent" />
        <span className="text-xs font-medium text-text">
          {running ? 'Working…' : `${tools.length} step${tools.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'ml-auto text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-border px-3 py-2.5">
              {tools.map((t) => (
                <ToolRow key={t.id} tool={t} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToolRow({ tool }: { tool: ToolCall }) {
  const done = tool.status === 'done'
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="grid h-5 w-5 shrink-0 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span
              key="done"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 260 }}
            >
              <Check size={14} className="text-cyan" />
            </motion.span>
          ) : (
            <Loader2 key="run" size={14} className="animate-spin text-accent" />
          )}
        </AnimatePresence>
      </span>
      <span className="shrink-0 text-text">{tool.label}</span>
      {tool.detail && (
        <span className="truncate text-muted">· {tool.detail}</span>
      )}
    </div>
  )
}
