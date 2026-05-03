import { motion } from 'framer-motion';
import { EyeOff, MessageCircle, Sheet } from 'lucide-react';
import { SectionLabel } from '@/landing/components/ui/SectionLabel';
import { useLandingLang } from '@/landing/LandingLangContext';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const icons = [MessageCircle, Sheet, EyeOff];

export function Problem() {
  const { copy } = useLandingLang();
  const p = copy.problem;

  return (
    <section className="py-[120px]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:px-8">
        <motion.div {...fadeUp}>
          <SectionLabel>{p.sectionLabel}</SectionLabel>
          <h2 className="mt-4 font-cairo text-[clamp(32px,5vw,56px)] font-extrabold leading-tight tracking-tight text-white">
            {p.title}{' '}
            <span className="text-orange">{p.titleAccent}</span>
          </h2>
          <p className="mt-6 font-cairo text-lg text-white/65">{p.description}</p>
          <ul className="mt-10 space-y-5">
            {p.bullets.map((text, i) => {
              const Icon = icons[i];
              return (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.1, duration: 0.55 }}
                  className="flex gap-4"
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange/15 text-orange drop-shadow-[0_0_12px_rgba(255,78,13,0.35)]">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <p className="font-cairo text-base text-white/85">{text}</p>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-8"
        >
          <p className="font-cairo text-sm font-semibold uppercase tracking-wider text-white/45">
            {p.beforeAfter}
          </p>
          <ul className="mt-6 space-y-3">
            {p.beforeItems.map((t) => (
              <li
                key={t}
                className="rounded-lg bg-red-500/10 px-4 py-3 font-cairo text-sm text-red-200/90 line-through decoration-red-300/60"
              >
                {t}
              </li>
            ))}
          </ul>
          <div className="my-6 flex justify-center text-orange">
            <span className="text-2xl" aria-hidden>
              ↓
            </span>
          </div>
          <ul className="space-y-3">
            {p.afterItems.map((t) => (
              <li
                key={t}
                className="rounded-lg bg-emerald-500/10 px-4 py-3 font-cairo text-sm text-emerald-100/95"
              >
                ✓ {t}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
