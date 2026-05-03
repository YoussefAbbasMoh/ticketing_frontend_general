import { getStoredLanguage, t } from '../i18n';

export function openFreePlanBlockedDialog(alertDialog, navigate, canSeeSubscriptionNav) {
  const lang = getStoredLanguage();
  const title = t(lang, 'planFeatureBlockedTitle');
  const message = t(lang, 'planFeatureBlockedBody');
  if (canSeeSubscriptionNav) {
    alertDialog({
      title,
      message,
      confirmText: t(lang, 'planFeatureBlockedViewPlans'),
      cancelText: t(lang, 'planFeatureBlockedClose'),
      onConfirm: () => navigate('/subscription'),
    });
  } else {
    alertDialog({
      title,
      message: `${message}\n\n${t(lang, 'planFeatureBlockedAskAdmin')}`,
      confirmText: t(lang, 'planFeatureBlockedClose'),
      cancelText: null,
      onConfirm: null,
    });
  }
}
