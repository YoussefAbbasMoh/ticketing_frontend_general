/** Localized project status for cards and badges. */
export const projectStatusLabel = (statusRaw, lang = 'en') => {
  const s = String(statusRaw || '')
    .toLowerCase()
    .replace(/-/g, '_');
  const L = String(lang).startsWith('ar') ? 'ar' : 'en';
  const labels = {
    en: {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled',
      canceled: 'Cancelled',
    },
    ar: {
      active: 'نشط',
      completed: 'مكتمل',
      on_hold: 'معلّق',
      cancelled: 'ملغاة',
      canceled: 'ملغاة',
    },
  };
  if (labels[L][s]) return labels[L][s];
  return String(statusRaw || '').replace(/_/g, ' ') || (L === 'ar' ? 'غير معروف' : 'Unknown');
};
