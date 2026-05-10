import { useEffect, useMemo, useState } from 'react';
import { subscriptionAPI } from '../services/api';

const KNOWN_PLAN_IDS = ['free', 'basic', 'pro', 'enterprise'];

function normalizePlanId(raw) {
  const s = String(raw || 'free').trim().toLowerCase();
  if (!s) return 'free';
  return KNOWN_PLAN_IDS.includes(s) ? s : 'free';
}

/**
 * Current company plan from GET /subscriptions/me.
 * Attachment gate is false while loading (pessimistic) so Free cannot slip through before the response.
 */
export function useMySubscriptionPlan(companyKey) {
  const [planId, setPlanId] = useState('free');
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLimits(null);
    (async () => {
      try {
        const res = await subscriptionAPI.getMySubscription();
        const id = normalizePlanId(res?.data?.planId);
        const lim = res?.data?.limits;
        if (!cancelled) {
          setPlanId(id);
          setLimits(lim && typeof lim === 'object' ? lim : null);
        }
      } catch {
        if (!cancelled) {
          setPlanId('free');
          setLimits(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyKey]);

  const isFreePlan = planId === 'free';

  const canUploadChatAttachments = useMemo(() => {
    if (loading) return false;
    if (limits && Object.prototype.hasOwnProperty.call(limits, 'canUploadChatAttachments')) {
      return Boolean(limits.canUploadChatAttachments);
    }
    return planId !== 'free';
  }, [loading, limits, planId]);

  return { planId, isFreePlan, limits, loading, canUploadChatAttachments };
}
