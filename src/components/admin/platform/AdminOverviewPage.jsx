import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import Card from '../../ui/Card';
import Skeleton from '../../ui/Skeleton';
import AdminKpiCard from './ui/AdminKpiCard';
import AdminLineChart from './ui/AdminLineChart';
import AdminEmptyState from './ui/AdminEmptyState';
import AdminShell from './ui/AdminShell';
import AdminPageHeader from './ui/AdminPageHeader';
import AdminSectionHeading from './ui/AdminSectionHeading';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await platformAdminAPI.getOverview();
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = data?.kpis;
  const charts = data?.charts;
  const alerts = data?.alerts;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Platform health, growth, and billing signals at a glance."
      />

      {error ? (
        <div
          className="mb-8 flex gap-3 rounded-app border border-app-error/25 bg-app-error/10 px-4 py-3 text-sm text-app-error"
          role="alert"
        >
          <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-app border border-app-divider shadow-app-soft" />
          <Skeleton className="h-72 rounded-app border border-app-divider shadow-app-soft" />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard
          variant="primary"
          title="Total companies"
          value={kpis?.totalCompanies ?? '—'}
          loading={loading}
        />
        <AdminKpiCard
          variant="secondary"
          title="Total users"
          value={kpis?.totalUsers ?? '—'}
          loading={loading}
        />
        <AdminKpiCard
          variant="success"
          title="MRR"
          value={kpis?.mrr != null ? `${kpis.mrr} EGP` : '—'}
          loading={loading}
          subtitle="Monthly recurring revenue"
        />
        <AdminKpiCard
          variant="neutral"
          title="New signups"
          value={kpis?.newSignupsLast7Days ?? '—'}
          loading={loading}
          subtitle="Last 7 days"
        />
        <AdminKpiCard
          variant="neutral"
          title="New subscriptions"
          value={kpis?.newSubscriptionsLast7Days ?? '—'}
          loading={loading}
          subtitle="Last 7 days"
        />
      </div>

      <div className="mt-12">
        <AdminSectionHeading title="Insights" description="Trailing 30-day trends." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-app-card">
            <Card.Header className="bg-app-surface-variant/35">
              <h2 className="text-base font-bold text-app-text">Revenue growth</h2>
              <p className="mt-0.5 text-xs text-app-text-secondary">Estimated MRR by day</p>
            </Card.Header>
            <Card.Content className="!pt-5">
              <AdminLineChart data={charts?.revenueGrowth || []} color="#080936" />
            </Card.Content>
          </Card>
          <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-app-card">
            <Card.Header className="bg-app-surface-variant/35">
              <h2 className="text-base font-bold text-app-text">Companies growth</h2>
              <p className="mt-0.5 text-xs text-app-text-secondary">Cumulative companies over time</p>
            </Card.Header>
            <Card.Content className="!pt-5">
              <AdminLineChart data={charts?.companiesGrowth || []} color="#16A34A" />
            </Card.Content>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <AdminSectionHeading title="Alerts" description="Items that may need attention." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Card.Header>
              <h2 className="text-base font-bold text-app-text">Expiring subscriptions</h2>
              <p className="mt-0.5 text-xs text-app-text-secondary">Next 14 days</p>
            </Card.Header>
            <Card.Content className="!pt-0">
              {!alerts?.expiringSoon?.length ? (
                <AdminEmptyState
                  title="No upcoming expirations"
                  description="Paid plans expiring within 14 days appear here."
                />
              ) : (
                <ul className="divide-y divide-app-divider">
                  {alerts.expiringSoon.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-sm first:pt-0">
                      <span className="font-semibold text-app-text">{row.name}</span>
                      <span className="text-app-text-secondary">
                        {row.planId} · {row.expiresAt ? format(new Date(row.expiresAt), 'MMM d, yyyy') : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <h2 className="text-base font-bold text-app-text">Failed renewals</h2>
              <p className="mt-0.5 text-xs text-app-text-secondary">Billing failures recorded on the company</p>
            </Card.Header>
            <Card.Content className="!pt-0">
              {!alerts?.failedRenewals?.length ? (
                <AdminEmptyState
                  title="No failed renewal records"
                  description="When your billing flow records a failure on the company, it shows here."
                />
              ) : (
                <ul className="divide-y divide-app-divider">
                  {alerts.failedRenewals.map((row) => (
                    <li key={row.id} className="py-3.5 text-sm first:pt-0">
                      <div className="font-semibold text-app-text">{row.name}</div>
                      <div className="mt-1 text-xs text-app-text-secondary">
                        {row.reason} · {row.at ? format(new Date(row.at), 'MMM d, yyyy') : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
