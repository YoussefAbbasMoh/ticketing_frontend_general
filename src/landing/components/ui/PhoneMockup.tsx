import { CheckSquare, MessageCircle, Settings, Ticket } from 'lucide-react';
import { useLandingLang } from '@/landing/LandingLangContext';
import { TikLogoIcon } from './TikLogo';

const toneByVariant = {
  open: 'bg-orange/20 text-orange',
  review: 'bg-amber-500/20 text-amber-300',
  done: 'bg-emerald-500/20 text-emerald-300',
} as const;

/** CSS-only — avoids pulling framer-motion into the LCP / hero chunk. */
export function PhoneMockup() {
  const { copy } = useLandingLang();
  const m = copy.phoneMockup;

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-navy to-navy-dark p-1 shadow-[0_0_60px_rgba(255,78,13,0.15)]">
        <div className="rounded-[2.25rem] bg-navy-dark/95 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TikLogoIcon size={28} />
              <span className="font-cairo text-sm font-bold text-white" translate="no">
                tik<span className="text-orange">.</span>
              </span>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 ring-2 ring-orange/30" />
          </div>
          <p className="font-cairo text-lg font-bold text-white">{m.myTickets}</p>
          <div className="mt-4 space-y-3">
            {m.ticketRows.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-white/50">
                  <span className="tabular-nums">{t.id}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${toneByVariant[t.variant]}`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 font-cairo text-sm leading-snug text-white/90">{t.title}</p>
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

      <div className="landing-ambient-animate absolute -end-2 top-8 hidden w-[200px] animate-float-y-alt rounded-xl border border-white/10 bg-navy-mid/95 p-4 shadow-xl backdrop-blur-sm [animation-delay:-2s] md:block lg:-end-8">
        <p className="font-cairo text-xs font-semibold uppercase tracking-wider text-white/50">
          {m.weekTitle}
        </p>
        <div className="mt-2 space-y-1 font-cairo text-sm text-white">
          <p>
            <span className="text-emerald-400">{m.statResolvedLabel}</span>{' '}
            <span className="tabular-nums">{m.statResolvedValue}</span>
          </p>
          <p>
            <span className="text-red-400">{m.statOverdueLabel}</span>{' '}
            <span className="tabular-nums">{m.statOverdueValue}</span>
          </p>
          <p>
            <span className="text-amber-300">{m.statReviewLabel}</span>{' '}
            <span className="tabular-nums">{m.statReviewValue}</span>
          </p>
        </div>
      </div>

      <div className="landing-ambient-animate absolute -start-4 bottom-16 hidden w-[220px] animate-float-y-slow rounded-xl border border-white/10 bg-navy-mid/95 p-4 shadow-xl backdrop-blur-sm [animation-delay:-5s] md:block lg:-start-10">
        <p className="font-cairo text-xs font-semibold uppercase tracking-wider text-white/50">
          {m.checkInsTitle}
        </p>
        <ul className="mt-2 space-y-1 font-cairo text-sm text-white/90">
          {m.checkIns.map((row, i) => (
            <li key={i} className={row.warning ? 'text-red-300' : undefined}>
              {row.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
