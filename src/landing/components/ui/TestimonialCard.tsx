'use client';

import { motion } from 'framer-motion';

export function TestimonialCard({
  quote,
  name,
  role,
  initials,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
}) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-8"
    >
      <div className="mb-4 flex gap-1 text-orange">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} aria-hidden>
            ★
          </span>
        ))}
      </div>
      <blockquote className="font-cairo text-lg italic text-white/90">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange to-orange-dark font-cairo font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>
        <div>
          <p className="font-cairo font-semibold text-white">{name}</p>
          <p className="font-cairo text-sm text-white/55">{role}</p>
        </div>
      </div>
    </motion.article>
  );
}
