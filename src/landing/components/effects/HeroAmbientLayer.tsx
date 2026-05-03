/**
 * Hero-only floating accents (icons as inline SVG to avoid extra lucide chunk in critical path).
 * Keeps headline / copy static for LCP.
 */
export function HeroAmbientLayer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden lg:overflow-visible"
      aria-hidden
    >
      {/* Large glass pills */}
      <div className="landing-ambient-animate absolute -right-[5%] top-[8%] hidden h-14 w-40 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm animate-float-y-alt [animation-delay:-1s] md:block" />
      <div className="landing-ambient-animate absolute left-[4%] top-[28%] h-11 w-28 rounded-xl border border-orange/15 bg-orange/[0.06] animate-drift [animation-delay:-3s]" />

      {/* Ticket glyph */}
      <div className="landing-ambient-animate absolute right-[8%] top-[32%] flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-navy-dark/40 text-orange/90 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md animate-float-y [animation-delay:-2s]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2M13 17v2M13 11v2" />
        </svg>
      </div>

      {/* Message bubble */}
      <div className="landing-ambient-animate absolute left-[10%] bottom-[26%] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/80 backdrop-blur-md animate-float-y-slow [animation-delay:-4s] max-lg:bottom-[18%]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Sparkle cluster */}
      <div className="landing-ambient-animate absolute right-[18%] bottom-[20%] text-orange/70 animate-twinkle [animation-delay:-1.5s] max-lg:hidden">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l1.2 5.4L18 9l-4.8 1.6L12 16l-1.2-5.4L6 9l4.8-1.6L12 2zM19 14l.6 2.4L22 17l-2.4.6L19 20l-.6-2.4L16 17l2.4-.6L19 14zM5 15l.5 2L7 17.5l-2 .5L5 20l-.5-2L3 17.5l2-.5L5 15z" />
        </svg>
      </div>

      {/* Small dots trail */}
      <div className="landing-ambient-animate absolute right-[35%] top-[18%] h-2 w-2 rounded-full bg-white/40 animate-float-y [animation-delay:-5s]" />
      <div className="landing-ambient-animate absolute right-[42%] top-[24%] h-1.5 w-1.5 rounded-full bg-orange/50 animate-twinkle [animation-delay:-2.2s]" />
      <div className="landing-ambient-animate absolute left-[55%] top-[12%] h-2 w-2 rounded-full bg-white/25 animate-drift [animation-delay:-7s] max-lg:hidden" />

      {/* Ring */}
      <div className="landing-ambient-animate absolute left-[2%] top-[48%] h-24 w-24 rounded-full border-2 border-dashed border-white/10 animate-spin-slow opacity-50 max-md:hidden" />
    </div>
  );
}
