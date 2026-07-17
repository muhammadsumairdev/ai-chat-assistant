import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Conversation } from '@/lib/types'
import { Message } from './Message'

export function MessageList({ convo }: { convo: Conversation }) {
  const streaming = useStore((s) => s.streaming)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(dist < 80)
  }

  // Jump to bottom instantly when switching conversations.
  useLayoutEffect(() => {
    setAtBottom(true)
    scrollToBottom('auto')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convo.id])

  // Keep pinned to bottom as content streams in (only if already there).
  useEffect(() => {
    if (atBottom) scrollToBottom('auto')
  }, [convo, atBottom])

  const messages = convo.messages
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user')
  const lastIndex = messages.length - 1

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
          {messages.map((m, i) => (
            <Message
              key={m.id}
              message={m}
              streaming={streaming && i === lastIndex && m.role === 'assistant'}
              canEdit={!streaming && i === lastUserIndex}
              canRegenerate={
                !streaming && i === lastIndex && m.role === 'assistant'
              }
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {!atBottom && (
          <motion.button
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              scrollToBottom('smooth')
              setAtBottom(true)
            }}
            className="absolute bottom-4 left-1/2 flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text shadow-lg transition-colors hover:border-accent"
          >
            <ArrowDown size={14} />
            Scroll to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
