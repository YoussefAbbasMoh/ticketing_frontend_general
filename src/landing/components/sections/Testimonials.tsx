import { motion } from 'framer-motion';
import { TestimonialCard } from '@/landing/components/ui/TestimonialCard';
import { useLandingLang } from '@/landing/LandingLangContext';

export function Testimonials() {
  const { copy } = useLandingLang();
  const t = copy.testimonials;

  return (
    <section id="testimonials" className="py-[120px]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center font-cairo text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight text-white"
        >
          {t.title} <span className="text-orange">{t.titleAccent}</span>
        </motion.h2>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {t.cards.map((card) => (
            <TestimonialCard
              key={card.name}
              initials={card.initials}
              name={card.name}
              role={card.role}
              quote={card.quote}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
