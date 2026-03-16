'use client'

import { Clock, LogOut, RefreshCw } from 'lucide-react'

interface Props {
  secondsLeft: number
  onStayLoggedIn: () => void
  onLogout: () => void
}

export default function InactivityWarning({ secondsLeft, onStayLoggedIn, onLogout }: Props) {
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  // Progress: 0% = just appeared (120s), 100% = about to log out
  const totalWarningSeconds = 120
  const progress = Math.max(0, Math.min(100, ((totalWarningSeconds - secondsLeft) / totalWarningSeconds) * 100))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStayLoggedIn} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar at top */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[var(--color-danger)] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon + title */}
          <div className="flex flex-col items-center text-center gap-3 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 border-2 border-orange-100">
              <Clock className="h-7 w-7 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Still there?</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                You've been inactive. You'll be signed out in
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center mb-5">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-3 text-center">
              <span className="text-4xl font-bold tabular-nums text-orange-600 font-mono">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Stay logged in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}