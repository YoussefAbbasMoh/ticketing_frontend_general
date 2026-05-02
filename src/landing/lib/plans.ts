export type ApiPlan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  billingPeriod: string;
  price: number;
  currency?: string;
  /** If backend adds yearly pricing */
  yearlyPrice?: number;
};

type PlansResponse = {
  plans?: ApiPlan[];
};

export async function fetchSubscriptionPlans(
  lang: string = 'en'
): Promise<ApiPlan[] | null> {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ||
    'https://ticketing-backend-general.vercel.app/api';

  try {
    const res = await fetch(
      `${base}/subscriptions/plans?lang=${encodeURIComponent(lang)}`,
      {
        headers: { 'x-lang': lang },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PlansResponse;
    return Array.isArray(data.plans) ? data.plans : null;
  } catch {
    return null;
  }
}

/** Display order: free → basic → pro (fallback sort by price) */
export function sortPlansForLanding(plans: ApiPlan[]): ApiPlan[] {
  const order = ['free', 'basic', 'pro'];
  return [...plans].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return Number(a.price || 0) - Number(b.price || 0);
  });
}

export function annualDisplayPrice(plan: ApiPlan, monthly: number): number {
  if (plan.yearlyPrice != null && plan.yearlyPrice > 0) {
    return Math.round(plan.yearlyPrice);
  }
  return Math.round(monthly * 12 * 0.8);
}
