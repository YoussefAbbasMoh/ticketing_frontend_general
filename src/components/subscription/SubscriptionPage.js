import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { SubscriptionPageSkeleton, ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';
import { mergeSubscriptionPlanForDisplay, resolveSubscriptionUiLang } from '../../utils/subscriptionPlanUi';

const TEXT = {
  en: {
    na: 'N/A',
    failedLoad: 'Failed to load subscription data.',
    activated: 'Subscription activated successfully.',
    confirmFailed: 'Failed to confirm payment.',
    cancelled: 'Subscription cancelled successfully.',
    cancelFailed: 'Failed to cancel subscription.',
    free: 'Free',
    statusActive: 'Active',
    statusExpired: 'Expired',
    statusCancelled: 'Cancelled',
    statusPending: 'Pending',
    current: 'Current',
    projectsForCompany: 'Projects (this company)',
    projectsUnlimited: 'Unlimited',
    projectsUpToN: 'Up to {{n}} projects',
  },
  ar: {
    na: 'غير متاح',
    failedLoad: 'فشل في تحميل بيانات الاشتراك.',
    activated: 'تم تفعيل الاشتراك بنجاح.',
    confirmFailed: 'فشل تأكيد الدفع.',
    cancelled: 'تم إلغاء الاشتراك بنجاح.',
    cancelFailed: 'فشل إلغاء الاشتراك.',
    free: 'مجاني',
    statusActive: 'نشط',
    statusExpired: 'منتهٍ',
    statusCancelled: 'ملغى',
    statusPending: 'قيد الانتظار',
    current: 'الحالي',
    projectsForCompany: 'المشاريع (لهذه الشركة)',
    projectsUnlimited: 'غير محدود',
    projectsUpToN: 'حتى {{n}} مشروعًا',
  },
};

const KNOWN_PLAN_IDS = ['free', 'basic', 'pro', 'enterprise'];

const normalizePlanId = (raw) => {
  const s = String(raw ?? 'free').trim().toLowerCase();
  if (!s) return 'free';
  return KNOWN_PLAN_IDS.includes(s) ? s : 'free';
};

const SubscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handledConfirmRef = useRef(false);
  const [lang, setLang] = useState(getStoredLanguage());
  const uiLang = resolveSubscriptionUiLang(lang);
  const tx = useCallback((key, vars = {}) => {
    let s = TEXT[uiLang]?.[key] || TEXT.en[key] || key;
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
    return s;
  }, [uiLang]);

  const formatMoney = useCallback(
    (value, currency = 'EGP') =>
      new Intl.NumberFormat(uiLang === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(Number(value || 0)),
    [uiLang]
  );

  const formatDateUi = useCallback(
    (value) => {
      if (!value) return null;
      const locale = uiLang === 'ar' ? 'ar-EG' : 'en-GB';
      return new Date(value).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    },
    [uiLang]
  );

  const localizeBillingPeriod = useCallback(
    (value) => {
      const raw = String(value || '').toLowerCase();
      if (uiLang === 'ar') {
        if (raw === 'monthly') return 'شهريًا';
        if (raw === 'yearly') return 'سنويًا';
      } else {
        if (raw === 'monthly') return 'monthly';
        if (raw === 'yearly') return 'yearly';
      }
      return value || '';
    },
    [uiLang]
  );

  const subscriptionStatusLabel = useCallback(
    (status) => {
      const k = String(status || '').toLowerCase();
      if (k === 'active') return tx('statusActive');
      if (k === 'expired') return tx('statusExpired');
      if (k === 'cancelled' || k === 'canceled') return tx('statusCancelled');
      if (k === 'pending') return tx('statusPending');
      return status ? String(status) : tx('statusActive');
    },
    [tx]
  );

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
      setError(apiError?.response?.data?.message || tx('failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [tx]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadData]);

  const currentPlanId = normalizePlanId(subscription?.planId);
  const hasExpired = subscription?.status === 'expired';
  const noticeMessage = subscription?.notice || '';

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentPlanId) || null,
    [plans, currentPlanId]
  );

  const mergedCurrentPlan = useMemo(
    () => mergeSubscriptionPlanForDisplay(lang, currentPlan),
    [lang, currentPlan]
  );

  const handleSubscribe = (planId) => {
    setError('');
    setSuccess('');
    navigate(`/subscription/checkout?planId=${encodeURIComponent(normalizePlanId(planId))}`);
  };

  const handleConfirmPayment = async (urlToConfirm) => {
    setError('');
    setSuccess('');
    setConfirmingPayment(true);
    try {
      const response = await subscriptionAPI.confirmPaymobPayment({
        postPayUrl: urlToConfirm,
      });
      setSuccess(response?.data?.message || tx('activated'));
      await loadData();
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        tx('confirmFailed');
      setError(message);
      handledConfirmRef.current = false;
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCancelRecurring = async () => {
    setError('');
    setSuccess('');
    setCancelling(true);
    try {
      const response = await subscriptionAPI.cancelPaymobSubscription({
        subscriptionId: subscription?.paymobSubscriptionId || undefined,
      });
      setSuccess(response?.data?.message || tx('cancelled'));
      await loadData();
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        tx('cancelFailed');
      setError(message);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const isTruthySuccess = (value) => {
      const v = String(value ?? '').toLowerCase();
      return v === 'true' || v === '1' || v === 'yes';
    };
    const params = new URLSearchParams(location.search);
    let successParam = params.get('success');
    const hashRaw = location.hash || (typeof window !== 'undefined' ? window.location.hash : '');
    if (successParam == null && hashRaw) {
      const h = hashRaw.startsWith('#') ? hashRaw.slice(1) : hashRaw;
      const hashParams = new URLSearchParams(h.startsWith('?') ? h.slice(1) : h);
      successParam = hashParams.get('success');
    }
    if (!isTruthySuccess(successParam)) return;
    if (confirmingPayment) return;
    if (handledConfirmRef.current) return;
    handledConfirmRef.current = true;

    const currentUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : `${location.origin}${location.pathname}${location.search}`;
    handleConfirmPayment(currentUrl).finally(() => {
      navigate('/subscription', { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname, location.hash]);

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  if (loading) {
    return <SubscriptionPageSkeleton />;
  }

  return (
    <div className="w-full bg-gradient-to-br from-app-background to-app-surface-variant">
      <div className="container mx-auto max-w-6xl px-3 pt-3 pb-16 sm:px-4 sm:pt-4 lg:px-6">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-secondary to-secondary-700 bg-clip-text text-transparent">
              {t(lang, 'subscription')}
            </h1>
            <p className="text-gray-600">{t(lang, 'managePlan')}</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}
          {success && (
            <div className="mb-4">
              <Alert variant="success" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </div>
          )}
          {noticeMessage && (
            <div className="mb-4">
              <Alert variant={hasExpired ? 'warning' : 'info'}>
                {noticeMessage}
              </Alert>
            </div>
          )}

          <Card className="mb-6">
            <Card.Content className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">{t(lang, 'currentPlan')}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'plan')}</p>
                  <p className="text-lg font-semibold text-gray-900">{mergedCurrentPlan?.name || tx('free')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'status')}</p>
                  <p className={`text-lg font-semibold ${hasExpired ? 'text-amber-600' : 'text-green-600'}`}>
                    {subscriptionStatusLabel(subscription?.status)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'expiresAt')}</p>
                  <p className="text-gray-800">{formatDateUi(subscription?.expiresAt) || tx('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'graceEndsAt')}</p>
                  <p className="text-gray-800">{formatDateUi(subscription?.graceEndsAt) || tx('na')}</p>
                </div>
                {subscription?.limits && (
                  <div>
                    <p className="text-sm text-gray-500">{tx('projectsForCompany')}</p>
                    <p className="text-gray-800">
                      {subscription.limits.maxProjects == null
                        ? tx('projectsUnlimited')
                        : tx('projectsUpToN', { n: subscription.limits.maxProjects })}
                    </p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">{t(lang, 'paymobSubscriptionId')}</p>
                  <p className="text-gray-800 break-all">{subscription?.paymobSubscriptionId || tx('na')}</p>
                </div>
              </div>
              {confirmingPayment && (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  {t(lang, 'confirmingPayment')}
                </div>
              )}
              {currentPlanId !== 'free' && subscription?.status !== 'cancelled' && (
                <div className="mt-5">
                  <Button
                    variant="outline"
                    disabled={cancelling}
                    onClick={handleCancelRecurring}
                    icon={cancelling ? <ButtonBusyDots className="text-app-primary" /> : null}
                  >
                    {cancelling ? t(lang, 'cancelling') : t(lang, 'cancelAutoRenewal')}
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const displayPlan = mergeSubscriptionPlanForDisplay(lang, plan);
              const isCurrent = plan.id === currentPlanId;
              const isFree = plan.id === 'free';
              const paidHoverClasses = isFree
                ? ''
                : 'cursor-default transition-all duration-200 ease-out hover:-translate-y-1 hover:border-app-primary hover:shadow-app-card';

              return (
                <Card
                  key={plan.id}
                  className={`border-2 ${isCurrent ? 'border-secondary shadow-lg' : 'border-gray-200'} ${paidHoverClasses}`}
                >
                  <Card.Content className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">{displayPlan.name}</h3>
                      {isCurrent && (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                          {tx('current')}
                        </span>
                      )}
                    </div>
                    <p className="mb-4 text-gray-600">{displayPlan.description}</p>
                    <p className="mb-4 text-2xl font-semibold text-primary">
                      {formatMoney(plan.price, plan.currency)} / {localizeBillingPeriod(displayPlan.billingPeriod)}
                    </p>
                    <ul className="mb-6 space-y-2 text-sm text-gray-700">
                      {(displayPlan.features || []).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {isFree ? (
                      <Button fullWidth variant="outline" disabled>
                        {t(lang, 'defaultPlan')}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant={isCurrent ? 'outline' : 'secondary'}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {isCurrent ? t(lang, 'renewPlan') : t(lang, 'subscribe')}
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        </div>
    </div>
  );
};

export default SubscriptionPage;
