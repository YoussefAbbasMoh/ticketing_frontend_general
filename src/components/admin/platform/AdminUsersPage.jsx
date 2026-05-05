import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Spinner from '../../ui/Spinner';
import AdminStatusBadge from './ui/AdminStatusBadge';
import AdminPagination from './ui/AdminPagination';
import AdminEmptyState from './ui/AdminEmptyState';
import AdminShell from './ui/AdminShell';
import AdminPageHeader from './ui/AdminPageHeader';

const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'developer', label: 'Developer' },
  { value: 'tester', label: 'Tester' },
  { value: 'user', label: 'User' },
];

const ACCOUNT = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');

  const loadCompanies = useCallback(async () => {
    try {
      const res = await platformAdminAPI.getCompaniesForSelect();
      setCompanies(res.data.items || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformAdminAPI.getUsers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        companyId: companyId || undefined,
        role: role || undefined,
        accountStatus: accountStatus || undefined,
      });
      setItems(res.data.items || []);
      setTotal(res.data.total ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, companyId, role, accountStatus, toast]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    load();
  }, [load]);

  const selectClass =
    'mt-1 min-h-[44px] w-full rounded-app-input border border-app-border bg-app-surface px-3 py-2.5 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-2 focus:ring-app-primary/20';

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Directory"
        title="Users"
        description="Cross-workspace view of people, roles, and account status."
      />

      <Card className="mb-6 overflow-hidden">
        <Card.Header className="!py-4">
          <h2 className="text-sm font-bold text-app-text">Search & filters</h2>
          <p className="text-xs text-app-text-secondary">Filter by company or role, then open a profile.</p>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Input
              label="Search"
              placeholder="Name or email"
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
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Company</label>
            <select className={selectClass} value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPage(1); }}>
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Role</label>
            <select className={selectClass} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              {ROLES.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-s8 block text-[13px] font-semibold text-app-text-secondary">Status</label>
            <select className={selectClass} value={accountStatus} onChange={(e) => { setAccountStatus(e.target.value); setPage(1); }}>
              {ACCOUNT.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </Card.Content>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading && !items.length ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Spinner size="lg" />
              <p className="text-sm text-app-text-secondary">Loading users…</p>
            </div>
          ) : !items.length ? (
            <div className="p-6">
              <AdminEmptyState title="No users" description="Adjust filters or search." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Users directory</caption>
              <thead className="sticky top-0 z-10 border-b border-app-divider bg-app-surface/95 text-[11px] font-bold uppercase tracking-wide text-app-text-secondary shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-app-surface/75">
                <tr>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Companies</th>
                  <th className="px-4 py-3.5">Roles</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last login</th>
                  <th className="px-4 py-3.5 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-divider">
                {items.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-app-primary/[0.04]">
                    <td className="px-4 py-3.5 font-semibold text-app-text">{row.name}</td>
                    <td className="px-4 py-3.5 text-app-text-secondary">{row.email}</td>
                    <td className="max-w-[200px] px-4 py-3.5 text-xs text-app-text-secondary">
                      {(row.companies || []).map((c) => c.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-app-text-secondary">
                      {(row.rolesSummary || []).join(', ')}
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminStatusBadge status={row.accountStatus === 'banned' ? 'Banned' : 'Active'} />
                    </td>
                    <td className="px-4 py-3.5 text-app-text-secondary">
                      {row.lastLoginAt ? format(new Date(row.lastLoginAt), 'MMM d, yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/admin/users/${row.id}`}
                        className="inline-flex min-h-[40px] items-center justify-end gap-1 rounded-app-input px-2 py-1.5 text-sm font-semibold text-app-primary outline-none ring-offset-2 transition-colors hover:bg-app-primary/[0.06] hover:underline focus-visible:ring-2 focus-visible:ring-app-primary/35"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AdminPagination page={page} totalPages={totalPages} total={total} disabled={loading} onChange={setPage} />
      </Card>
    </AdminShell>
  );
}
