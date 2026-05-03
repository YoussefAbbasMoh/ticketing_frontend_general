import { getApiBaseUrl } from './config';

export type ApiPlan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  billingPeriod: string;
  price: number;
  currency?: string;
};

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
