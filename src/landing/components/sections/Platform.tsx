import { motion } from 'framer-motion';
import { SectionLabel } from '@/landing/components/ui/SectionLabel';
import { Check, Globe, Smartphone } from 'lucide-react';
import { useLandingLang } from '@/landing/LandingLangContext';

const fadeSide = {
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
};

export function Platform() {
  const { copy } = useLandingLang();
  const p = copy.platform;

  const pills = [
    { icon: Globe, label: p.webApp },
    { icon: Smartphone, label: p.iosApp },
    { icon: Smartphone, label: p.androidApp },
  ];

  return (
    <section id="platform" className="py-[120px]">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 lg:grid-cols-2 lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionLabel>{p.sectionLabel}</SectionLabel>
          <h2 className="mt-4 font-cairo text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight text-white">
            {p.title}{' '}
            <span className="text-orange">{p.titleAccent}</span>
          </h2>
          <p className="mt-6 font-cairo text-lg text-white/65">{p.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {pills.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 font-cairo text-sm text-white/85"
              >
                <Icon className="h-4 w-4 text-orange" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
          <ul className="mt-10 space-y-4">
            {p.bullets.map((t) => (
              <li key={t} className="flex gap-3 font-cairo text-white/85">
                <Check className="h-5 w-5 flex-shrink-0 text-orange" strokeWidth={2} />
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...fadeSide} className="relative mx-auto w-full max-w-lg">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-navy to-navy-dark p-3 shadow-[0_0_60px_rgba(13,27,94,0.5)]">
            <div className="aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-navy-dark">
              <div className="flex h-full">
                <div className="w-14 border-r border-white/10 bg-navy-mid/80 p-2">
                  <div className="mb-2 h-8 rounded bg-orange/30" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-2 rounded bg-white/10" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="mb-4 h-6 w-1/3 rounded bg-white/10" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 rounded-lg bg-white/[0.06] ring-1 ring-orange/20" />
                    <div className="h-24 rounded-lg bg-white/[0.06]" />
                    <div className="col-span-2 h-20 rounded-lg bg-white/[0.06]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 right-2 w-[38%] rotate-[-6deg] rounded-[1.75rem] border border-white/15 bg-navy-dark p-2 shadow-xl md:right-0">
            <div className="aspect-[9/16] overflow-hidden rounded-[1.35rem] bg-navy-mid">
              <div className="p-3">
                <div className="mb-3 flex justify-between">
                  <div className="h-3 w-12 rounded bg-white/15" />
                  <div className="h-6 w-6 rounded-full bg-orange/40" />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-white/[0.07]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
