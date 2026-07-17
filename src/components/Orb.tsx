import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

/** The violet→cyan gradient orb — Aster's logo mark and assistant avatar. */
export function Orb({
  className,
  breathing = false,
  glow = false,
}: {
  className?: string
  breathing?: boolean
  glow?: boolean
}) {
  return (
    <motion.div
      className={cn('relative shrink-0 overflow-hidden rounded-full', className)}
      style={glow ? { boxShadow: '0 0 40px 6px rgba(124,124,255,0.35)' } : undefined}
      animate={breathing ? { scale: [1, 1.04, 1] } : undefined}
      transition={
        breathing ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#C7C7FF] via-accent to-cyan" />
      <div className="absolute -left-1/4 -top-1/4 h-2/3 w-2/3 rounded-full bg-white/40 blur-md" />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
    </motion.div>
  )
}
