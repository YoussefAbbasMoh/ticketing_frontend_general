import { getApiBaseUrl } from './config';

export type PlanTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'other';

export type ApiPlanLimits = {
  maxMembers?: number | null;
  maxProjects?: number | null;
  canUploadChatAttachments?: boolean;
  canEditAttendance?: boolean;
  canDownloadAttendanceReport?: boolean;
};

export type ApiPlan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  billingPeriod: string;
  price: number;
  currency?: string;
  limits?: ApiPlanLimits;
  paymobIntegrationId?: number | null;
  paymobSubscriptionPlanId?: number | null;
  isPopular?: boolean;
  isActive?: boolean;
  trialDays?: number;
};

function inferMembersCapFromFeatures(features: string[]): number | null {
  let best: number | null = null;
  for (const line of features) {
    const re = /(\d+)\s*members?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const v = Number(m[1]);
      if (Number.isFinite(v) && v > 0) {
        best = best == null ? v : Math.max(best, v);
      }
    }
  }
  return best;
}

/** Seat cap for price-per-seat: `limits.maxMembers`, else highest number before “members” in features. */
export function planSeatCapForPricing(plan: ApiPlan): number | null {
  const raw = plan.limits?.maxMembers;
  if (raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return inferMembersCapFromFeatures(plan.features || []);
}

/** Map live catalog names to landing columns (IDs are Mongo ObjectIds). */
export function normalizePlanTier(name: string): PlanTier {
  const n = name.trim().toLowerCase();
  if (n === 'free') return 'free';
  if (n === 'basic') return 'basic';
  if (n === 'pro') return 'pro';
  if (n === 'enterprise') return 'enterprise';
  if (n.startsWith('free')) return 'free';
  if (n.startsWith('basic')) return 'basic';
  if (n.startsWith('pro')) return 'pro';
  if (n.startsWith('enterprise')) return 'enterprise';
  return 'other';
}

export function planCanCheckoutWithPaymob(plan: ApiPlan): boolean {
  const id = plan.paymobIntegrationId;
  if (id == null) return false;
  return Number.isFinite(Number(id));
}

export function isActiveLandingPlan(plan: ApiPlan): boolean {
  return plan.isActive !== false;
}

type PlansResponse = {
  plans?: ApiPlan[];
};

export async function fetchSubscriptionPlans(
  lang: string = 'en'
): Promise<ApiPlan[] | null> {
  const base = getApiBaseUrl();
  const normalizedLang = lang === 'ar' ? 'ar' : 'en';

  try {
    const res = await fetch(
      `${base}/subscriptions/plans?lang=${encodeURIComponent(normalizedLang)}`,
      {
        headers: { 'x-lang': normalizedLang },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PlansResponse;
    return Array.isArray(data.plans) ? data.plans : null;
  } catch {
    return null;
  }
}

const TIER_SORT: Record<PlanTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
  other: 4,
};

/** Display order: free → basic → pro → enterprise (then price). */
export function sortPlansForLanding(plans: ApiPlan[]): ApiPlan[] {
  return [...plans].sort((a, b) => {
    const ta = TIER_SORT[normalizePlanTier(a.name)];
    const tb = TIER_SORT[normalizePlanTier(b.name)];
    if (ta !== tb) return ta - tb;
    return Number(a.price || 0) - Number(b.price || 0);
  });
}

/** Assign API (or fallback) plans to landing columns; `fifth` is the next unused catalog plan (e.g. a 5th SKU). */
export function assignLandingPlanSlots(plans: ApiPlan[]): {
  starter: ApiPlan;
  growth: ApiPlan;
  business: ApiPlan;
  enterprise: ApiPlan | null;
  fifth: ApiPlan | null;
} {
  const sorted = sortPlansForLanding(plans);
  const firstByTier = (tier: PlanTier) => sorted.find((p) => normalizePlanTier(p.name) === tier) || null;

  const freeP = firstByTier('free');
  const basicP = firstByTier('basic');
  const proP = firstByTier('pro');
  const entP = firstByTier('enterprise');

  const starter = freeP || sorted[0];
  const growth = basicP || sorted.find((p) => normalizePlanTier(p.name) !== 'free') || sorted[1] || sorted[0];
  const business =
    proP ||
    sorted.find((p) => {
      const t = normalizePlanTier(p.name);
      return t !== 'free' && t !== 'basic' && t !== 'enterprise';
    }) ||
    sorted[2] ||
    sorted[0];
  const enterprise = entP;

  const usedIds = new Set(
    [starter.id, growth.id, business.id, enterprise?.id].filter((id): id is string => Boolean(id))
  );
  const fifth = sorted.find((p) => !usedIds.has(p.id)) ?? null;

  return {
    starter,
    growth,
    business,
    enterprise,
    fifth,
  };
}
