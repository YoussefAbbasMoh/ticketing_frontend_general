import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import Spinner from '../ui/Spinner';
import { getStoredLanguage, t } from '../../i18n';
import AuthPageLayout from './AuthPageLayout';
import {
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

const TIK_REGISTER_PREFILL_KEY = 'tik_register_prefill';
const TIK_SELECTED_PLAN_KEY = 'tik_selected_plan';

const RegisterCompany = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const prefillEmail = location.state?.prefillEmail || '';
  const prefillPassword = location.state?.prefillPassword || '';

  const [formData, setFormData] = useState({
    companyName: '',
    email: prefillEmail,
    password: prefillPassword,
    confirmPassword: prefillPassword,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());

  const validationError = useMemo(() => {
    if (!formData.companyName.trim()) return 'Company name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return '';
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.registerCompany({
        companyName: formData.companyName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response?.status === 201 && response?.data?.token && response?.data?.user) {
        const u = response.data.user;
        const activeId =
          response.data.activeCompanyId ?? response.data.company?.id;
        login(
          activeId ? { ...u, activeCompanyId: String(activeId) } : u,
          response.data.token
        );
        navigate('/', { replace: true });
      }
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          'Could not create your company account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  useEffect(() => {
    let fromStorage = null;
    try {
      const raw = sessionStorage.getItem(TIK_REGISTER_PREFILL_KEY);
      if (raw) {
        fromStorage = JSON.parse(raw);
        sessionStorage.removeItem(TIK_REGISTER_PREFILL_KEY);
      }
    } catch {
      sessionStorage.removeItem(TIK_REGISTER_PREFILL_KEY);
    }

    const companyQ =
      searchParams.get('company') ||
      searchParams.get('companyName') ||
      fromStorage?.companyName ||
      '';
    const emailQ = searchParams.get('email') || fromStorage?.email || '';
    const passwordQ = fromStorage?.password || '';
    const confirmQ =
      fromStorage?.confirmPassword != null
        ? fromStorage.confirmPassword
        : passwordQ;

    if (!companyQ && !emailQ && !passwordQ) return;

    setFormData((prev) => ({
      ...prev,
      ...(companyQ ? { companyName: companyQ } : {}),
      ...(emailQ ? { email: emailQ } : {}),
      ...(passwordQ ? { password: passwordQ } : {}),
      ...(confirmQ ? { confirmPassword: confirmQ } : {}),
    }));
  }, [searchParams]);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (!plan) return;
    try {
      sessionStorage.setItem(TIK_SELECTED_PLAN_KEY, plan);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  return (
    <AuthPageLayout>
      <div className="w-full max-w-app-form">
        <div className="mb-s36 flex justify-center">
          <div className="rounded-full bg-app-primary p-s16 shadow-none">
            <img
              src="/logo4.webp"
              alt=""
              className="h-[72px] w-[72px] object-contain sm:h-[90px] sm:w-[90px]"
            />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-app-text">
            {t(lang, 'createCompanyAccount')}
          </h1>
          <p className="mt-s8 text-[13px] leading-normal text-app-text-secondary">{t(lang, 'setupWorkspace')}</p>
        </div>

        <div className="mt-s36 w-full">
          {error && (
            <div className="mb-s24 rounded-app-input border border-app-error/40 bg-app-error/10 p-s16">
              <p className="text-[13px] text-app-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-s20">
            <div>
              <label htmlFor="companyName" className={authLabelClass}>
                {t(lang, 'companyName')}
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
                className={authInputClass}
                placeholder="e.g. Acme Solutions"
              />
            </div>

            <div>
              <label htmlFor="email" className={authLabelClass}>
                {t(lang, 'workEmail')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className={authInputClass}
                placeholder="owner@company.com"
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
                disabled={loading}
                className={authInputClass}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={authLabelClass}>
                {t(lang, 'confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className={authInputClass}
                placeholder="Re-enter password"
              />
            </div>

            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span className="ml-2">{t(lang, 'creatingWorkspace')}</span>
                </>
              ) : (
                t(lang, 'createCompany')
              )}
            </button>
          </form>

          <div className="mt-s24 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              disabled={loading}
              className={`${authLinkSecondaryClass} disabled:cursor-not-allowed`}
            >
              {t(lang, 'alreadyHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default RegisterCompany;
