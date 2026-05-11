import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { SubscriptionPageSkeleton, ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';

const KNOWN_PLAN_IDS = ['free', 'basic', 'pro', 'enterprise'];

const normalizePlanId = (raw) => {
  const s = String(raw ?? 'free').trim().toLowerCase();
  if (!s) return 'free';
  return KNOWN_PLAN_IDS.includes(s) ? s : 'free';
};

const formatCurrency = (value, currency = 'EGP') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value, lang) => {
  if (!value) return null;
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** First estimated renewal after a successful charge (same cadence as billing period). */
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

const localizeBillingPeriod = (value, lang) => {
  const raw = String(value || '').toLowerCase();
  if (lang === 'ar') {
    if (raw === 'monthly') return 'شهريًا';
    if (raw === 'yearly') return 'سنويًا';
  }
  if (raw === 'monthly') return 'Monthly';
  if (raw === 'yearly') return 'Yearly';
  return value || '—';
};

const SubscriptionCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPlanId = normalizePlanId(searchParams.get('planId'));

  const [lang, setLang] = useState(getStoredLanguage());
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

  const currentPlanId = normalizePlanId(subscription?.planId);
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === currentPlanId) || null,
    [plans, currentPlanId]
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

  if (loading || requestedPlanId === 'free') {
    return <SubscriptionPageSkeleton />;
  }

  if (!selectedPlan) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Alert variant="error">{t(lang, 'checkoutInvalidPlan')}</Alert>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/subscription')}>
          {t(lang, 'backToSubscriptionPlans')}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-app-background to-app-surface-variant">
      <div className="container mx-auto max-w-2xl px-3 py-8 sm:px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent">
            {t(lang, 'checkoutTitle')}
          </h1>
          <p className="text-gray-600">{t(lang, 'checkoutSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        <Card className="border-2 border-gray-200 shadow-app-card">
          <Card.Content className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-gray-500">{t(lang, 'plan')}</p>
              <p className="text-2xl font-bold text-gray-900">{selectedPlan.name}</p>
              {selectedPlan.description ? (
                <p className="mt-2 text-sm text-gray-600">{selectedPlan.description}</p>
              ) : null}
            </div>

            <div className="rounded-app border border-app-divider bg-app-surface-variant/60 p-4">
              <p className="text-sm font-medium text-gray-500">{t(lang, 'planChangeSummary')}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2 text-gray-800">
                <span className="text-sm text-gray-500">{t(lang, 'fromPlan')}:</span>
                <span className="font-semibold">{currentPlan?.name || currentPlanId}</span>
                <span className="text-gray-400">→</span>
                <span className="text-sm text-gray-500">{t(lang, 'toPlan')}:</span>
                <span className="font-semibold text-primary">{selectedPlan.name}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
                <p className="text-sm text-gray-500">{t(lang, 'amountDueToday')}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedPlan.price, selectedPlan.currency)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
                <p className="text-sm text-gray-500">{t(lang, 'billingCycleLabel')}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {localizeBillingPeriod(selectedPlan.billingPeriod, lang)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
              <p className="text-sm font-semibold text-gray-800">{t(lang, 'nextRenewalTitle')}</p>
              <p className="mt-2 text-lg font-bold text-secondary-700">
                {nextRenewalDate ? formatDate(nextRenewalDate, lang) : '—'}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{t(lang, 'nextRenewalHint')}</p>
            </div>

            {subscription?.expiresAt && currentPlanId === selectedPlan.id ? (
              <p className="text-sm text-gray-600">
                {t(lang, 'expiresAt')}:{' '}
                <span className="font-medium text-gray-900">
                  {formatDate(subscription.expiresAt, lang)}
                </span>
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" fullWidth className="sm:w-auto" onClick={() => navigate('/subscription')}>
                {t(lang, 'backToSubscriptionPlans')}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                className="sm:min-w-[200px]"
                disabled={paying}
                onClick={handlePaymob}
                icon={paying ? <ButtonBusyDots className="text-white" /> : null}
              >
                {paying ? t(lang, 'pleaseWait') : t(lang, 'continueToPaymob')}
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;
