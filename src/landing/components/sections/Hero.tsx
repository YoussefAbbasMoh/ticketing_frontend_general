import { HeroAmbientLayer } from '@/landing/components/effects/HeroAmbientLayer';
import { HeroParallaxVisuals, useHeroParallaxMotion } from '@/landing/components/effects/HeroParallaxMotion';
import { LinkButton } from '@/landing/components/ui/Button';
import { PhoneMockup } from '@/landing/components/ui/PhoneMockup';
import { useLandingLang } from '@/landing/LandingLangContext';

/**
 * Headline stays static for LCP. CSS orbs + framer mouse parallax on decor only.
 */
export function Hero() {
  const { reduce, springX, springY, onPointerMove, onPointerLeave } = useHeroParallaxMotion();
  const { copy } = useLandingLang();
  const h = copy.hero;
  const stats = [
    [h.stat1a, h.stat1b],
    [h.stat2a, h.stat2b],
    [h.stat3a, h.stat3b],
  ];

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-20 h-[600px] w-[600px] animate-hero-orb-right rounded-full bg-orange/15 blur-[100px] will-change-transform"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-[400px] w-[400px] animate-hero-orb-left rounded-full bg-navy/40 blur-[100px] will-change-transform"
      />

      <HeroAmbientLayer />

      <HeroParallaxVisuals springX={springX} springY={springY} reduce={reduce} />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-8">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
            </span>
            <span className="font-cairo text-sm text-white/80">{h.badge}</span>
          </div>

          <h1 className="font-cairo text-[clamp(40px,8vw,96px)] font-extrabold leading-[1.02] tracking-tight text-white">
            {h.titleBefore}{' '}
            <span className="text-orange">{h.titleAccent}</span>
            {h.titleAfter}
          </h1>

          <p className="mt-6 font-cairo text-lg text-white/70 md:text-xl">{h.description}</p>

          <div className="mt-8 flex min-h-[52px] flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton variant="primary" href="#signup" className="px-8 py-4 text-base">
              {h.ctaPrimary}
            </LinkButton>
            <LinkButton variant="ghost" href="#platform" className="px-8 py-4 text-base">
              {h.ctaSecondary}
            </LinkButton>
          </div>

          <div className="mt-12 grid min-h-[88px] grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
            {stats.map(([a, b]) => (
              <div key={a + b}>
                <p className="font-cairo text-xl font-bold text-white">{a}</p>
                <p className="font-cairo text-sm text-white/50">{b}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-[520px]">
          <div className="landing-ambient-animate flex min-h-[360px] items-center justify-center animate-phone-sway sm:min-h-[420px] lg:min-h-[520px]">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
