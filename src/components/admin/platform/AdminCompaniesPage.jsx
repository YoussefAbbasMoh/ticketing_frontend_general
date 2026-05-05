import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import { getStoredLanguage, t } from '../../../i18n';
import { useToast } from '../../../contexts/ToastContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Spinner from '../../ui/Spinner';
import Modal from '../../ui/Modal';
import AdminStatusBadge from './ui/AdminStatusBadge';
import AdminPagination from './ui/AdminPagination';
import AdminEmptyState from './ui/AdminEmptyState';
import AdminShell from './ui/AdminShell';
import AdminPageHeader from './ui/AdminPageHeader';

const PLANS = [
  { value: '', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Expired', label: 'Expired' },
];

const ACTIVITY = [
  { value: '', label: 'Any activity' },
  { value: 'recent', label: 'Active (14d)' },
  { value: 'stale', label: 'Stale (30d+)' },
];

const SORTS = [
  { value: 'name', label: 'Name' },
  { value: 'users', label: 'Users' },
  { value: 'projects', label: 'Projects' },
  { value: 'lastActivity', label: 'Last activity' },
  { value: 'subscriptionEnd', label: 'Subscription end' },
];

export default function AdminCompaniesPage() {
  const { toast, alertDialog } = useToast();
  const [lang, setLang] = useState(getStoredLanguage());
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [activity, setActivity] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [planModal, setPlanModal] = useState({ open: false, company: null, nextPlan: 'basic' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformAdminAPI.getCompanies({
        page,
        limit: 15,
        search: search.trim() || undefined,
        plan: plan || undefined,
        status: status || undefined,
        activity: activity || undefined,
        sort: sort.toLowerCase(),
        order,
      });
      setItems(res.data.items || []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, status, activity, sort, order, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  const filtersAreDefault = useMemo(
    () =>
      !search.trim() &&
      !plan &&
      !status &&
      !activity &&
      sort === 'name' &&
      order === 'asc' &&
      page === 1,
    [search, plan, status, activity, sort, order, page]
  );

  const clearAllFilters = () => {
    setSearch('');
    setPlan('');
    setStatus('');
    setActivity('');
    setSort('name');
    setOrder('asc');
    setPage(1);
  };

  const runAction = async (label, fn) => {
    try {
      await fn();
      toast(`${label} updated`, { severity: 'success' });
      load();
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    }
  };

  const confirmPlan = () => {
    if (!planModal.company) return;
    runAction('Plan', () => platformAdminAPI.setCompanyPlan(planModal.company.id, planModal.nextPlan));
    setPlanModal({ open: false, company: null, nextPlan: 'basic' });
  };

  const selectClass =
    'mt-1 min-h-[44px] w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-primary/20';

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Directory"
        title="Companies"
        description="Search workspaces, review plans, and take actions like suspend or change plan."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={filtersAreDefault}
            onClick={clearAllFilters}
            title={t(lang, 'adminClearAllFilters')}
            aria-label={t(lang, 'adminClearAllFilters')}
          >
            {t(lang, 'adminClearAllFilters')}
          </Button>
        }
      />

      <Card className="mb-6 overflow-hidden">
        <Card.Header className="!py-4">
          <h2 className="text-sm font-bold text-app-text">Search & filters</h2>
          <p className="text-xs text-app-text-secondary">Narrow the table — press Enter in search to apply.</p>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Input
              label="Search"
              placeholder="Company name"
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
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Plan</label>
            <select className={selectClass} value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}>
              {PLANS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Status</label>
            <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {STATUSES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Activity</label>
            <select className={selectClass} value={activity} onChange={(e) => { setActivity(e.target.value); setPage(1); }}>
              {ACTIVITY.map((o) => (
                <option key={o.value || 'any'} value={o.value}>{o.label}</option>
              ))}
            </select>
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
              <p className="text-sm text-app-text-secondary">Loading companies…</p>
            </div>
          ) : !items.length ? (
            <div className="p-6">
              <AdminEmptyState title="No companies" description="Try adjusting filters or search." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Companies list</caption>
              <thead className="sticky top-0 z-10 border-b border-app-divider bg-app-surface/95 text-[11px] font-bold uppercase tracking-wide text-app-text-secondary shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-app-surface/75">
                <tr>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Users</th>
                  <th className="px-4 py-3.5">Projects</th>
                  <th className="px-4 py-3.5">Last activity</th>
                  <th className="px-4 py-3.5">Sub. end</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-divider">
                {items.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-app-primary/[0.04]">
                    <td className="px-4 py-3.5 font-semibold text-app-text">{row.name}</td>
                    <td className="px-4 py-3.5 capitalize text-app-text-secondary">{row.planId}</td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge status={row.uiStatus} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-app-text">{row.usersCount}</td>
                    <td className="px-4 py-3.5 tabular-nums text-app-text">{row.projectsCount}</td>
                    <td className="px-4 py-3.5 text-app-text-secondary">
                      {row.lastActivity ? format(new Date(row.lastActivity), 'MMM d, yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-app-text-secondary">
                      {row.subscriptionEndDate ? format(new Date(row.subscriptionEndDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap justify-end gap-1">
                        {row.platformStatus === 'suspended' ? (
                          <Button size="sm" variant="outline" onClick={() => runAction('Company', () => platformAdminAPI.activateCompany(row.id))}>
                            Activate
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => runAction('Company', () => platformAdminAPI.suspendCompany(row.id))}>
                            Suspend
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setPlanModal({ open: true, company: row, nextPlan: row.planId === 'pro' ? 'basic' : 'pro' })}>
                          Plan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="!text-xs"
                          onClick={() =>
                            alertDialog({
                              title: 'Soft delete company?',
                              message: 'Members will lose access. You can use includeDeleted in API for audits.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              onConfirm: () => runAction('Company', () => platformAdminAPI.softDeleteCompany(row.id)),
                            })
                          }
                        >
                          Delete
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

      <Modal isOpen={planModal.open} onClose={() => setPlanModal({ open: false, company: null, nextPlan: 'basic' })} size="sm">
        <Modal.Header onClose={() => setPlanModal({ open: false, company: null, nextPlan: 'basic' })}>
          Change plan
        </Modal.Header>
        <Modal.Content>
          <p className="text-sm text-app-text-secondary">
            {planModal.company?.name}
          </p>
          <label className="mt-4 mb-s8 block text-[13px] font-semibold text-app-text-secondary">New plan</label>
          <select
            className={selectClass}
            value={planModal.nextPlan}
            onChange={(e) => setPlanModal((m) => ({ ...m, nextPlan: e.target.value }))}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </Modal.Content>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setPlanModal({ open: false, company: null, nextPlan: 'basic' })}>
            Cancel
          </Button>
          <Button onClick={confirmPlan}>Save</Button>
        </Modal.Footer>
      </Modal>
    </AdminShell>
  );
}
