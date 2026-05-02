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
    ? 'relative scale-100 border-2 border-orange shadow-[0_0_48px_rgba(255,78,13,0.25)] md:scale-[1.03]'
    : 'border border-white/[0.09]';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className={`relative flex h-full flex-col rounded-2xl bg-white/[0.04] p-8 ${shell}`}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange px-4 py-1 text-xs font-cairo font-bold text-white shadow-lg">
          {badge}
        </div>
      ) : null}
      <h3 className="font-cairo text-2xl font-bold text-white">{title}</h3>
      <p className="mt-2 font-cairo text-white/65">{subtitle}</p>
      <div className="mt-6 font-cairo text-3xl font-bold text-white md:text-4xl">
        {priceNode}
      </div>
      <ul className="mt-8 flex-1 space-y-3 font-cairo text-sm text-white/85">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-orange">✓</span>
            <span>{f}</span>
          </li>
        ))}
        {(missingFeatures || []).map((f) => (
          <li key={f} className="flex gap-2 text-white/35 line-through">
            <span>—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {href ? (
          <LinkButton
            variant={featured ? 'primary' : 'outline'}
            href={href}
            className="w-full py-3.5"
            onClick={() => ctaOnClick?.()}
          >
            {ctaLabel}
          </LinkButton>
        ) : (
          <Button
            variant={featured ? 'primary' : 'outline'}
            className="w-full py-3.5"
            onClick={onCta}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
