/**
 * Full-viewport decorative layer: soft shapes + dots that drift behind content.
 * CSS-only for performance; class `landing-ambient-animate` respects reduced motion in index.css.
 */
export function LandingAmbientBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {/* Large blurs: scroll-driven in `LandingScrollParallaxBackdrop` */}
      <div className="landing-ambient-animate absolute left-[12%] top-[78%] h-3 w-3 rounded-full bg-orange/50 shadow-[0_0_20px_rgba(255,78,13,0.45)] animate-float-y [animation-delay:-1s]" />
      <div className="landing-ambient-animate absolute left-[22%] top-[52%] h-2 w-2 rounded-full bg-white/35 animate-twinkle [animation-delay:-2.5s]" />
      <div className="landing-ambient-animate absolute right-[18%] top-[38%] h-2.5 w-2.5 rounded-full bg-orange/40 animate-float-y-alt [animation-delay:-0.5s]" />
      <div className="landing-ambient-animate absolute right-[28%] top-[72%] h-1.5 w-1.5 rounded-full bg-white/30 animate-twinkle [animation-delay:-3.5s]" />
      <div className="landing-ambient-animate absolute left-[40%] top-[88%] h-16 w-16 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-float-y-alt [animation-delay:-6s]" />
      <div className="landing-ambient-animate absolute right-[8%] top-[55%] h-12 w-12 rounded-full border border-orange/20 bg-orange/[0.06] animate-drift [animation-delay:-8s]" />
      <div className="landing-ambient-animate absolute left-[6%] top-[30%] h-20 w-20 rounded-full border border-white/10 bg-transparent animate-spin-slow opacity-40" />
    </div>
  );
}
