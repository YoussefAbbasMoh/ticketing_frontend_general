import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { PricingCard } from '@/landing/components/ui/PricingCard';
import { SELECTED_PLAN_STORAGE_KEY } from '@/landing/lib/config';
import { getApiBaseUrl } from '@/landing/lib/config';
import { useLandingLang } from '@/landing/LandingLangContext';
import {
  assignLandingPlanSlots,
  isActiveLandingPlan,
  normalizePlanTier,
  planCanCheckoutWithPaymob,
  planSeatCapForPricing,
  type ApiPlan,
} from '@/landing/lib/plans';

function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPerSeatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
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

const STATIC_BUNDLE5_ID = 'landing-bundle-5';

function createStaticBundle5(pc: {
  bundle5Title: string;
  bundle5Subtitle: string;
  bundle5Features: readonly string[];
}): ApiPlan {
  return {
    id: STATIC_BUNDLE5_ID,
    name: pc.bundle5Title,
    description: pc.bundle5Subtitle,
    billingPeriod: 'monthly',
    price: 0,
    currency: 'EGP',
    features: [...pc.bundle5Features],
  };
}

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
  const [showContactForm, setShowContactForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    seats: '30+',
    message: '',
  });

  const { starter, growth, business, enterprisePlan, fifthFromApi, featuredPlanId } = useMemo(() => {
    const hasApi = Boolean(plansFromApi && plansFromApi.length > 0);
    const activeApi = hasApi ? plansFromApi!.filter(isActiveLandingPlan) : [];
    const useLiveCatalog = hasApi && activeApi.length > 0;
    const list = useLiveCatalog ? activeApi : FALLBACK_PLANS;
    const slots = assignLandingPlanSlots(list);

    let featuredId: string | null = null;
    if (useLiveCatalog) {
      const popular = activeApi.find((p) => p.isPopular);
      if (popular) featuredId = popular.id;
      else {
        const basic = activeApi.find((p) => normalizePlanTier(p.name) === 'basic');
        if (basic) featuredId = basic.id;
      }
    } else {
      featuredId = slots.growth.id;
    }

    return {
      starter: slots.starter,
      growth: slots.growth,
      business: slots.business,
      enterprisePlan: useLiveCatalog ? slots.enterprise : null,
      fifthFromApi: useLiveCatalog ? slots.fifth : null,
      featuredPlanId: featuredId,
    };
  }, [plansFromApi]);

  const fifthPlan = fifthFromApi ?? createStaticBundle5(pc);

  const perSeatBelow = (plan: ApiPlan) => {
    if (!plansFromApi) return null;
    const cur = plan.currency || 'EGP';
    const monthly = Number(plan.price) || 0;
    const cap = planSeatCapForPricing(plan);
    if (cap == null || monthly <= 0) return null;
    const perSeat = monthly / cap;
    const line = pc.perSeatAverage.replace(
      '{price}',
      formatPerSeatMoney(perSeat, cur, locale)
    );
    return (
      <div className="mt-2 block text-base font-cairo font-semibold text-white/60 md:text-lg">
        {line}
      </div>
    );
  };

  const priceLabel = (plan: ApiPlan, legacySeatSuffix: boolean) => {
    const cur = plan.currency || 'EGP';
    const monthly = Number(plan.price) || 0;
    const tier = normalizePlanTier(plan.name);
    const isFreeTier = tier === 'free' && monthly === 0;

    if (plansFromApi && isFreeTier) {
      return (
        <span className="text-3xl md:text-4xl">
          {pc.freeLabel}{' '}
          <span className="text-lg font-cairo font-medium text-white/50">{pc.perWorkspace}</span>
        </span>
      );
    }

    if (!plansFromApi && plan.id === 'free' && monthly === 0) {
      return (
        <span className="text-3xl md:text-4xl">
          {pc.freeLabel}{' '}
          <span className="text-lg font-cairo font-medium text-white/50">{pc.perWorkspace}</span>
        </span>
      );
    }

    if (legacySeatSuffix) {
      return (
        <>
          <span className="text-3xl md:text-4xl">
            {formatMoney(monthly, cur, locale)}
            <span className="text-lg font-cairo font-medium text-white/50"> {pc.seatMo}</span>
          </span>
          {perSeatBelow(plan)}
        </>
      );
    }

    return (
      <>
        <span className="text-3xl md:text-4xl">
          {formatMoney(monthly, cur, locale)}
          <span className="text-lg font-cairo font-medium text-white/50"> {pc.perMonth}</span>
        </span>
        {perSeatBelow(plan)}
      </>
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

  const fifthFeatures = fifthPlan.features?.length
    ? fifthPlan.features
    : [...pc.bundle5Features];

  const starterMissing =
    plansFromApi || starter.id !== 'free' ? undefined : pc.starterMissing;

  const enterpriseFeaturesFallback = [
    '30+ seats',
    'Priority onboarding',
    'Dedicated success manager',
    'Custom integrations',
    'Advanced security controls',
  ];

  const handleEnterpriseClick = () => {
    setShowContactForm(true);
    setContactSuccess('');
    setContactError('');
    setTimeout(() => {
      const formEl = document.getElementById('enterprise-contact-form');
      formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.company.trim() || !contactForm.seats.trim()) {
      setContactError(pc.contactRequired);
      return;
    }

    setSubmitting(true);
    setContactError('');
    setContactSuccess('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/landing/contact-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || pc.contactError);
      }
      setContactSuccess(pc.contactSuccess);
      setContactForm({
        name: '',
        email: '',
        company: '',
        phone: '',
        seats: '30+',
        message: '',
      });
    } catch {
      setContactError(pc.contactError);
    } finally {
      setSubmitting(false);
    }
  };

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

        <div className="mx-auto mt-16 grid max-w-[1680px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-5 xl:items-stretch 2xl:gap-6">
          <PricingCard
            featured={starter.id === featuredPlanId}
            badge={starter.id === featuredPlanId ? pc.badgePopular : undefined}
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
            featured={growth.id === featuredPlanId}
            badge={growth.id === featuredPlanId ? pc.badgePopular : undefined}
            title={growth.name}
            subtitle={growth.description || pc.growthSubtitleFallback}
            priceNode={priceLabel(growth, !plansFromApi)}
            features={growthFeatures}
            ctaLabel={planCanCheckoutWithPaymob(growth) ? pc.ctaGrowth : pc.ctaEnterprise}
            {...(planCanCheckoutWithPaymob(growth)
              ? { href: '#signup' as const, ctaOnClick: stashSelectedPlan(growth.id) }
              : { onCta: handleEnterpriseClick })}
          />
          <PricingCard
            featured={business.id === featuredPlanId}
            badge={business.id === featuredPlanId ? pc.badgePopular : undefined}
            title={business.name}
            subtitle={business.description || pc.businessSubtitleFallback}
            priceNode={priceLabel(business, !plansFromApi)}
            features={businessFeatures}
            ctaLabel={planCanCheckoutWithPaymob(business) ? pc.ctaGrowth : pc.ctaEnterprise}
            {...(planCanCheckoutWithPaymob(business)
              ? { href: '#signup' as const, ctaOnClick: stashSelectedPlan(business.id) }
              : { onCta: handleEnterpriseClick })}
          />
          <PricingCard
            featured={Boolean(enterprisePlan && enterprisePlan.id === featuredPlanId)}
            badge={
              enterprisePlan && enterprisePlan.id === featuredPlanId ? pc.badgePopular : undefined
            }
            title={enterprisePlan?.name ?? pc.enterpriseTitle}
            subtitle={enterprisePlan?.description ?? pc.enterpriseSubtitleFallback}
            priceNode={
              enterprisePlan
                ? priceLabel(enterprisePlan, !plansFromApi)
                : (
                    <span className="text-3xl md:text-4xl">
                      {pc.enterprisePriceLabel}
                    </span>
                  )
            }
            features={
              enterprisePlan?.features?.length
                ? enterprisePlan.features
                : enterpriseFeaturesFallback
            }
            ctaLabel={
              enterprisePlan && planCanCheckoutWithPaymob(enterprisePlan)
                ? pc.ctaGrowth
                : pc.ctaEnterprise
            }
            {...(enterprisePlan && planCanCheckoutWithPaymob(enterprisePlan)
              ? { href: '#signup' as const, ctaOnClick: stashSelectedPlan(enterprisePlan.id) }
              : { onCta: handleEnterpriseClick })}
          />
          <PricingCard
            featured={fifthPlan.id === featuredPlanId}
            badge={fifthPlan.id === featuredPlanId ? pc.badgePopular : undefined}
            title={fifthPlan.name}
            subtitle={fifthPlan.description || pc.bundle5Subtitle}
            priceNode={
              fifthFromApi ? (
                priceLabel(fifthPlan, !plansFromApi)
              ) : (
                <span className="text-3xl md:text-4xl">{pc.bundle5PriceLabel}</span>
              )
            }
            features={fifthFeatures}
            ctaLabel={
              planCanCheckoutWithPaymob(fifthPlan) ? pc.ctaGrowth : pc.ctaEnterprise
            }
            {...(planCanCheckoutWithPaymob(fifthPlan)
              ? {
                  href: '#signup' as const,
                  ctaOnClick:
                    fifthPlan.id === STATIC_BUNDLE5_ID
                      ? undefined
                      : stashSelectedPlan(fifthPlan.id),
                }
              : { onCta: handleEnterpriseClick })}
          />
        </div>

        {showContactForm ? (
          <div id="enterprise-contact-form" className="mx-auto mt-12 w-full max-w-3xl rounded-2xl border border-white/15 bg-white/[0.04] p-6 md:p-8">
            <h3 className="font-cairo text-2xl font-bold text-white">{pc.contactFormTitle}</h3>
            <p className="mt-2 font-cairo text-white/65">{pc.contactFormSubtitle}</p>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleContactSubmit}>
              <input
                value={contactForm.name}
                onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={pc.contactName}
                className="w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none"
                required
              />
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={pc.contactEmail}
                className="w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none"
                required
              />
              <input
                value={contactForm.company}
                onChange={(e) => setContactForm((prev) => ({ ...prev, company: e.target.value }))}
                placeholder={pc.contactCompany}
                className="w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none"
                required
              />
              <input
                value={contactForm.phone}
                onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={pc.contactPhone}
                className="w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none"
              />
              <input
                value={contactForm.seats}
                onChange={(e) => setContactForm((prev) => ({ ...prev, seats: e.target.value }))}
                placeholder={pc.contactSeats}
                className="w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none md:col-span-2"
                required
              />
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder={pc.contactMessage}
                className="min-h-[120px] w-full rounded-xl border border-white/15 bg-[#0b123f] px-4 py-3 font-cairo text-white placeholder:text-white/50 focus:border-orange focus:outline-none md:col-span-2"
              />
              {contactError ? <p className="md:col-span-2 text-sm font-cairo text-red-300">{contactError}</p> : null}
              {contactSuccess ? <p className="md:col-span-2 text-sm font-cairo text-emerald-300">{contactSuccess}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="md:col-span-2 rounded-xl bg-orange px-5 py-3 font-cairo font-bold text-white transition hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? pc.contactSending : pc.contactSubmit}
              </button>
            </form>
          </div>
        ) : null}

        <p className="mx-auto mt-10 max-w-3xl text-center font-cairo text-sm text-white/50">
          {pc.footnote}
        </p>
      </div>
    </section>
  );
}

