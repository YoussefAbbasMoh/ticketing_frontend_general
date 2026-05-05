import { motion } from 'framer-motion';
import { BadgeCheck, MessageSquare, Ticket } from 'lucide-react';
import { FeatureCard } from '@/landing/components/ui/FeatureCard';
import { useLandingLang } from '@/landing/LandingLangContext';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

export function Features() {
  const { copy } = useLandingLang();
  const f = copy.features;

  return (
    <section id="features" className="py-[120px]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <h2 className="font-cairo text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight text-white">
            {f.sectionTitle}{' '}
            <span className="text-orange">{f.sectionAccent}</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <FeatureCard
            icon={<Ticket className="h-7 w-7" strokeWidth={2} />}
            title={f.tickets.title}
            description={f.tickets.description}
            bullets={f.tickets.bullets}
          />
          <FeatureCard
            tinted
            icon={<MessageSquare className="h-7 w-7" strokeWidth={2} />}
            title={f.messaging.title}
            description={f.messaging.description}
            bullets={f.messaging.bullets}
          />
          <FeatureCard
            icon={<BadgeCheck className="h-7 w-7" strokeWidth={2} />}
            title={f.attendance.title}
            description={f.attendance.description}
            bullets={f.attendance.bullets}
          />
        </div>

        {/* <motion.div
          {...fadeUp}
          className="mt-12 grid gap-8 rounded-2xl border border-orange/40 bg-gradient-to-br from-orange/[0.08] to-transparent p-8 lg:grid-cols-2 lg:items-center"
        >
          <div>
            <p className="font-cairo text-2xl font-semibold text-white">{f.digestTitle}</p>
            <p className="mt-3 font-cairo text-white/70">{f.digestDescription}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-navy-dark/80 p-5 font-cairo text-sm text-white/90 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
              {f.previewLabel}
            </p>
            <ul className="mt-3 space-y-2">
              {f.previewLines.map((line) => (
                <li key={line}>
                  <span className="text-orange">●</span> {line}
                </li>
              ))}
            </ul>
          </div>
        </motion.div> */}
      </div>
    </section>
  );
}
