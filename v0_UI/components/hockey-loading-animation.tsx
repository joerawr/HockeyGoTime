"use client"

export function HockeyLoadingAnimation() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-8">
        {/* Hockey Stick */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-1 bg-slate-400 rounded-full origin-left animate-[swing_1s_ease-in-out_infinite]" />

        {/* Puck */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 rounded-full animate-[slide_1s_ease-in-out_infinite]" />
      </div>
      <span className="text-sm text-slate-600 animate-pulse">Thinking...</span>
    </div>
  )
}
