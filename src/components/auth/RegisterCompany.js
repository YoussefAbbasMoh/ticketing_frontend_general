import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';
import {
  localizeRegisterNetworkError,
  localizeRegisterSubmitError,
  localizeResendRegistrationOtpError,
  localizeVerifyRegistrationOtpError,
} from '../../utils/registerAuthErrors';
import AuthPageLayout from './AuthPageLayout';
import AuthPasswordInput from './AuthPasswordInput';
import {
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

const TIK_REGISTER_PREFILL_KEY = 'tik_register_prefill';
const TIK_SELECTED_PLAN_KEY = 'tik_selected_plan';

const RESEND_COOLDOWN_SEC = 60;

const RegisterCompany = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const prefillEmail = location.state?.prefillEmail || '';
  const prefillPassword = location.state?.prefillPassword || '';

  const [phase, setPhase] = useState('register');
  const [formData, setFormData] = useState({
    ownerName: '',
    companyName: '',
    email: prefillEmail,
    password: prefillPassword,
  });
  const [otp, setOtp] = useState('');
  const [pendingActiveCompanyId, setPendingActiveCompanyId] = useState(null);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/workspaces/new', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const isValidOwnerFullName = (name) => {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length < 2) return false;
    return parts.every((w) => w.length >= 2);
  };

  const validationError = useMemo(() => {
    if (!formData.ownerName.trim()) return t(lang, 'valOwnerNameRequired');
    if (!isValidOwnerFullName(formData.ownerName)) return t(lang, 'valOwnerNameFullName');
    if (!formData.companyName.trim()) return t(lang, 'valCompanyNameRequired');
    if (formData.companyName.trim().length < 2) return t(lang, 'valCompanyNameMin2');
    if (!formData.email.trim()) return t(lang, 'valEmailRequired');
    if (!/\S+@\S+\.\S+/.test(formData.email)) return t(lang, 'valEmailInvalidSignup');
    if (!formData.password) return t(lang, 'valPasswordRequired');
    if (formData.password.length < 8) return t(lang, 'valPasswordMin8');
    return '';
  }, [formData, lang]);

  const otpValidationError = useMemo(() => {
    const trimmed = otp.trim();
    if (!trimmed) return t(lang, 'valOtpRequired');
    if (!/^\d{6}$/.test(trimmed)) return t(lang, 'valOtpInvalid');
    return '';
  }, [otp, lang]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (infoMessage) setInfoMessage('');
  };

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SEC);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const applyAuthSuccess = (response) => {
    const u = response.data.user;
    const activeId = response.data.activeCompanyId ?? response.data.company?.id;
    login(activeId ? { ...u, activeCompanyId: String(activeId) } : u, response.data.token);
    navigate('/', { replace: true });
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
    setInfoMessage('');

    try {
      const response = await authAPI.registerCompany({
        ownerName: formData.ownerName.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response?.status !== 201 || !response?.data) {
        return;
      }

      const data = response.data;
      if (data.token && data.user) {
        applyAuthSuccess(response);
        return;
      }

      if (data.requiresEmailVerification) {
        setPendingActiveCompanyId(
          data.activeCompanyId != null ? String(data.activeCompanyId) : null
        );
        setPhase('verify');
        setOtp('');
        startResendCooldown();
        setInfoMessage(t(lang, 'verifyEmailSuccessHint'));
        return;
      }

      setError(t(lang, 'errRegisterUnexpectedResponse'));
    } catch (apiError) {
      const netMsg = localizeRegisterNetworkError(lang, apiError);
      if (netMsg) {
        setError(netMsg);
        return;
      }
      const st = apiError?.response?.status;
      const data = apiError?.response?.data || {};
      if (st === 409 && data?.code === 'ACCOUNT_EXISTS_USE_LOGIN') {
        navigate('/login', {
          replace: true,
          state: {
            prefillEmail: data.email || formData.email.trim().toLowerCase(),
          },
        });
        return;
      }
      setError(localizeRegisterSubmitError(lang, st, data));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (otpValidationError) {
      setError(otpValidationError);
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await authAPI.verifyRegistrationOtp({
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim(),
        ...(pendingActiveCompanyId ? { companyId: pendingActiveCompanyId } : {}),
      });

      if (response?.status === 200 && response?.data?.token && response?.data?.user) {
        applyAuthSuccess(response);
      } else {
        setError(t(lang, 'errVerifyUnexpected'));
      }
    } catch (apiError) {
      const netMsg = localizeRegisterNetworkError(lang, apiError);
      if (netMsg) {
        setError(netMsg);
        return;
      }
      setError(
        localizeVerifyRegistrationOtpError(
          lang,
          apiError?.response?.status,
          apiError?.response?.data || {}
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      await authAPI.resendRegistrationOtp(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      setInfoMessage(t(lang, 'verifyEmailSuccessHint'));
      startResendCooldown();
    } catch (apiError) {
      const netMsg = localizeRegisterNetworkError(lang, apiError);
      if (netMsg) {
        setError(netMsg);
        return;
      }
      setError(
        localizeResendRegistrationOtpError(
          lang,
          apiError?.response?.status,
          apiError?.response?.data || {}
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(v);
    if (error) setError('');
    if (infoMessage) setInfoMessage('');
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
    const ownerQ =
      searchParams.get('owner') ||
      searchParams.get('ownerName') ||
      fromStorage?.ownerName ||
      '';
    const emailQ = searchParams.get('email') || fromStorage?.email || '';
    const passwordQ = fromStorage?.password || '';

    if (!ownerQ && !companyQ && !emailQ && !passwordQ) return;

    setFormData((prev) => ({
      ...prev,
      ...(ownerQ ? { ownerName: ownerQ } : {}),
      ...(companyQ ? { companyName: companyQ } : {}),
      ...(emailQ ? { email: emailQ } : {}),
      ...(passwordQ ? { password: passwordQ } : {}),
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

  const verifySubtitle = t(lang, 'verifyEmailSubtitle').replace(
    '{email}',
    formData.email.trim() || '—'
  );

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
            {phase === 'verify' ? t(lang, 'verifyEmailTitle') : t(lang, 'registerTrialTitle')}
          </h1>
          <p className="mt-s8 text-[13px] leading-normal text-app-text-secondary">
            {phase === 'verify' ? verifySubtitle : t(lang, 'registerTrialSubtitle')}
          </p>
        </div>

        <div className="mt-s36 w-full">
          {error && (
            <div className="mb-s24 rounded-app-input border border-app-error/40 bg-app-error/10 p-s16">
              <p className="text-[13px] text-app-error">{error}</p>
            </div>
          )}

          {infoMessage && !error && (
            <div className="mb-s24 rounded-app-input border border-app-border bg-app-surface-variant p-s16">
              <p className="text-[13px] text-app-text-secondary">{infoMessage}</p>
            </div>
          )}

          {phase === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-s20">
              <div>
                <label htmlFor="ownerName" className={authLabelClass}>
                  {t(lang, 'signupOwnerName')}
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  autoComplete="name"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={authInputClass}
                  placeholder={t(lang, 'placeholderOwnerSignup')}
                />
              </div>

              <div>
                <label htmlFor="companyName" className={authLabelClass}>
                  {t(lang, 'signupCompanyName')}
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={authInputClass}
                  placeholder={t(lang, 'placeholderCompanySignup')}
                />
              </div>

              <div>
                <label htmlFor="email" className={authLabelClass}>
                  {t(lang, 'signupWorkEmail')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={authInputClass}
                  placeholder={t(lang, 'placeholderWorkEmailSignup')}
                />
              </div>

              <div>
                <label htmlFor="password" className={authLabelClass}>
                  {t(lang, 'password')}
                </label>
                <AuthPasswordInput
                  lang={lang}
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder={t(lang, 'placeholderPasswordMin8')}
                />
              </div>

              <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
                {loading ? (
                  <>
                    <ButtonBusyDots className="text-white" />
                    <span className="ml-2">{t(lang, 'creatingFreeAccount')}</span>
                  </>
                ) : (
                  t(lang, 'createFreeAccount')
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-s20">
              <div>
                <label htmlFor="regOtp" className={authLabelClass}>
                  {t(lang, 'verificationCode')}
                </label>
                <input
                  id="regOtp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={loading}
                  className={`${authInputClass} text-center font-mono text-[22px] tracking-[0.35em]`}
                  placeholder="000000"
                />
              </div>

              <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
                {loading ? (
                  <>
                    <ButtonBusyDots className="text-white" />
                    <span className="ml-2">{t(lang, 'verifyingCode')}</span>
                  </>
                ) : (
                  t(lang, 'verifyEmailConfirm')
                )}
              </button>

              <div className="flex flex-col items-center gap-s12 pt-s8">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className={`${authLinkSecondaryClass} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {resendCooldown > 0
                    ? t(lang, 'resendCooldownSec').replace('{n}', String(resendCooldown))
                    : t(lang, 'resendCode')}
                </button>
              </div>
            </form>
          )}

          <p className="mt-s24 text-center text-[12px] leading-relaxed text-app-text-tertiary">
            {phase === 'register' ? t(lang, 'signupLegalNotice') : '\u00a0'}
          </p>

          <div className="mt-s24 flex flex-col gap-s16 text-center">
            {phase === 'verify' && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={loading}
                className={`${authLinkSecondaryClass} disabled:cursor-not-allowed`}
              >
                {t(lang, 'verifyEmailBackToLogin')}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="w-full rounded-app-input border border-app-border bg-app-surface py-3 text-[14px] font-semibold text-app-text shadow-none transition-colors hover:bg-app-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t(lang, 'backToLanding')}
            </button>
            {phase === 'register' && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={loading}
                className={`${authLinkSecondaryClass} disabled:cursor-not-allowed`}
              >
                {t(lang, 'alreadyHaveAccount')}
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default RegisterCompany;
