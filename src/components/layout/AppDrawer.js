import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredLanguage, t } from '../../i18n';

const AppDrawer = ({ open, onClose }) => {
  const { user, logout, canSeeSubscriptionNav } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(getStoredLanguage());
  const isRtl = lang === 'ar';
  const activeCompanyId = user?.activeCompanyId ? String(user.activeCompanyId) : '';
  const activeMembership =
    (user?.companies || []).find((entry) => {
      const raw = entry?.companyId ?? entry?.company?._id ?? entry?.company;
      return raw != null && String(raw) === activeCompanyId;
    }) || null;
  const activeCompanyName = activeMembership?.company?.name || '';
  const activeRoleLabel = activeMembership?.isOwner
    ? 'owner'
    : (activeMembership?.companyRole || user?.title || '');

  const menuItemsAll = [
    {
      text: t(lang, 'home'),
      path: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      text: t(lang, 'chat'),
      path: '/chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      text: t(lang, 'attendance'),
      path: '/attendance',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      text: t(lang, 'subscription'),
      path: '/subscription',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 2.686-6 6h12c0-3.314-2.686-6-6-6zm0 0V5m0 0L9.5 7.5M12 5l2.5 2.5M5 19h14" />
        </svg>
      )
    },
    {
      text: t(lang, 'settings'),
      path: '/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const menuItems = menuItemsAll
  .filter(
    (item) => item.path !== '/subscription' || canSeeSubscriptionNav()
  );

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} z-50 h-full w-72 transform border-app-divider bg-app-surface shadow-app-card transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'
          } ${isRtl ? 'border-l' : 'border-r'}`}
      >
        <div className="flex h-full flex-col">
          {/* User Profile Section */}
          <div className="border-b border-app-divider p-s24">
            <div className="mb-s16 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-app-primary text-lg font-bold text-app-on-primary">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-app-text">
                  {activeCompanyName || user?.name}
                </h3>
                <p className="truncate text-sm text-app-text-secondary">{activeRoleLabel}</p>
                {activeCompanyName && (
                  <p className="mt-0.5 truncate text-xs text-app-text-tertiary">{user?.name}</p>
                )}
              </div>
            </div>
            {user?.email && (
              <div className="flex items-center gap-2 text-sm text-app-text-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 py-s16">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex w-full items-center gap-4 px-s24 py-s16 font-cairo transition-colors ${
                    isActive
                      ? isRtl
                        ? 'border-r-4 border-app-primary bg-app-primary/[0.08] font-semibold text-app-primary'
                        : 'border-l-4 border-app-primary bg-app-primary/[0.08] font-semibold text-app-primary'
                      : isRtl
                        ? 'border-r-4 border-transparent text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text'
                        : 'border-l-4 border-transparent text-app-text-secondary hover:bg-app-surface-variant hover:text-app-text'
                  }`}
                >
                  <span className={isActive ? 'text-app-primary [&_svg]:stroke-current' : '[&_svg]:stroke-current'}>
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="border-t border-app-divider p-s16">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-app-input px-s24 py-s16 font-cairo text-app-text-secondary transition-colors hover:bg-app-error/10 hover:text-app-error"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">{t(lang, 'logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppDrawer;
