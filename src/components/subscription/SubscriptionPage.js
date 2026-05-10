import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import { getStoredLanguage, t } from '../../i18n';

const TEXT = {
  en: {
    na: 'N/A',
    failedLoad: 'Failed to load subscription data.',
    checkoutUrlMissing: 'Checkout URL was not returned from server.',
    checkoutFailed: 'Could not start payment checkout.',
    activated: 'Subscription activated successfully.',
    confirmFailed: 'Failed to confirm payment.',
    cancelled: 'Subscription cancelled successfully.',
    cancelFailed: 'Failed to cancel subscription.',
    free: 'Free',
    active: 'active',
    current: 'Current',
    projectsForCompany: 'Projects (this company)',
    projectsUnlimited: 'Unlimited',
    projectsUpToN: 'Up to {{n}} projects',
  },
  ar: {
    na: 'غير متاح',
    failedLoad: 'فشل في تحميل بيانات الاشتراك.',
    checkoutUrlMissing: 'لم يتم إرجاع رابط الدفع من الخادم.',
    checkoutFailed: 'تعذر بدء عملية الدفع.',
    activated: 'تم تفعيل الاشتراك بنجاح.',
    confirmFailed: 'فشل تأكيد الدفع.',
    cancelled: 'تم إلغاء الاشتراك بنجاح.',
    cancelFailed: 'فشل إلغاء الاشتراك.',
    free: 'مجاني',
    active: 'نشط',
    current: 'الحالي',
    projectsForCompany: 'المشاريع (لهذه الشركة)',
    projectsUnlimited: 'غير محدود',
    projectsUpToN: 'حتى {{n}} مشروعًا',
  },
};

const PLAN_UI_FALLBACK = {
  en: {
    free: {
      name: 'Free',
      description: 'Default plan for new companies',
      features: [
        'Up to 3 accounts',
        'Up to 3 projects',
        'No chat images, videos, or files',
        'No attendance edit or download',
      ],
      billingPeriod: 'monthly',
    },
    basic: {
      name: 'Basic',
      description: 'For growing teams',
      features: [
        'From 3 to 10 members',
        'Up to 10 projects',
        'Chat attachments enabled',
        'Attendance edit and report download',
      ],
      billingPeriod: 'monthly',
    },
    pro: {
      name: 'Pro',
      description: 'For larger teams',
      features: [
        'From 10 to 50 members',
        'Unlimited projects',
        'Chat attachments enabled',
        'Attendance edit and report download',
      ],
      billingPeriod: 'monthly',
    },
    enterprise: {
      name: 'Enterprise',
      description: 'For organizations with 30+ members',
      features: [
        '30+ members',
        'Unlimited projects',
        'Chat attachments enabled',
        'Attendance edit and report download',
      ],
      billingPeriod: 'monthly',
    },
  },
  ar: {
    free: {
      name: 'مجانية',
      description: 'الباقة الافتراضية للشركات الجديدة',
      features: [
        'حتى 3 حسابات',
        'حتى 3 مشاريع',
        'بدون صور أو فيديو أو ملفات في الشات',
        'بدون تعديل أو تحميل الحضور',
      ],
      billingPeriod: 'شهريًا',
    },
    basic: {
      name: 'أساسية',
      description: 'لفِرَق العمل المتوسطة',
      features: [
        'من 3 إلى 10 أفراد',
        'حتى 10 مشاريع',
        'إتاحة مرفقات الشات',
        'تعديل الحضور وتحميل التقارير',
      ],
      billingPeriod: 'شهريًا',
    },
    pro: {
      name: 'احترافية',
      description: 'لفِرَق العمل الكبيرة',
      features: [
        'من 10 إلى 50 فرد',
        'مشاريع غير محدودة',
        'إتاحة مرفقات الشات',
        'تعديل الحضور وتحميل التقارير',
      ],
      billingPeriod: 'شهريًا',
    },
    enterprise: {
      name: 'المؤسسات',
      description: 'لمؤسسات يزيد عدد أفرادها عن 30',
      features: [
        'أكثر من 30 فرد',
        'مشاريع غير محدودة',
        'إتاحة مرفقات الشات',
        'تعديل الحضور وتحميل التقارير',
      ],
      billingPeriod: 'شهريًا',
    },
  },
};

