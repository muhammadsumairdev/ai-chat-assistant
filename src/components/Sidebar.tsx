import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDistanceToNow } from 'date-fns'
import {
  Check,
  MessageSquarePlus,
  PanelLeftClose,
  Pencil,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { resetDemo } from '@/lib/storage'
import { Orb } from './Orb'
import { cn } from '@/lib/cn'
import type { Conversation } from '@/lib/types'

export function Sidebar({
  onClose,
  onOpenSettings,
  onNavigate,
}: {
  onClose: () => void
  onOpenSettings: () => void
  onNavigate: () => void
}) {
  const conversations = useStore((s) => s.conversations)
  const activeId = useStore((s) => s.activeId)
  const loading = useStore((s) => s.loading)
  const newChat = useStore((s) => s.newChat)
  const setActive = useStore((s) => s.setActive)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q)),
    )
  }, [conversations, query])

  return (
    <div className="flex h-full flex-col bg-surface/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <div className="flex items-center gap-2.5">
          <Orb className="h-7 w-7" glow />
          <span className="text-[15px] font-semibold tracking-tight">Aster</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Collapse sidebar"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            newChat()
            onNavigate()
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-border-strong bg-surface-2 px-3 py-2.5 text-sm font-medium transition-all hover:border-accent hover:bg-accent-soft hover:text-accent"
        >
          <MessageSquarePlus size={17} />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-lg border border-border bg-bg/50 py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {loading ? (
          <SidebarSkeleton />
        ) : filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">
            {query ? 'No matches.' : 'No conversations yet.'}
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((c) => (
              <ConversationRow
                key={c.id}
                convo={c}
                active={c.id === activeId}
                onSelect={() => {
                  setActive(c.id)
                  onNavigate()
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border p-2">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={resetDemo}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <RotateCcw size={16} />
          Reset demo data
        </button>
      </div>
    </div>
  )
}

function ConversationRow({
  convo,
  active,
  onSelect,
}: {
  convo: Conversation
  active: boolean
  onSelect: () => void
}) {
  const rename = useStore((s) => s.rename)
  const removeConversation = useStore((s) => s.removeConversation)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(convo.title)

  const commit = () => {
    rename(convo.id, draft)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group relative flex items-center rounded-lg transition-colors',
        active ? 'bg-accent-soft' : 'hover:bg-surface-2',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
      )}

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="m-1 w-full rounded-md border border-accent bg-bg px-2 py-1.5 text-sm text-text focus:outline-none"
        />
      ) : (
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left transition-transform group-hover:translate-x-0.5"
        >
          <span
            className={cn(
              'w-full truncate text-sm',
              active ? 'font-medium text-text' : 'text-text/90',
            )}
          >
            {convo.title}
          </span>
          <span className="text-[11px] text-muted">
            {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true })}
          </span>
        </button>
      )}

      {/* Row actions */}
      {!editing && (
        <div
          className={cn(
            'flex items-center gap-0.5 pr-1.5',
            confirming
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
          )}
        >
          {confirming ? (
            <>
              <button
                onClick={() => removeConversation(convo.id)}
                aria-label="Confirm delete"
                className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => setConfirming(false)}
                aria-label="Cancel delete"
                className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text"
              >
                <X size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setDraft(convo.title)
                  setEditing(true)
                }}
                aria-label="Rename"
                className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                aria-label="Delete"
                className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-1 pt-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-lg bg-surface-2"
          style={{ opacity: 1 - i * 0.13 }}
        />
      ))}
    </div>
  )
}
