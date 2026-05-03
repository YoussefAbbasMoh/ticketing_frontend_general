import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import { getStoredLanguage, t } from '../../i18n';
import AuthPageLayout from './AuthPageLayout';
import {
  authInputClass,
  authLabelClass,
  authLinkMutedClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    if (companyChoices) {
      setCompanyChoices(null);
      setSelectedCompanyId('');
      setCompanyModalOpen(false);
      setCompanyActionError('');
    }
  };

  const finishLogin = (response) => {
    const u = response.data.user;
    const activeId = response.data.activeCompanyId;
    login(
      activeId ? { ...u, activeCompanyId: String(activeId) } : u,
      response.data.token
    );
    setCompanyChoices(null);
    setSelectedCompanyId('');
    setCompanyModalOpen(false);
    setCompanyActionError('');
    setPendingLoginData(null);
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted - preventDefault called');
    
    if (loading) {
      console.log('Already loading, returning');
      return false;
    }
  
    setLoading(true);
    setError('');
    console.log('Starting login attempt...');
  
    try {
      console.log('Calling authAPI.login...');
      const response = await authAPI.login(formData.email, formData.password);
      console.log('Response received:', response);
      
      if (response && response.data && response.status === 200) {
        const companiesFromSuccess = response?.data?.user?.companies || [];
        if (companiesFromSuccess.length > 0) {
          setCompanyChoices(companiesFromSuccess);
          setSelectedCompanyId(
            response?.data?.activeCompanyId
              ? String(response.data.activeCompanyId)
              : String(companiesFromSuccess[0]?.companyId || '')
          );
          setPendingLoginData(response.data);
          setCompanyActionError('');
          setCompanyModalOpen(true);
          setError('');
          return false;
        }
        console.log('Login successful, navigating...');
        finishLogin(response);
      }
    } catch (error) {
      console.log('Error caught:', error);
      const data = error.response?.data;
      if (error.response?.status === 400 && Array.isArray(data?.companies) && data.companies.length > 0) {
        setCompanyChoices(data.companies);
        const firstId = data.companies[0].companyId;
        setSelectedCompanyId(firstId != null ? String(firstId) : '');
        setCompanyActionError(
          data.message ||
            'اختر شركة واحدة للمتابعة / Choose one company to continue.'
        );
        setCompanyModalOpen(true);
        setError('');
      } else {
        const errorMessage = data?.message ||
                          error.message || 
                          'Wrong credentials. Please check your email and password and try again.';
        setError(errorMessage);
        setFormData(prev => ({ ...prev, password: '' }));
      }
      console.error('Login error:', error);
    } finally {
      console.log('Finally block - setting loading to false');
      setLoading(false);
    }
    
    return false;
  };

  const handleConfirmCompanyChoice = async () => {
    if (!selectedCompanyId || companyActionLoading) return;
    if (
      pendingLoginData &&
      pendingLoginData.token &&
      String(pendingLoginData.activeCompanyId || '') === String(selectedCompanyId)
    ) {
      finishLogin({ data: pendingLoginData });
      return;
    }

    setCompanyActionLoading(true);
    setCompanyActionError('');
    try {
      const response = await authAPI.login(
        formData.email,
        formData.password,
        selectedCompanyId
      );
      if (response && response.data && response.status === 200) {
        finishLogin(response);
      }
    } catch (apiError) {
      setCompanyActionError(
        apiError?.response?.data?.message || 'Unable to continue with selected company.'
      );
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
        {/* LogoBadge — circular primary like `logo_badge.dart` */}
        <div className="mb-s36 flex justify-center">
          <div className="rounded-full bg-app-primary p-s16 shadow-none">
            <img
              src="/logo4.webp"
              alt=""
              className="h-[72px] w-[72px] object-contain sm:h-[90px] sm:w-[90px]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-app-text">
            {t(lang, 'welcomeBack')}
          </h1>
          <p className="mt-s8 text-[13px] leading-normal text-app-text-secondary">
            {t(lang, 'signInSubtitle')}
          </p>
        </div>

        <div className="mt-s36 w-full">
          {error && (
            <div className="mb-s24 animate-fade-in rounded-app-input border border-app-error/40 bg-app-error/10 p-s16">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-app-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="flex-1 text-[13px] text-app-error">{error}</p>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="flex-shrink-0 text-app-error/80 hover:text-app-error"
                  aria-label="Close error"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-s24">
            <div>
              <label htmlFor="email" className={authLabelClass}>
                {t(lang, 'emailAddress')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                className={authInputClass}
                placeholder={t(lang, 'emailAddress')}
              />
            </div>

            <div>
              <label htmlFor="password" className={authLabelClass}>
                {t(lang, 'password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
                className={authInputClass}
                placeholder={t(lang, 'password')}
              />
            </div>

            {companyChoices && companyChoices.length > 0 && (
              <div>
                <label htmlFor="companyId" className={authLabelClass}>
                  {t(lang, 'company')}
                </label>
                <select
                  id="companyId"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={loading}
                  className={`${authInputClass} appearance-none bg-[length:1rem] bg-[right_12px_center] bg-no-repeat pr-10`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235C6378'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  }}
                >
                  {companyChoices.map((c) => {
                    const id = c.companyId != null ? String(c.companyId) : '';
                    const roleLabel = c.isOwner
                      ? 'Owner'
                      : c.companyRole
                        ? String(c.companyRole)
                        : '';
                    return (
                      <option key={id} value={id}>
                        {(c.company && c.company.name) || 'Company'}
                        {roleLabel ? ` · ${roleLabel}` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-s8 text-[12px] leading-relaxed text-app-text-secondary">
                  نفس البريد مسجّل في أكثر من شركة — اختر أين تريد العمل ثم اضغط «Sign In» مرة أخرى.
                  <br />
                  This email belongs to multiple companies — pick a workspace, then press Sign In again.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-s8">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                disabled={loading}
                className={`${authLinkSecondaryClass} disabled:cursor-not-allowed`}
              >
                {t(lang, 'forgotPassword')}
              </button>
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

          <div className="mt-s24 flex flex-col gap-s16 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="w-full rounded-app-input border border-app-border bg-app-surface py-3 text-[14px] font-semibold text-app-text shadow-none transition-colors hover:bg-app-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t(lang, 'backToLanding')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register-company')}
              disabled={loading}
              className={`${authLinkMutedClass} disabled:cursor-not-allowed`}
            >
              {t(lang, 'newCompanyCreateWorkspace')}
            </button>
          </div>
        </div>

        <p className="mt-s36 text-center text-[13px] text-app-text-tertiary">
          © {new Date().getFullYear()} Tik — Team operations
        </p>
      </div>

      {companyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-text/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-app border border-app-divider bg-app-surface p-s24 shadow-app-card">
            <h2 className="text-[16px] font-semibold leading-snug text-app-text">{t(lang, 'chooseWorkspace')}</h2>
            <p className="mt-s8 text-[13px] text-app-text-secondary">{t(lang, 'multiCompanySelect')}</p>

            <div className="mt-s16 max-h-64 space-y-s8 overflow-auto pr-1">
              {(companyChoices || []).map((c) => {
                const id = c?.companyId != null ? String(c.companyId) : '';
                const roleLabel = c?.isOwner ? 'Owner' : (c?.companyRole || 'member');
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
                    <div className="text-[12px] text-app-text-secondary">Role: {String(roleLabel)}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-s20 rounded-app-input border border-app-border bg-app-surface-variant p-s16">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-app-text">{t(lang, 'needNewCompany')}</p>
                  <p className="text-[12px] text-app-text-secondary">{t(lang, 'openRegistrationHelp')}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/register-company', {
                      state: {
                        prefillEmail: formData.email,
                        prefillPassword: formData.password,
                      },
                    })
                  }
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange text-app-on-secondary hover:opacity-95"
                  title="Go to register company page"
                >
                  +
                </button>
              </div>
            </div>

            {companyActionError && (
              <p className="mt-s12 text-[13px] text-app-error">{companyActionError}</p>
            )}

            <div className="mt-s24 flex items-center justify-end gap-s12">
              <button
                type="button"
                onClick={() => {
                  setCompanyModalOpen(false);
                  setCompanyActionError('');
                  setPendingLoginData(null);
                }}
                className="rounded-app-input border border-app-border px-s16 py-2 text-[14px] text-app-text-secondary hover:bg-app-surface-variant"
                disabled={companyActionLoading}
              >
                {t(lang, 'back')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompanyChoice}
                disabled={!selectedCompanyId || companyActionLoading}
                className="rounded-app-btn bg-orange px-s20 py-2 text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {companyActionLoading ? t(lang, 'pleaseWait') : t(lang, 'continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default Login;