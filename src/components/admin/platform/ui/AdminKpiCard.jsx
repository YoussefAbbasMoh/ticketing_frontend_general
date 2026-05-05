import React from 'react';
import Card from '../../../ui/Card';

const accent = {
  primary: 'border-t-app-primary',
  secondary: 'border-t-orange',
  success: 'border-t-app-success',
  neutral: 'border-t-app-divider',
};

export default function AdminKpiCard({ title, value, subtitle, loading, variant = 'neutral' }) {
  const top = accent[variant] || accent.neutral;
  return (
    <Card className={`overflow-hidden border-t-4 ${top} transition-shadow duration-200 hover:shadow-app-card`}>
      <Card.Content className="!py-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-app-text-secondary">{title}</p>
        {loading ? (
          <div className="mt-3 h-9 w-28 animate-pulse rounded-app-input bg-app-surface-variant" />
        ) : (
          <p className="mt-2 text-[26px] font-extrabold tabular-nums tracking-tight text-app-text sm:text-[28px]">
            {value}
          </p>
        )}
        {subtitle ? (
          <p className="mt-2 text-xs leading-snug text-app-text-tertiary">{subtitle}</p>
        ) : null}
      </Card.Content>
    </Card>
  );
}
