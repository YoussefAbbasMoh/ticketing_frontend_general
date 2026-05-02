import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { PricingCard } from '@/landing/components/ui/PricingCard';
import { SELECTED_PLAN_STORAGE_KEY } from '@/landing/lib/config';
import {
  annualDisplayPrice,
  sortPlansForLanding,
  type ApiPlan,
} from '@/landing/lib/plans';

function formatMoney(value: number, currency: string = 'EGP') {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** When `/subscriptions/plans` is unavailable (e.g. auth-only). */
const FALLBACK_PLANS: ApiPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'For small teams getting organized.',
    billingPeriod: 'monthly',
    price: 199,
    currency: 'EGP',
    features: [
      'All 3 modules — tickets, chat, attendance',
      'Up to 15 seats',
      '1 admin',
      '5GB storage',
      'Basic reports',
      'Email support',
    ],
  },
  {
    id: 'basic',
    name: 'Growth',
    description: 'For growing companies that need scale.',
    billingPeriod: 'monthly',
    price: 59,
    currency: 'EGP',
    features: [
      'Up to 200 seats',
      'Multiple admins',
      '50GB storage',
      'Advanced reports & dashboards',
      'GPS check-in & attendance exports',
      'Departments & structured roles',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Business',
    description: 'For larger operations and compliance needs.',
    billingPeriod: 'monthly',
    price: 49,
    currency: 'EGP',
    features: [
      '200+ seats',
      'API access',
      'Custom onboarding',
      'Dedicated account manager',
      'Annual invoicing',
      'On-premise option (by agreement)',
    ],
  },
];

const STARTER_MISSING = [
  'Multiple admins',
  'GPS check-in',
  'Payroll-ready export',
];

function stashSelectedPlan(planId: string) {
  return () => {
    try {
      sessionStorage.setItem(SELECTED_PLAN_STORAGE_KEY, planId);
    } catch {
      /* private mode / quota */
    }
  };
}

export function Pricing({ plansFromApi }: { plansFromApi: ApiPlan[] | null }) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const { starter, growth, business } = useMemo(() => {
    const list =
      plansFromApi && plansFromApi.length > 0
        ? sortPlansForLanding(plansFromApi)
        : FALLBACK_PLANS;
    const byId = Object.fromEntries(list.map((p) => [p.id, p]));
    return {
      starter: byId.free || list[0],
      growth: byId.basic || list.find((p) => p.id !== 'free') || list[1],
      business:
        byId.pro ||
        [...list].reverse().find((p) => p.id !== 'free' && p.id !== (byId.basic?.id || '')) ||
        list[2],
    };
  }, [plansFromApi]);

  const priceLabel = (plan: ApiPlan, perSeat: boolean) => {
    const cur = plan.currency || 'EGP';
    const monthly = Number(plan.price) || 0;
    const annualMonthlySeat = Math.round(monthly * 0.8);
    const annualTotal = annualDisplayPrice(plan, monthly);

    if (plan.id === 'free' && plansFromApi && monthly === 0) {
      return (
        <span className="text-3xl md:text-4xl">
          Free <span className="text-lg font-cairo font-medium text-white/50">/ workspace</span>
        </span>
      );
    }

    if (perSeat) {
      const m = billing === 'monthly' ? monthly : annualMonthlySeat;
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${plan.id}-${billing}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {formatMoney(m, cur)}
            <span className="text-lg font-cairo font-medium text-white/50">
              {' '}
              / seat / mo{billing === 'annual' ? ' (billed annually)' : ''}
            </span>
          </motion.div>
        </AnimatePresence>
      );
    }

    const flat =
      billing === 'monthly' ? monthly : Math.round(annualTotal / 12);
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${plan.id}-${billing}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {formatMoney(flat, cur)}
          <span className="text-lg font-cairo font-medium text-white/50">
            {' '}
            / month{billing === 'annual' ? ' (annual, equiv.)' : ''}
          </span>
        </motion.div>
      </AnimatePresence>
    );
  };

  const starterFeatures = starter.features?.length
    ? starter.features
    : FALLBACK_PLANS[0].features;
  const growthFeatures = growth.features?.length
    ? growth.features
    : FALLBACK_PLANS[1].features;
  const businessFeatures = business.features?.length
    ? business.features
    : FALLBACK_PLANS[2].features;

  return (
    <section id="pricing" className="py-[120px]">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h2 className="font-cairo text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight text-white">
            Simple pricing. <span className="text-orange">Serious value.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-cairo text-white/65">
            Plans sync with your workspace bundles when online. Toggle billing to compare
            monthly and annual equivalents.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`cursor-pointer rounded-full px-5 py-2 font-cairo text-sm font-semibold transition-colors ${
                billing === 'monthly'
                  ? 'bg-orange text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`cursor-pointer rounded-full px-5 py-2 font-cairo text-sm font-semibold transition-colors ${
                billing === 'annual'
                  ? 'bg-orange text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Annual
            </button>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-cairo text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            Save 20%
          </span>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          <PricingCard
            title={starter.name}
            subtitle={starter.description || 'For up to 15 seats'}
            priceNode={priceLabel(starter, false)}
            features={starterFeatures}
            missingFeatures={starter.id === 'free' ? STARTER_MISSING : undefined}
            ctaLabel="Get Started Free →"
            href="#signup"
            ctaOnClick={stashSelectedPlan(starter.id)}
          />
          <PricingCard
            featured
            badge="⭐ MOST POPULAR"
            title={growth.name}
            subtitle={growth.description || 'Min 10 seats · full operations suite'}
            priceNode={priceLabel(growth, true)}
            features={growthFeatures}
            ctaLabel="Start 14-Day Free Trial →"
            href="#signup"
            ctaOnClick={stashSelectedPlan(growth.id)}
          />
          <PricingCard
            title={business.name}
            subtitle={business.description || '200+ seats · enterprise options'}
            priceNode={priceLabel(business, true)}
            features={businessFeatures}
            ctaLabel="Contact Sales →"
            href="mailto:sales@tik.app?subject=Tik%20Business%20plan"
          />
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center font-cairo text-sm text-white/50">
          All prices in EGP. Fawry, Vodafone Cash, bank transfer, and credit cards accepted.
          14-day free trial, no credit card required. Bundle details follow your company&apos;s
          live plan catalog in the product.
        </p>
      </div>
    </section>
  );
}
