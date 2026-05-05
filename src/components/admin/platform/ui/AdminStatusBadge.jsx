import React from 'react';
import Badge from '../../../ui/Badge';

const norm = (s) => {
  const x = String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '');
  if (x === 'trial') return 'active';
  return x;
};

/**
 * Maps domain statuses to semantic Badge variants + optional gray for expired/neutral.
 */
export default function AdminStatusBadge({ status }) {
  const key = norm(status);
  const map = {
    active: { variant: 'success', label: 'Active' },
    suspended: { variant: 'error', label: 'Suspended' },
    expired: { variant: 'default', label: 'Expired', className: 'bg-slate-200 text-slate-800' },
    banned: { variant: 'error', label: 'Banned' },
    pastdue: { variant: 'warning', label: 'Past Due' },
    cancelled: { variant: 'default', label: 'Cancelled', className: 'bg-slate-200 text-slate-700' },
    deleted: { variant: 'default', label: 'Deleted', className: 'bg-slate-200 text-slate-700' },
  };

  const entry = map[key] || { variant: 'default', label: status || '—' };
  return (
    <Badge variant={entry.variant} size="sm" className={entry.className || ''}>
      {entry.label}
    </Badge>
  );
}