const hasArabic = (value) => /[\u0600-\u06FF]/.test(String(value || ''));

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

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const SubscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handledConfirmRef = useRef(false);
  const [lang, setLang] = useState(getStoredLanguage());
  const tx = useCallback((key, vars = {}) => {
    let s = TEXT[lang]?.[key] || TEXT.en[key] || key;
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
    return s;
  }, [lang]);
  const localizeBillingPeriod = useCallback(
    (value) => {
      const raw = String(value || '').toLowerCase();
      if (lang === 'ar') {
        if (raw === 'monthly') return 'شهريًا';
        if (raw === 'yearly') return 'سنويًا';
      } else {
        if (raw === 'monthly') return 'monthly';
        if (raw === 'yearly') return 'yearly';
      }
      return value || '';
    },
    [lang]
  );

  const normalizePlanForUi = useCallback(
    (plan) => {
      if (!plan) return plan;
      const textPayload = [
        plan.name,
        plan.description,
        plan.billingPeriod,
        ...(plan.features || []),
      ].join(' ');
      const fallback = PLAN_UI_FALLBACK[lang]?.[plan.id];
      if (!fallback) return plan;

      // If requested Arabic but payload has no Arabic chars, enforce Arabic fallback.
      if (lang === 'ar' && !hasArabic(textPayload)) {
        return { ...plan, ...fallback };
      }
      // If requested English but payload is Arabic, enforce English fallback.
      if (lang === 'en' && hasArabic(textPayload)) {
        return { ...plan, ...fallback };
      }
      return plan;
    },
    [lang]
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

  const handleSubscribe = async (planId) => {
    setError('');
    setSuccess('');
    setPayingPlanId(planId);
    try {
      const res = await subscriptionAPI.createPaymobCheckout({
        planId: normalizePlanId(planId),
        paymentMethod: 'card',
        // Tells Paymob where to send the user after payment (must match backend allow-list).
        returnUrl: `${window.location.origin}/subscription`,
      });
      const checkoutUrl = res?.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error(tx('checkoutUrlMissing'));
      }
      setSuccess(t(lang, 'redirectingCheckout'));
      window.location.href = checkoutUrl;
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        tx('checkoutFailed');
      setError(message);
    } finally {
      setPayingPlanId('');
    }
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
    return (
      <div className="flex w-full min-h-[50vh] flex-col items-center justify-center bg-app-background py-16">
        <div className="text-center">
          <Spinner size="xl" color="secondary" />
          <p className="mt-3 text-app-text-secondary">{t(lang, 'loadingPlans')}</p>
        </div>
      </div>
    );
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
                  <p className="text-lg font-semibold text-gray-900">{currentPlan?.name || tx('free')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'status')}</p>
                  <p className={`text-lg font-semibold ${hasExpired ? 'text-amber-600' : 'text-green-600'}`}>
                    {subscription?.status || tx('active')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'expiresAt')}</p>
                  <p className="text-gray-800">{formatDate(subscription?.expiresAt) || tx('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(lang, 'graceEndsAt')}</p>
                  <p className="text-gray-800">{formatDate(subscription?.graceEndsAt) || tx('na')}</p>
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
                    icon={cancelling ? <Spinner size="sm" color="secondary" /> : null}
                  >
                    {cancelling ? t(lang, 'cancelling') : t(lang, 'cancelAutoRenewal')}
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const displayPlan = normalizePlanForUi(plan);
              const isCurrent = plan.id === currentPlanId;
              const isFree = plan.id === 'free';
              const isBusy = payingPlanId === plan.id;

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
                      {formatCurrency(plan.price, plan.currency)} / {localizeBillingPeriod(displayPlan.billingPeriod)}
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
                        disabled={isBusy}
                        onClick={() => handleSubscribe(plan.id)}
                        icon={isBusy ? <Spinner size="sm" color="white" /> : null}
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
