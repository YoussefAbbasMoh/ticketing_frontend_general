import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { SubscriptionPageSkeleton, ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';
import { mergeSubscriptionPlanForDisplay, resolveSubscriptionUiLang } from '../../utils/subscriptionPlanUi';

const KNOWN_PLAN_IDS = ['free', 'basic', 'pro', 'enterprise'];

const normalizePlanId = (raw) => {
  const s = String(raw ?? 'free').trim().toLowerCase();
  if (!s) return 'free';
  return KNOWN_PLAN_IDS.includes(s) ? s : 'free';
};

const formatDate = (value, uiLang) => {
  if (!value) return null;
  const locale = uiLang === 'ar' ? 'ar-EG' : 'en-GB';
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const estimateNextRenewalFromNow = (billingPeriod) => {
  const d = new Date();
  const raw = String(billingPeriod || 'monthly').toLowerCase();
  if (raw === 'yearly' || raw === 'annual' || raw === 'year') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
};

const localizeBillingPeriod = (value, uiLang) => {
  const raw = String(value || '').toLowerCase();
  if (uiLang === 'ar') {
    if (raw === 'monthly') return 'شهريًا';
    if (raw === 'yearly') return 'سنويًا';
  }
  if (raw === 'monthly') return 'Monthly';
  if (raw === 'yearly') return 'Yearly';
  return value || '—';
};

const IconWallet = ({ className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m0 0a2.25 2.25 0 0 1 2.25-2.25H15a3 3 0 0 1 6 0h1.5A2.25 2.25 0 0 1 21 9v3"
    />
  </svg>
);

const IconCalendar = ({ className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
    />
  </svg>
);

const IconArrowPath = ({ className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const SubscriptionCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPlanId = normalizePlanId(searchParams.get('planId'));

  const [lang, setLang] = useState(getStoredLanguage());
  const uiLang = resolveSubscriptionUiLang(lang);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getMySubscription(),
      ]);
      setPlans(plansRes?.data?.plans || []);
      setSubscription(subRes?.data || null);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || t(lang, 'subscriptionLoadError'));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  useEffect(() => {
    if (!loading && (requestedPlanId === 'free' || !KNOWN_PLAN_IDS.includes(requestedPlanId))) {
      navigate('/subscription', { replace: true });
    }
  }, [loading, requestedPlanId, navigate]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === requestedPlanId) || null,
    [plans, requestedPlanId]
  );

  const displaySelectedPlan = useMemo(
    () => (selectedPlan ? mergeSubscriptionPlanForDisplay(lang, selectedPlan) : null),
    [lang, selectedPlan]
  );

  const currentPlanId = normalizePlanId(subscription?.planId);
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId) || null,
    [plans, currentPlanId]
  );

  const displayCurrentPlan = useMemo(
    () => (currentPlan ? mergeSubscriptionPlanForDisplay(lang, currentPlan) : null),
    [lang, currentPlan]
  );

  const formatMoney = useCallback(
    (value, currency = 'EGP') =>
      new Intl.NumberFormat(uiLang === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(Number(value || 0)),
    [uiLang]
  );

  const nextRenewalDate = useMemo(() => {
    if (!selectedPlan) return null;
    return estimateNextRenewalFromNow(selectedPlan.billingPeriod);
  }, [selectedPlan]);

  const handlePaymob = async () => {
    if (!selectedPlan || selectedPlan.id === 'free') return;
    setError('');
    setPaying(true);
    try {
      const res = await subscriptionAPI.createPaymobCheckout({
        planId: selectedPlan.id,
        paymentMethod: 'card',
        returnUrl: `${window.location.origin}/subscription`,
      });
      const checkoutUrl = res?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error(t(lang, 'checkoutUrlMissing'));
      }
      window.location.href = checkoutUrl;
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message || apiError?.message || t(lang, 'checkoutFailed');
      setError(message);
      setPaying(false);
    }
  };

  const dir = uiLang === 'ar' ? 'rtl' : 'ltr';

  if (loading || requestedPlanId === 'free') {
    return <SubscriptionPageSkeleton />;
  }

  if (!selectedPlan) {
    return (
      <div
        dir={dir}
        className="flex min-h-[70vh] w-full items-center justify-center bg-gradient-to-br from-app-background to-app-surface-variant px-4 py-10 sm:py-16"
      >
        <Card className="w-full max-w-md border-app-divider shadow-app-card">
          <Card.Content className="space-y-6 p-6 sm:p-8">
            <Alert variant="error">{t(lang, 'checkoutInvalidPlan')}</Alert>
            <Button variant="secondary" fullWidth size="lg" onClick={() => navigate('/subscription')}>
              {t(lang, 'backToSubscriptionPlans')}
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      lang={lang}
      className="relative isolate min-h-[calc(100dvh-4rem)] w-full overflow-x-hidden bg-gradient-to-br from-app-background via-app-background to-app-surface-variant pb-28 sm:pb-12"
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange/25 via-transparent to-transparent sm:-top-32 sm:h-96"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-20 top-40 h-64 w-64 rounded-full bg-app-primary/10 blur-3xl sm:top-48"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -start-16 bottom-32 h-48 w-48 rounded-full bg-orange-soft/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <button
          type="button"
          onClick={() => navigate('/subscription')}
          className="group mb-5 flex items-center gap-2 text-sm font-medium text-app-text-secondary transition-colors hover:text-app-text sm:mb-6"
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-app-divider bg-app-surface text-app-text-secondary transition group-hover:border-app-primary/40 group-hover:bg-app-surface-variant"
            aria-hidden
          >
            <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </span>
          {t(lang, 'backToSubscriptionPlans')}
        </button>

        <header className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-app-divider bg-app-surface/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-app-text-secondary shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-dark" />
            Paymob
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-app-text sm:text-3xl lg:text-[2rem]">
            {t(lang, 'checkoutTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-app-text-secondary sm:text-base">
            {t(lang, 'checkoutSubtitle')}
          </p>
        </header>

        {error && (
          <div className="mb-5 sm:mb-6">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        <Card className="border-app-divider shadow-app-card ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
          <Card.Header className="border-app-divider bg-gradient-to-br from-app-surface to-app-surface-variant/80 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-app-text-secondary">
                  {t(lang, 'plan')}
                </p>
                <h2 className="mt-1 break-words text-xl font-bold text-app-text sm:text-2xl">
                  {displaySelectedPlan?.name}
                </h2>
                {displaySelectedPlan?.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-app-text-secondary sm:text-[15px]">
                    {displaySelectedPlan.description}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex w-fit shrink-0 rounded-app border border-orange/35 bg-orange-soft/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-orange-dark">
                {localizeBillingPeriod(displaySelectedPlan?.billingPeriod ?? selectedPlan.billingPeriod, uiLang)}
              </span>
            </div>
          </Card.Header>

          <Card.Content className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <section aria-labelledby="plan-change-heading">
              <h3 id="plan-change-heading" className="sr-only">
                {t(lang, 'planChangeSummary')}
              </h3>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-app-text-secondary">
                {t(lang, 'planChangeSummary')}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-2">
                <div className="flex min-h-[88px] flex-col justify-center rounded-app border border-app-divider bg-app-surface-variant/50 p-4 sm:min-h-0">
                  <p className="text-xs font-medium text-app-text-secondary">{t(lang, 'fromPlan')}</p>
                  <p className="mt-1 truncate text-base font-semibold text-app-text sm:text-lg">
                    {displayCurrentPlan?.name || currentPlanId}
                  </p>
                </div>
                <div className="flex items-center justify-center py-1 sm:flex-col sm:justify-center sm:py-0">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-app-divider bg-app-surface text-app-text-secondary shadow-sm sm:h-9 sm:w-9"
                    aria-hidden
                  >
                    <svg className="h-5 w-5 rotate-90 sm:rotate-0 rtl:sm:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
                <div className="flex min-h-[88px] flex-col justify-center rounded-app border border-orange/35 bg-orange-soft/40 p-4 sm:min-h-0">
                  <p className="text-xs font-medium text-app-text-secondary">{t(lang, 'toPlan')}</p>
                  <p className="mt-1 truncate text-base font-semibold text-orange-dark sm:text-lg">
                    {displaySelectedPlan?.name}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="flex gap-4 rounded-app border border-app-divider bg-app-surface-variant/40 p-4 transition-colors hover:border-app-primary/25 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-primary/12 text-app-primary">
                  <IconWallet className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-secondary">
                    {t(lang, 'amountDueToday')}
                  </p>
                  <p className="mt-1 break-words text-2xl font-bold tabular-nums text-app-text sm:text-3xl">
                    {formatMoney(selectedPlan.price, selectedPlan.currency)}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-app border border-app-divider bg-app-surface-variant/40 p-4 transition-colors hover:border-app-primary/25 sm:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-soft/60 text-orange-dark">
                  <IconArrowPath className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-secondary">
                    {t(lang, 'billingCycleLabel')}
                  </p>
                  <p className="mt-1 text-xl font-bold text-app-text sm:text-2xl">
                    {localizeBillingPeriod(
                      displaySelectedPlan?.billingPeriod ?? selectedPlan.billingPeriod,
                      uiLang
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-app border border-orange/25 bg-gradient-to-br from-orange-soft/50 to-transparent p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-soft/70 text-orange-dark">
                  <IconCalendar className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-app-text">{t(lang, 'nextRenewalTitle')}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-orange-dark sm:text-3xl">
                    {nextRenewalDate ? formatDate(nextRenewalDate, uiLang) : '—'}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-app-text-secondary sm:text-sm">
                    {t(lang, 'nextRenewalHint')}
                  </p>
                </div>
              </div>
            </div>

            {subscription?.expiresAt && currentPlanId === selectedPlan.id ? (
              <p className="rounded-app border border-app-divider bg-app-surface-variant/30 px-4 py-3 text-center text-sm text-app-text-secondary sm:text-start">
                <span className="font-medium text-app-text">{t(lang, 'expiresAt')}:</span>{' '}
                <span className="tabular-nums text-app-text">{formatDate(subscription.expiresAt, uiLang)}</span>
              </p>
            ) : null}

            <div className="hidden gap-3 pt-2 sm:grid sm:grid-cols-2 sm:pt-4">
              <div className="min-w-0">
                <Button
                  variant="outline"
                  fullWidth
                  size="md"
                  className="min-h-[44px] whitespace-normal px-3 py-2.5 text-sm leading-snug sm:min-h-[44px]"
                  disabled={paying}
                  onClick={() => navigate('/subscription')}
                >
                  {t(lang, 'backToSubscriptionPlans')}
                </Button>
              </div>
              <div className="min-w-0">
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  className="min-h-[44px] whitespace-normal px-3 py-2.5 text-sm font-semibold leading-snug shadow-md sm:min-h-[44px] sm:text-base"
                  disabled={paying}
                  onClick={handlePaymob}
                  icon={paying ? <ButtonBusyDots className="text-white" /> : null}
                >
                  {paying ? t(lang, 'pleaseWait') : t(lang, 'continueToPaymob')}
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-app-divider bg-app-surface/95 p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          className="min-h-[48px] shadow-md"
          disabled={paying}
          onClick={handlePaymob}
          icon={paying ? <ButtonBusyDots className="text-white" /> : null}
        >
          {paying ? t(lang, 'pleaseWait') : t(lang, 'continueToPaymob')}
        </Button>
        <Button
          variant="outline"
          fullWidth
          size="lg"
          className="min-h-[48px]"
          disabled={paying}
          onClick={() => navigate('/subscription')}
        >
          {t(lang, 'backToSubscriptionPlans')}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;
