import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button, LinkButton } from './Button';

export function PricingCard({
  badge,
  title,
  subtitle,
  priceNode,
  features,
  missingFeatures,
  ctaLabel,
  href,
  featured,
  onCta,
  ctaOnClick,
}: {
  badge?: string;
  title: string;
  subtitle: string;
  priceNode: ReactNode;
  features: string[];
  missingFeatures?: string[];
  ctaLabel: string;
  href?: string;
  featured?: boolean;
  onCta?: () => void;
  /** Runs before navigation (e.g. stash selected plan for register / subscription). */
  ctaOnClick?: () => void;
}) {
  const shell = featured
    ? 'ring-2 ring-orange shadow-[0_12px_40px_-8px_rgba(255,78,13,0.35)] md:scale-[1.02]'
    : 'ring-1 ring-white/[0.08]';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 md:p-7 ${shell}`}
    >
      {badge ? (
        <div className="absolute -top-px left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-b-lg bg-orange px-3 py-1.5 text-[10px] font-cairo font-bold uppercase tracking-wide text-white shadow-md md:text-xs">
          {badge}
        </div>
      ) : null}

      <div className={badge ? 'pt-4' : ''}>
        <h3 className="font-cairo text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h3>
        <p className="mt-2 min-h-[2.75rem] font-cairo text-sm leading-relaxed text-white/55 md:text-[0.9375rem]">
          {subtitle}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.09] bg-navy-dark/40 px-4 py-4 backdrop-blur-sm">
        <div className="font-cairo font-bold leading-none text-white [&_.text-3xl]:tracking-tight">
          {priceNode}
        </div>
      </div>

      <div className="mt-6 flex-1 border-t border-white/[0.08] pt-6">
        <ul className="space-y-2.5 font-cairo text-[13px] leading-snug text-white/[0.88] md:text-sm">
          {features.map((f) => (
            <li key={f} className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange/18 text-[10px] font-bold text-orange"
                aria-hidden
              >
                ✓
              </span>
              <span>{f}</span>
            </li>
          ))}
          {(missingFeatures || []).map((f) => (
            <li key={f} className="flex gap-3 text-white/35 line-through">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] text-white/25"
                aria-hidden
              >
                —
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7">
        {href ? (
          <LinkButton
            variant={featured ? 'primary' : 'outline'}
            href={href}
            className="w-full py-3.5 text-[0.9375rem] font-bold"
            onClick={() => ctaOnClick?.()}
          >
            {ctaLabel}
          </LinkButton>
        ) : (
          <Button
            variant={featured ? 'primary' : 'outline'}
            className="w-full py-3.5 text-[0.9375rem] font-bold"
            onClick={onCta}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
