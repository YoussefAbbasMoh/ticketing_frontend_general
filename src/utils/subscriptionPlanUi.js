/** Arabic detection for subscription plan copy (same heuristic as backend). */
export const subscriptionPlanTextHasArabic = (value) => /[\u0600-\u06FF]/.test(String(value || ''));

/** Static catalog copy when API/DB mixes languages (e.g. English titles + Arabic feature lines). */
export const SUBSCRIPTION_PLAN_UI_FALLBACK = {
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

const resolveLang = (raw) => {
  const s = String(raw ?? 'en')
    .trim()
    .replace(/[\u200e\u200f]/g, '')
    .toLowerCase();
  return s.startsWith('ar') ? 'ar' : 'en';
};

export const resolveSubscriptionUiLang = resolveLang;

/**
 * Merge known plan rows so Arabic UI never shows English titles/descriptions when feature lines are Arabic-only.
 */
export const mergeSubscriptionPlanForDisplay = (lang, plan) => {
  if (!plan?.id) return plan;
  const L = resolveLang(lang);
  const fb = SUBSCRIPTION_PLAN_UI_FALLBACK[L]?.[plan.id];
  if (!fb) return plan;

  if (L === 'ar') {
    return {
      ...plan,
      name: subscriptionPlanTextHasArabic(plan.name) ? plan.name : fb.name,
      description: subscriptionPlanTextHasArabic(plan.description) ? plan.description : fb.description,
      billingPeriod: subscriptionPlanTextHasArabic(plan.billingPeriod) ? plan.billingPeriod : fb.billingPeriod,
      features:
        Array.isArray(plan.features) &&
        plan.features.length > 0 &&
        plan.features.every((f) => subscriptionPlanTextHasArabic(String(f)))
          ? plan.features
          : fb.features,
    };
  }

  return {
    ...plan,
    name: subscriptionPlanTextHasArabic(plan.name) ? fb.name : plan.name || fb.name,
    description: subscriptionPlanTextHasArabic(plan.description) ? fb.description : plan.description || fb.description,
    billingPeriod: subscriptionPlanTextHasArabic(plan.billingPeriod)
      ? fb.billingPeriod
      : plan.billingPeriod || fb.billingPeriod,
    features:
      Array.isArray(plan.features) && plan.features.some((f) => subscriptionPlanTextHasArabic(String(f)))
        ? fb.features
        : plan.features || fb.features,
  };
};
