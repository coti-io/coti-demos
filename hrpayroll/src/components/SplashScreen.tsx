import { useState } from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'

const DISMISSED_KEY = 'hrpayroll-splash-dismissed'

/** Full-screen disclaimer splash shown once per browser session before the app.
 *  Dismissed state is kept in sessionStorage so in-app navigation and reloads
 *  within the same tab don't re-trigger it. */
export function SplashScreen() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(DISMISSED_KEY) === '1',
  )

  if (dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D17]/90 px-4 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111422] p-8 shadow-2xl shadow-black/50">
        {/* Logo (matches sidebar) */}
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9100] to-[#FF5C00] shadow-[0_0_20px_rgba(255,145,0,0.35)]">
          <div className="h-4 w-4 rotate-45 border-2 border-white" />
        </div>

        <h1 id="splash-title" className="text-center text-2xl font-bold tracking-tight text-white">
          Demo Purpose Only
        </h1>

        <p className="mt-4 text-center text-sm leading-relaxed text-white/60">
          This{' '}
          <a
            href="https://github.com/coti-io/coti-demos/tree/main/hrpayroll"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#FF9100] hover:underline"
          >
            Avalanche Fuji app
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          is provided for demo purpose only. Smart contracts are based on{' '}
          <a
            href="https://app.sablier.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-[#FF9100] hover:underline"
          >
            Sablier
            <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#FF9100] to-[#FF5C00] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF9100]/25 transition-all hover:brightness-110"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
