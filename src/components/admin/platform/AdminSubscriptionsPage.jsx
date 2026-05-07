import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import AdminKpiCard from './ui/AdminKpiCard';
import AdminStatusBadge from './ui/AdminStatusBadge';
import AdminPagination from './ui/AdminPagination';
import AdminEmptyState from './ui/AdminEmptyState';
import AdminShell from './ui/AdminShell';
import AdminPageHeader from './ui/AdminPageHeader';
import AdminSectionHeading from './ui/AdminSectionHeading';

const SORTS = [
  { value: 'nextBilling', label: 'Next billing' },
  { value: 'company', label: 'Company' },
  { value: 'plan', label: 'Plan' },
  { value: 'price', label: 'Price' },
];

export default function AdminSubscriptionsPage() {
  const { toast, alertDialog } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('nextBilling');
  const [order, setOrder] = useState('asc');
  const [planModal, setPlanModal] = useState({ open: false, row: null, nextPlan: 'basic' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformAdminAPI.getSubscriptions({
        page,
        limit: 15,
        search: search.trim() || undefined,
        sort: sort.toLowerCase(),
        order,
      });
      setMetrics(res.data.metrics);
      setItems(res.data.items || []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, order, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectClass =
    'mt-1 min-h-[44px] w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-primary/20';

  const applyPlan = () => {
    if (!planModal.row) return;
    platformAdminAPI
      .setSubscriptionPlan(planModal.row.companyId, planModal.nextPlan)
      .then(() => {
        toast('Plan updated', { severity: 'success' });
        setPlanModal({ open: false, row: null, nextPlan: 'basic' });
        load();
      })
      .catch((e) => toast(getAxiosErrorMessage(e), { severity: 'error' }));
  };

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Paid workspaces, renewal metrics, and plan management."
      />

      <div className="mb-10">
        <AdminSectionHeading title="Summary" description="Snapshot of recurring revenue and retention." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard
            variant="primary"
            title="MRR"
            value={metrics?.mrr != null ? `${metrics.mrr} EGP` : '—'}
            loading={loading}
          />
          <AdminKpiCard
            variant="secondary"
            title="ARR"
            value={metrics?.arr != null ? `${metrics.arr} EGP` : '—'}
            loading={loading}
          />
          <AdminKpiCard
            variant="neutral"
            title="Churn rate"
            value={metrics?.churnRate != null ? `${metrics.churnRate}%` : '—'}
            loading={loading}
            subtitle="Approx. (30d)"
          />
          <AdminKpiCard
            variant="success"
            title="Active subs"
            value={metrics?.activeSubscriptions ?? '—'}
            loading={loading}
          />
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <Card.Header className="!py-4">
          <h2 className="text-sm font-bold text-app-text">Search & sort</h2>
          <p className="text-xs text-app-text-secondary">Find a company and adjust sort order.</p>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Input
              label="Search company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  load();
                }
              }}
            />
          </div>
          <div>
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Sort</label>
            <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select className={`${selectClass} mt-2`} value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading && !items.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Spinner size="lg" />
              <p className="text-sm text-app-text-secondary">Loading subscriptions…</p>
            </div>
          ) : !items.length ? (
            <div className="p-6">
              <AdminEmptyState title="No paid subscriptions" description="Only Basic, Pro, or Enterprise companies are listed here." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Paid subscriptions</caption>
              <thead className="sticky top-0 z-10 border-b border-app-divider bg-app-surface/95 text-[11px] font-bold uppercase tracking-wide text-app-text-secondary shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-app-surface/75">
                <tr>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Next billing</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-divider">
                {items.map((row) => (
                  <tr key={row.companyId} className="transition-colors hover:bg-app-primary/[0.04]">
                    <td className="px-4 py-3.5 font-semibold text-app-text">{row.companyName}</td>
                    <td className="px-4 py-3.5 capitalize text-app-text-secondary">{row.planId}</td>
                    <td className="px-4 py-3.5 tabular-nums text-app-text">
                      {row.price} {row.currency}
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3.5 text-app-text-secondary">
                      {row.nextBillingDate ? format(new Date(row.nextBillingDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setPlanModal({
                              open: true,
                              row,
                              nextPlan: row.planId === 'basic' ? 'pro' : row.planId === 'pro' ? 'enterprise' : 'basic',
                            })
                          }
                        >
                          Change plan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            alertDialog({
                              title: 'Cancel subscription?',
                              message: 'Sets plan to Free and clears Paymob subscription fields.',
                              confirmText: 'Cancel',
                              cancelText: 'Back',
                              onConfirm: () =>
                                platformAdminAPI
                                  .cancelSubscription(row.companyId)
                                  .then(() => {
                                    toast('Subscription cancelled', { severity: 'success' });
                                    load();
                                  })
                                  .catch((e) => toast(getAxiosErrorMessage(e), { severity: 'error' })),
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AdminPagination page={page} totalPages={totalPages} total={total} disabled={loading} onChange={setPage} />
      </Card>

      <Modal isOpen={planModal.open} onClose={() => setPlanModal({ open: false, row: null, nextPlan: 'basic' })} size="sm">
        <Modal.Header onClose={() => setPlanModal({ open: false, row: null, nextPlan: 'basic' })}>
          Change plan
        </Modal.Header>
        <Modal.Content>
          <p className="text-sm text-app-text-secondary">{planModal.row?.companyName}</p>
          <label className="mt-4 mb-s8 block text-[13px] font-semibold text-app-text-secondary">Plan</label>
          <select
            className={selectClass}
            value={planModal.nextPlan}
            onChange={(e) => setPlanModal((m) => ({ ...m, nextPlan: e.target.value }))}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setPlanModal({ open: false, row: null, nextPlan: 'basic' })}>
            Close
          </Button>
          <Button onClick={applyPlan}>Save</Button>
        </Modal.Footer>
      </Modal>
    </AdminShell>
  );
}
