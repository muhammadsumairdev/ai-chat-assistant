import { useState, type ReactNode } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { resetDemo } from '@/lib/storage'
import { cn } from '@/lib/cn'
import type { ModelId } from '@/lib/types'
import { Modal } from './Modal'

const MODELS: { id: ModelId; label: string }[] = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'powerful', label: 'Powerful' },
]

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const clearAll = useStore((s) => s.clearAll)
  const [showKey, setShowKey] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Theme */}
        <Field label="Appearance">
          <Segmented
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { id: 'dark', label: 'Dark' },
              { id: 'light', label: 'Light' },
            ]}
          />
        </Field>

        {/* Model */}
        <Field
          label="Default model"
          hint="Cosmetic in demo mode — affects the real model when a key is set."
        >
          <Segmented
            value={settings.model}
            onChange={(model) => updateSettings({ model })}
            options={MODELS}
          />
        </Field>

        {/* API key */}
        <Field
          label="OpenAI API key"
          hint="Optional. Leave empty to use the built-in mock engine."
        >
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-bg py-2 pl-3 pr-10 font-mono text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-text"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300/90">
            ⚠️ Your key is stored only in this browser's localStorage and sent
            directly to OpenAI from your device. Don't use a shared computer.
          </p>
        </Field>

        {/* Data */}
        <Field label="Data">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                clearAll()
                toast.success('All conversations cleared')
                onClose()
              }}
              className="flex items-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm text-text transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <Trash2 size={15} />
              Clear conversations
            </button>
            <button
              onClick={resetDemo}
              className="rounded-lg border border-border-strong px-3 py-2 text-sm text-muted transition-colors hover:text-text"
            >
              Reset to demo data
            </button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2">
        <div className="text-sm font-medium text-text">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { id: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === o.id ? 'bg-accent text-white' : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
