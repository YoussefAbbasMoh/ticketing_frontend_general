import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { PricingCard } from '@/landing/components/ui/PricingCard';
import { SELECTED_PLAN_STORAGE_KEY } from '@/landing/lib/config';
import { useLandingLang } from '@/landing/LandingLangContext';
import { sortPlansForLanding, type ApiPlan } from '@/landing/lib/plans';

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** When `/subscriptions/plans` is unavailable (offline or error). */
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
  const { lang, copy } = useLandingLang();
  const pc = copy.pricing;
  const locale = lang === 'ar' ? 'ar-EG' : 'en-EG';

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

    if (plan.id === 'free' && plansFromApi && monthly === 0) {
      return (
        <span className="text-3xl md:text-4xl">
          {pc.freeLabel}{' '}
          <span className="text-lg font-cairo font-medium text-white/50">{pc.perWorkspace}</span>
        </span>
      );
    }

    if (perSeat) {
      return (
        <span className="text-3xl md:text-4xl">
          {formatMoney(monthly, cur, locale)}
          <span className="text-lg font-cairo font-medium text-white/50"> {pc.seatMo}</span>
        </span>
      );
    }

    return (
      <span className="text-3xl md:text-4xl">
        {formatMoney(monthly, cur, locale)}
        <span className="text-lg font-cairo font-medium text-white/50"> {pc.perMonth}</span>
      </span>
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

  const starterMissing =
    starter.id === 'free' ? pc.starterMissing : undefined;

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
            {pc.title} <span className="text-orange">{pc.titleAccent}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-cairo text-white/65">{pc.subtitle}</p>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          <PricingCard
            title={starter.name}
            subtitle={starter.description || pc.starterSubtitleFallback}
            priceNode={priceLabel(starter, false)}
            features={starterFeatures}
            missingFeatures={starterMissing}
            ctaLabel={pc.ctaStarter}
            href="#signup"
            ctaOnClick={stashSelectedPlan(starter.id)}
          />
          <PricingCard
            featured
            badge={pc.badgePopular}
            title={growth.name}
            subtitle={growth.description || pc.growthSubtitleFallback}
            priceNode={priceLabel(growth, true)}
            features={growthFeatures}
            ctaLabel={pc.ctaGrowth}
            href="#signup"
            ctaOnClick={stashSelectedPlan(growth.id)}
          />
          <PricingCard
            title={business.name}
            subtitle={business.description || pc.businessSubtitleFallback}
            priceNode={priceLabel(business, true)}
            features={businessFeatures}
            ctaLabel={pc.ctaBusiness}
            href="mailto:sales@tik.app?subject=Tik%20Business%20plan"
          />
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center font-cairo text-sm text-white/50">
          {pc.footnote}
        </p>
      </div>
    </section>
  );
}
