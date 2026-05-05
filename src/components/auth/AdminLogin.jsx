import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { getStoredLanguage, t } from '../../i18n';
import AuthPageLayout from './AuthPageLayout';
import AuthPasswordInput from './AuthPasswordInput';
import Spinner from '../ui/Spinner';
import {
  authInputClass,
  authLabelClass,
  authLinkMutedClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

function AdminLoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyChoices, setCompanyChoices] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyActionLoading, setCompanyActionLoading] = useState(false);
  const [companyActionError, setCompanyActionError] = useState('');
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const [lang, setLang] = useState(getStoredLanguage());
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (companyChoices) {
      setCompanyChoices(null);
      setSelectedCompanyId('');
      setCompanyModalOpen(false);
      setCompanyActionError('');
    }
  };

  const finishAdminLogin = (response) => {
    const u = response.data.user;
    const activeId = response.data.activeCompanyId;
    login(activeId ? { ...u, activeCompanyId: String(activeId) } : u, response.data.token);
    setCompanyChoices(null);
    setSelectedCompanyId('');
    setCompanyModalOpen(false);
    setCompanyActionError('');
    setPendingLoginData(null);
    navigate('/admin', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData.email, formData.password, undefined, true);
      if (response?.data && response.status === 200) {
        const companiesFromSuccess = response?.data?.user?.companies || [];
        if (companiesFromSuccess.length > 0) {
          setCompanyChoices(companiesFromSuccess);
          setSelectedCompanyId(
            response?.data?.activeCompanyId
              ? String(response.data.activeCompanyId)
              : String(companiesFromSuccess[0]?.companyId || '')
          );
          setPendingLoginData(response.data);
          setCompanyModalOpen(true);
          return;
        }
        finishAdminLogin(response);
      }
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 400 && Array.isArray(data?.companies) && data.companies.length > 0) {
        setCompanyChoices(data.companies);
        const firstId = data.companies[0].companyId;
        setSelectedCompanyId(firstId != null ? String(firstId) : '');
        setCompanyActionError(data.message || '');
        setCompanyModalOpen(true);
      } else {
        if (err.response?.status === 403) {
          setError(
            lang === 'ar'
              ? 'دخول لوحة الإدارة للمسؤول الأعلى فقط. استخدمي تسجيل دخول فريق الشركة.'
              : data?.message ||
                  'Platform administrator access only. Use the team / company sign-in page.'
          );
        } else {
          setError(
            data?.message ||
              (lang === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Invalid email or password.')
          );
        }
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompanyChoice = async () => {
    if (!selectedCompanyId || companyActionLoading) return;
    if (
      pendingLoginData?.token &&
      String(pendingLoginData.activeCompanyId || '') === String(selectedCompanyId)
    ) {
      finishAdminLogin({ data: pendingLoginData });
      return;
    }
    setCompanyActionLoading(true);
    setCompanyActionError('');
    try {
      const response = await authAPI.login(formData.email, formData.password, selectedCompanyId, true);
      if (response?.data && response.status === 200) {
        finishAdminLogin(response);
      }
    } catch (apiError) {
      setCompanyActionError(apiError?.response?.data?.message || 'Unable to continue.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  return (
    <AuthPageLayout>
      <div className="w-full max-w-app-form">
        <div className="mb-s24 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-app-text-tertiary">
            Super Admin
          </p>
          <h1 className="mt-s8 text-[28px] font-bold tracking-tight text-app-text">
            {lang === 'ar' ? 'دخول لوحة الإدارة' : 'Admin console sign-in'}
          </h1>
          <p className="mt-s8 text-[13px] text-app-text-secondary">
            {lang === 'ar'
              ? 'للمسؤولين عن المنصة فقط — ليس نفس دخول فريق الشركة.'
              : 'Platform staff only — not the same as your team workspace login.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-s24 space-y-s20">
          {error ? (
            <div className="rounded-app-input border border-app-error/40 bg-app-error/10 p-s16 text-[13px] text-app-error">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="admin-email" className={authLabelClass}>
              {t(lang, 'emailAddress')}
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={authInputClass}
              placeholder={t(lang, 'emailAddress')}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className={authLabelClass}>
              {t(lang, 'password')}
            </label>
            <AuthPasswordInput
              lang={lang}
              id="admin-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
              placeholder={t(lang, 'password')}
            />
          </div>

          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? (
              <>
                <Spinner size="sm" color="white" />
                <span className="ml-2">{t(lang, 'signingIn')}</span>
              </>
            ) : (
              t(lang, 'signIn')
            )}
          </button>
        </form>

        <div className="mt-s24 text-center">
          <button
            type="button"
            className={`${authLinkMutedClass} text-[13px]`}
            onClick={() => navigate('/login')}
          >
            {lang === 'ar' ? 'تسجيل دخول فريق العمل ←' : '← Team / company sign-in'}
          </button>
        </div>
      </div>

      {companyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-text/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-app border border-app-divider bg-app-surface p-s24 shadow-app-card">
            <h2 className="text-[16px] font-semibold text-app-text">{t(lang, 'chooseWorkspace')}</h2>
            <p className="mt-s8 text-[13px] text-app-text-secondary">{t(lang, 'multiCompanySelect')}</p>
            <div className="mt-s16 max-h-64 space-y-s8 overflow-auto pr-1">
              {(companyChoices || []).map((c) => {
                const id = c?.companyId != null ? String(c.companyId) : '';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCompanyId(id)}
                    className={`w-full rounded-app-input border px-s16 py-s12 text-left transition ${
                      selectedCompanyId === id
                        ? 'border-app-primary bg-app-primary/8 ring-1 ring-app-primary/20'
                        : 'border-app-border bg-app-background hover:border-app-text-tertiary'
                    }`}
                  >
                    <div className="text-[14px] font-semibold text-app-text">
                      {(c?.company && c.company.name) || 'Company'}
                    </div>
                  </button>
                );
              })}
            </div>
            {companyActionError ? (
              <p className="mt-s12 text-[13px] text-app-error">{companyActionError}</p>
            ) : null}
            <div className="mt-s24 flex justify-end gap-s12">
              <button
                type="button"
                className="rounded-app-input border border-app-border px-s16 py-2 text-[14px] text-app-text-secondary hover:bg-app-surface-variant"
                disabled={companyActionLoading}
                onClick={() => {
                  setCompanyModalOpen(false);
                  setCompanyActionError('');
                  setPendingLoginData(null);
                }}
              >
                {t(lang, 'back')}
              </button>
              <button
                type="button"
                disabled={!selectedCompanyId || companyActionLoading}
                className="rounded-app-btn bg-orange px-s20 py-2 text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
                onClick={handleConfirmCompanyChoice}
              >
                {companyActionLoading ? t(lang, 'pleaseWait') : t(lang, 'continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthPageLayout>
  );
}

export default function AdminLogin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-background font-cairo">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <AdminLoginForm />;
}
