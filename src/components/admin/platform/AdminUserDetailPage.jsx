import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { platformAdminAPI, getAxiosErrorMessage } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Skeleton from '../../ui/Skeleton';
import AdminStatusBadge from './ui/AdminStatusBadge';
import AdminShell from './ui/AdminShell';

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((w) => w[0]);
  return chars.join('').toUpperCase() || '?';
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { toast, alertDialog } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await platformAdminAPI.getUser(id);
      setUser(res.data);
    } catch (e) {
      toast(getAxiosErrorMessage(e), { severity: 'error' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
  }, [id]);

  const toggleBan = () => {
    const banned = user?.accountStatus === 'banned';
    const fn = banned ? platformAdminAPI.unbanUser(id) : platformAdminAPI.banUser(id);
    fn.then(() => {
      toast(banned ? 'User unbanned' : 'User banned', { severity: 'success' });
      load();
    }).catch((e) => toast(getAxiosErrorMessage(e), { severity: 'error' }));
  };

  if (loading && !user) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-28 w-full rounded-app border border-app-divider" />
          <Skeleton className="h-40 w-full rounded-app border border-app-divider" />
        </div>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <div className="rounded-app border border-dashed border-app-border bg-app-surface px-6 py-16 text-center shadow-app-soft">
          <p className="text-app-body font-medium text-app-text">User not found</p>
          <p className="mt-2 text-sm text-app-text-secondary">This ID may have been removed or is invalid.</p>
          <Link
            to="/admin/users"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-app-btn bg-app-primary px-6 text-sm font-semibold text-app-on-primary transition-opacity hover:opacity-95"
          >
            Back to users
          </Link>
        </div>
      </AdminShell>
    );
  }

  const ini = initialsFromName(user.name);

  return (
    <AdminShell>
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-app-primary transition-colors hover:text-app-primary/80"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-app-primary/10 text-app-primary" aria-hidden>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
        Users directory
      </Link>

      <div className="mt-6 overflow-hidden rounded-app border border-app-divider bg-gradient-to-br from-app-surface via-app-surface to-app-surface-variant/60 shadow-app-soft">
        <div className="flex flex-col gap-6 border-b border-app-divider bg-app-primary/[0.03] px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-app-primary text-xl font-extrabold text-app-on-primary shadow-app-card sm:h-[72px] sm:w-[72px] sm:text-2xl"
              aria-hidden
            >
              {ini}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-app-text-tertiary">User</p>
              <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-app-text sm:text-[26px]">
                {user.name}
              </h1>
              <p className="mt-1 truncate text-sm text-app-text-secondary">{user.email}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <AdminStatusBadge status={user.accountStatus === 'banned' ? 'Banned' : 'Active'} />
            <Button
              variant={user.accountStatus === 'banned' ? 'secondary' : 'danger'}
              className="min-h-[44px]"
              onClick={() =>
                alertDialog({
                  title: user.accountStatus === 'banned' ? 'Unban user?' : 'Ban user?',
                  message:
                    user.accountStatus === 'banned'
                      ? 'They will be able to sign in again.'
                      : 'They will be blocked from signing in.',
                  confirmText: user.accountStatus === 'banned' ? 'Unban' : 'Ban',
                  cancelText: 'Cancel',
                  onConfirm: toggleBan,
                })
              }
            >
              {user.accountStatus === 'banned' ? 'Unban' : 'Ban user'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <Card.Header className="bg-app-surface-variant/35">
            <h2 className="text-base font-bold text-app-text">Profile</h2>
            <p className="mt-0.5 text-xs text-app-text-secondary">Account metadata</p>
          </Card.Header>
          <Card.Content className="!py-2">
            {[
              ['Title', user.title],
              ['Global role', user.role],
              ['Joined', user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'],
              [
                'Last login',
                user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm') : '—',
              ],
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-app-divider py-3.5 text-sm last:border-b-0 last:pb-0"
              >
                <span className="text-app-text-secondary">{label}</span>
                <span className="max-w-[60%] text-end font-medium text-app-text">{val}</span>
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card className="overflow-hidden">
          <Card.Header className="bg-app-surface-variant/35">
            <h2 className="text-base font-bold text-app-text">Activity</h2>
            <p className="mt-0.5 text-xs text-app-text-secondary">Ticket engagement</p>
          </Card.Header>
          <Card.Content className="space-y-0 divide-y divide-app-divider !py-0">
            <div className="flex justify-between gap-4 py-3.5 text-sm">
              <span className="text-app-text-secondary">Tickets submitted</span>
              <span className="font-semibold tabular-nums text-app-text">{user.activity?.ticketsSubmitted ?? 0}</span>
            </div>
            <div className="flex justify-between gap-4 py-3.5 text-sm">
              <span className="text-app-text-secondary">Ticket replies</span>
              <span className="font-semibold tabular-nums text-app-text">{user.activity?.ticketReplies ?? 0}</span>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <Card.Header>
          <h2 className="text-base font-bold text-app-text">Companies & roles</h2>
          <p className="mt-0.5 text-xs text-app-text-secondary">Workspace memberships</p>
        </Card.Header>
        <Card.Content className="!pt-0">
          <ul className="divide-y divide-app-divider">
            {(user.companies || []).map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm first:pt-0 last:pb-0"
              >
                <span className="font-semibold text-app-text">{c.name}</span>
                <span className="text-app-text-secondary capitalize">
                  {c.role} · {c.planId}
                </span>
              </li>
            ))}
            {!user.companies?.length ? (
              <li className="py-10 text-center text-sm text-app-text-secondary">No company memberships</li>
            ) : null}
          </ul>
        </Card.Content>
      </Card>
    </AdminShell>
  );
}
