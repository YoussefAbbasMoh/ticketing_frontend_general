import { motion } from 'framer-motion';
import { TestimonialCard } from '@/landing/components/ui/TestimonialCard';

export function Testimonials() {
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
          Teams that switched <span className="text-orange">to Tik.</span>
        </motion.h2>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <TestimonialCard
            initials="KM"
            name="Khaled Mansour"
            role="Operations Manager, Cairo"
            quote="We were running everything on WhatsApp groups. Tik gave us structure overnight. Now I can open one screen and know exactly what my team is working on and who checked in."
          />
          <TestimonialCard
            initials="NH"
            name="Nour Hassan"
            role="HR Director, Alexandria"
            quote="The attendance export alone saved our HR team 3 hours every month. No more manual Excel sheets. It just works, and my accountant loves the payroll-ready format."
          />
          <TestimonialCard
            initials="SA"
            name="Sara Abdelhady"
            role="CEO, Digital Agency"
            quote="As a growing agency with 40 people across two offices, we needed one place. Tik was set up in a single afternoon. The team adopted it immediately."
          />
        </div>
      </div>
    </section>
  );
}
