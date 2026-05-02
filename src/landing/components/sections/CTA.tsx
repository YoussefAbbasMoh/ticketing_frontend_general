import { motion } from 'framer-motion';
import { LinkButton } from '@/landing/components/ui/Button';

export function CTA() {
  return (
    <section className="py-[120px]">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-mid/80 to-navy-dark px-8 py-16 text-center md:px-16"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              background:
                'radial-gradient(circle at 50% 20%, rgba(255,78,13,1) 0%, transparent 55%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="font-cairo text-[clamp(28px,4vw,48px)] font-extrabold tracking-tight text-white">
              Ready to stop the <span className="text-orange">chaos?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-cairo text-lg text-white/70">
              Join Egyptian and MENA teams who replaced scattered tools with one operations
              hub — tickets, chat, and attendance in sync.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton variant="primary" href="#signup" className="px-8 py-4 text-base">
                Start Free Trial — No Card Needed →
              </LinkButton>
              <LinkButton variant="ghost" href="#pricing" className="px-8 py-4 text-base">
                View Pricing
              </LinkButton>
            </div>
            <p className="mt-6 font-cairo text-sm text-white/45">
              14-day free trial · All 3 modules included · Setup in 20 minutes · Web & Mobile
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
