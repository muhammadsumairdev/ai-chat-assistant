import { useRef, useState, type ChangeEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/cn'

const MAX = 4000

export function Composer() {
  const streaming = useStore((s) => s.streaming)
  const send = useStore((s) => s.send)
  const stop = useStore((s) => s.stop)
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    grow(e.target)
  }

  const submit = () => {
    const value = text.trim()
    if (!value || streaming || value.length > MAX) return
    void send(value)
    setText('')
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.focus()
    }
  }

  const overLimit = text.length > MAX
  const canSend = text.trim().length > 0 && !overLimit

  return (
    <div className="border-t border-border px-4 py-3 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-accent">
          <textarea
            ref={ref}
            value={text}
            onChange={onChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={1}
            autoFocus
            placeholder="Message Aster…"
            aria-label="Message"
            className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-text placeholder:text-muted focus:outline-none"
          />

          {streaming ? (
            <button
              onClick={stop}
              aria-label="Stop generating"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-text ring-1 ring-border-strong transition-colors hover:bg-bg"
            >
              <Square size={15} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:ring-1 disabled:ring-border"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted">
          <span>
            <kbd className="font-sans">Enter</kbd> to send ·{' '}
            <kbd className="font-sans">Shift+Enter</kbd> for newline
          </span>
          {text.length > 0 && (
            <span className={cn(overLimit && 'text-red-400')}>
              {text.length}/{MAX}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
