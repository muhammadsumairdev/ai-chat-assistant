import { Link } from 'react-router-dom'
import { Orb } from './Orb'

export function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-bg px-4 text-center text-text">
      <Orb className="h-16 w-16" breathing glow />
      <div className="text-6xl font-semibold tracking-tight">404</div>
      <p className="max-w-sm text-muted">
        This conversation drifted off into the void. Let's get you back to Aster.
      </p>
      <Link
        to="/"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Back to Aster
      </Link>
    </div>
  )
}
