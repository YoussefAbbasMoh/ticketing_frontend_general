import { CheckSquare, MessageCircle, Settings, Ticket } from 'lucide-react';
import { TikLogoIcon } from './TikLogo';

const tickets = [
  { id: '#1842', status: 'OPEN', title: 'Client onboarding checklist', tone: 'bg-orange/20 text-orange' },
  { id: '#1840', status: 'REVIEW', title: 'Q4 logistics report', tone: 'bg-amber-500/20 text-amber-300' },
  { id: '#1838', status: 'DONE', title: 'Payroll export — Oct', tone: 'bg-emerald-500/20 text-emerald-300' },
];

/** CSS-only — avoids pulling framer-motion into the LCP / hero chunk. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-navy to-navy-dark p-1 shadow-[0_0_60px_rgba(255,78,13,0.15)]">
        <div className="rounded-[2.25rem] bg-navy-dark/95 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TikLogoIcon size={28} />
              <span className="font-cairo text-sm font-bold text-white">
                tik<span className="text-orange">.</span>
              </span>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 ring-2 ring-orange/30" />
          </div>
          <p className="font-cairo text-lg font-bold text-white">My Tickets</p>
          <div className="mt-4 space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
              >
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{t.id}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${t.tone}`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 font-cairo text-sm text-white/90">{t.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-around border-t border-white/10 pt-3 text-white/60">
            <Ticket className="h-5 w-5 text-orange" strokeWidth={2} />
            <MessageCircle className="h-5 w-5" strokeWidth={2} />
            <CheckSquare className="h-5 w-5" strokeWidth={2} />
            <Settings className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-8 hidden w-[200px] rounded-xl border border-white/10 bg-navy-mid/95 p-4 shadow-xl backdrop-blur-sm md:block lg:-right-8">
        <p className="font-cairo text-xs font-semibold uppercase tracking-wider text-white/50">
          This week
        </p>
        <div className="mt-2 font-cairo text-sm text-white">
          <p>
            <span className="text-emerald-400">Resolved</span> 24
          </p>
          <p>
            <span className="text-red-400">Overdue</span> 3
          </p>
          <p>
            <span className="text-amber-300">In review</span> 7
          </p>
        </div>
      </div>

      <div className="absolute -left-4 bottom-16 hidden w-[220px] rounded-xl border border-white/10 bg-navy-mid/95 p-4 shadow-xl backdrop-blur-sm md:block lg:-left-10">
        <p className="font-cairo text-xs font-semibold uppercase tracking-wider text-white/50">
          Today&apos;s check-ins
        </p>
        <ul className="mt-2 space-y-1 font-cairo text-sm text-white/90">
          <li>Ahmed — 9:02 AM ✓</li>
          <li>Sara — 9:15 AM ✓</li>
          <li className="text-red-300">Karim — Late</li>
        </ul>
      </div>
    </div>
  );
}
