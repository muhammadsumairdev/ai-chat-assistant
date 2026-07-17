import { Download, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'
import type { ModelId } from '@/lib/types'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { EmptyState } from './EmptyState'

const MODELS: { id: ModelId; label: string }[] = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'powerful', label: 'Powerful' },
]

export function ChatView({
  sidebarOpen,
  onOpenNav,
  onOpenSettings,
}: {
  sidebarOpen: boolean
  onOpenNav: () => void
  onOpenSettings: () => void
}) {
  const convo = useStore((s) => s.conversations.find((c) => c.id === s.activeId))
  const model = useStore((s) => s.settings.model)
  const updateSettings = useStore((s) => s.updateSettings)
  const exportMarkdown = useStore((s) => s.exportMarkdown)

  const hasMessages = !!convo && convo.messages.length > 0

  const onExport = () => {
    if (!convo) return
    const md = exportMarkdown(convo.id)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${convo.title.replace(/[^\w -]/g, '').trim() || 'conversation'}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Conversation exported')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          onClick={onOpenNav}
          aria-label="Open sidebar"
          className={cn(
            'rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text',
            sidebarOpen && 'md:hidden',
          )}
        >
          <PanelLeft size={18} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {convo?.title ?? 'New chat'}
        </h1>

        {/* Model picker (cosmetic) */}
        <div
          role="radiogroup"
          aria-label="Model"
          className="hidden items-center rounded-lg border border-border bg-surface-2 p-0.5 sm:flex"
        >
          {MODELS.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={model === m.id}
              onClick={() => updateSettings({ model: m.id })}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                model === m.id
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={onExport}
          disabled={!hasMessages}
          aria-label="Export conversation"
          title="Export as Markdown"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={18} />
        </button>
      </header>

      {/* Body */}
      {hasMessages ? (
        <MessageList convo={convo} />
      ) : (
        <EmptyState onOpenSettings={onOpenSettings} />
      )}

      <Composer />
    </div>
  )
}
