import { motion } from 'framer-motion';
import { BadgeCheck, MessageSquare, Ticket } from 'lucide-react';
import { FeatureCard } from '@/landing/components/ui/FeatureCard';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

export function Features() {
  return (
    <section id="features" className="py-[120px]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <h2 className="font-cairo text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight text-white">
            Everything your team needs.{' '}
            <span className="text-orange">Nothing extra.</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <FeatureCard
            icon={<Ticket className="h-7 w-7" strokeWidth={2} />}
            title="Project Tickets"
            description="Turn requests into accountable work — with history, owners, and deadlines."
            bullets={[
              'Create tickets per project or department',
              'Assign owners & set due dates',
              'Automatic overdue alerts to managers',
              'Priority levels & SLA timers',
              'Full activity log per ticket',
              'Manager dashboard — live status overview',
            ]}
          />
          <FeatureCard
            tinted
            icon={<MessageSquare className="h-7 w-7" strokeWidth={2} />}
            title="Team Messaging"
            description="Structured chat that connects to real work — not another noisy group."
            bullets={[
              'Direct & group messaging',
              'Channels per project or department',
              'Convert any message to a ticket in one tap',
              'Pinned announcements with read receipts',
              'File sharing with organized storage',
              'Multi-company workspace switcher',
            ]}
          />
          <FeatureCard
            icon={<BadgeCheck className="h-7 w-7" strokeWidth={2} />}
            title="Attendance Tracking"
            description="Know who is in — with policies, approvals, and exports finance can use."
            bullets={[
              'GPS-verified check-in & check-out',
              'Shift scheduling & management',
              'Leave request & approval workflow',
              'Late arrival instant manager alerts',
              'Monthly payroll-ready export',
              'Multi-location & field employee support',
            ]}
          />
        </div>

        <motion.div
          {...fadeUp}
          className="mt-12 grid gap-8 rounded-2xl border border-orange/40 bg-gradient-to-br from-orange/[0.08] to-transparent p-8 lg:grid-cols-2 lg:items-center"
        >
          <div>
            <p className="font-cairo text-2xl font-semibold text-white">
              The Daily Digest — every morning at 9am
            </p>
            <p className="mt-3 font-cairo text-white/70">
              Managers get a single summary: overdue tickets, attendance exceptions,
              and must-read announcements — without opening five different apps.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-navy-dark/80 p-5 font-cairo text-sm text-white/90 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
              Preview
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-red-400">●</span> 3 overdue tickets
              </li>
              <li>
                <span className="text-amber-300">●</span> 2 employees late
              </li>
              <li>
                <span className="text-orange">●</span> 1 pinned announcement
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
