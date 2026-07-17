import { motion } from 'motion/react'
import { KeyRound } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Orb } from './Orb'
import suggestions from '@/seed/suggestions.json'

export function EmptyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  const send = useStore((s) => s.send)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[110px]" />

      <Orb className="h-20 w-20" breathing glow />

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-7 text-2xl font-semibold tracking-tight"
      >
        How can I help today?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-2 max-w-md text-center text-sm text-muted"
      >
        I'm Aster — I can explain concepts, write code, compare options, and show
        my work with agent steps. Try one of these:
      </motion.p>

      <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.12 + i * 0.05,
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={() => void send(s.prompt)}
            className="group rounded-xl border border-border bg-surface/60 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft"
          >
            <div className="text-sm font-medium text-text">{s.label}</div>
            <div className="text-xs text-muted">{s.sublabel}</div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onOpenSettings}
        className="mt-7 flex items-center gap-1.5 text-xs text-muted underline-offset-2 transition-colors hover:text-text hover:underline"
      >
        <KeyRound size={13} />
        Add your own API key for real answers
      </button>
    </div>
  )
}
