import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function FeatureCard({
  icon,
  title,
  description,
  bullets,
  tinted,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  bullets: string[];
  tinted?: boolean;
}) {
  return (
    <motion.article
      whileHover={{
        y: -6,
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
      }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border border-white/[0.09] bg-white/[0.04] p-8 ${
        tinted ? 'bg-orange/[0.06] ring-1 ring-orange/20' : ''
      }`}
    >
      <div className="mb-6 inline-flex rounded-xl bg-orange/15 p-4 text-orange drop-shadow-[0_0_12px_rgba(255,78,13,0.35)]">
        {icon}
      </div>
      <h3 className="font-cairo text-xl font-bold tracking-tight text-white md:text-2xl">
        {title}
      </h3>
      <p className="mt-3 font-cairo text-white/70">{description}</p>
      <ul className="mt-6 space-y-3 font-cairo text-sm text-white/85">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
