import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getStoredLanguage, t } from '../../../i18n';
import { useAuth } from '../../../contexts/AuthContext';

function NavIcon({ name, className }) {
  const cn = className || 'h-5 w-5';
  switch (name) {
    case 'overview':
      return (
        <svg className={cn} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'companies':
      return (
        <svg className={cn} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3.75 3h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 012.625 8.625v-4.5C2.625 3.504 3.129 3 3.75 3z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cn} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case 'subscriptions':
      return (
        <svg className={cn} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 5.25H1.5m0-2.25H12m0 0h8.25m-8.25 0v8.25m0-8.25v8.25m0-8.25V6a3 3 0 013-3h4.5a3 3 0 013 3v2.25m-12 0h8.25m-8.25 0H9m4.5 0H12" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout() {
  const [lang, setLang] = useState(getStoredLanguage());
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isRtl = String(lang || '').toLowerCase().startsWith('ar');

  useEffect(() => {
    const onLang = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLang);
    return () => window.removeEventListener('language-changed', onLang);
  }, []);

  const items = [
    { to: '/admin', end: true, label: t(lang, 'adminOverview'), icon: 'overview' },
    { to: '/admin/companies', label: t(lang, 'adminCompanies'), icon: 'companies' },
    { to: '/admin/users', label: t(lang, 'adminUsers'), icon: 'users' },
    { to: '/admin/subscriptions', label: t(lang, 'adminSubscriptions'), icon: 'subscriptions' },
  ];

  const linkClass = ({ isActive }) => {
    const edgeActive = isRtl
      ? 'border-r-4 border-app-primary bg-app-primary/[0.07] text-app-primary shadow-sm'
      : 'border-l-4 border-app-primary bg-app-primary/[0.07] text-app-primary shadow-sm';
    const edgeIdle = isRtl
      ? 'border-r-4 border-transparent text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text'
      : 'border-l-4 border-transparent text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text';
    const iconActive = isActive
      ? 'bg-app-primary/15 text-app-primary'
      : 'bg-app-surface-variant text-app-text-tertiary group-hover:bg-app-surface-variant group-hover:text-app-text';
    return {
      wrap: `group flex items-center gap-3 rounded-app-input px-s12 py-s12 text-sm font-semibold outline-none transition-all duration-200 ease-out motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-app-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface ${
        isActive ? edgeActive : edgeIdle
      }`,
      icon: `flex h-10 w-10 shrink-0 items-center justify-center rounded-app-input transition-colors duration-200 ${iconActive}`,
    };
  };

  return (
    <div
      className={`flex min-h-screen bg-app-background font-cairo ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      <aside
        className={`sticky top-0 z-20 flex h-screen w-[272px] shrink-0 flex-col bg-app-surface shadow-app-card ${
          isRtl ? 'border-l border-app-divider' : 'border-r border-app-divider'
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-app-primary via-[#141b52] to-orange" aria-hidden />
        <div className="border-b border-app-divider px-s24 pb-s20 pt-s24">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-input bg-app-primary text-app-on-primary shadow-app-soft">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-app-text-tertiary">
                Super Admin
              </p>
              <p className="mt-1 text-base font-extrabold leading-tight tracking-tight text-app-text">
                {t(lang, 'adminConsole')}
              </p>
              {user?.email ? (
                <p className="mt-s8 truncate text-[13px] text-app-text-secondary" title={user.email}>
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-s6 overflow-y-auto overscroll-contain px-s12 py-s16" aria-label="Admin">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={(p) => linkClass(p).wrap}>
              {({ isActive }) => (
                <>
                  <span className={`${linkClass({ isActive }).icon}`}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-app-divider p-s16">
          <button
            type="button"
            aria-label={t(lang, 'logout')}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-app-input px-s16 py-s12 text-start text-app-body-sm font-semibold text-app-text-secondary outline-none transition-colors duration-200 hover:bg-app-error/[0.08] hover:text-app-error focus-visible:ring-2 focus-visible:ring-app-error/30 focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface"
            onClick={() => {
              logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-app-input bg-app-surface-variant text-app-text-tertiary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </span>
            {t(lang, 'logout')}
          </button>
        </div>
      </aside>

      <div className="relative min-h-screen min-w-0 flex-1 bg-gradient-to-b from-app-background via-app-background to-app-surface-variant/40">
        <Outlet />
      </div>
    </div>
  );
}
