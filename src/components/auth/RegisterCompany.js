import React, { useEffect, useState } from 'react';
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
  authFieldErrorClass,
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';
import {
  getPersonNameFieldError,
  isStrongPassword,
} from '../../utils/personNameValidation';

const EMPTY_FIELD_ERRORS = {
  ownerName: '',
  companyName: '',
  email: '',
  password: '',
  otp: '',
};

function AuthFieldError({ message }) {
  if (!message) return null;
  return (
    <p className={authFieldErrorClass} role="alert">
      {message}
    </p>
  );
}

const inputClassFor = (hasError) =>
  hasError
    ? `${authInputClass} border-app-error focus:border-app-error focus:ring-app-error/25`
    : authInputClass;

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
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [emailExistsOfferLogin, setEmailExistsOfferLogin] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const collectRegisterFieldErrors = () => {
    const next = { ...EMPTY_FIELD_ERRORS };
    const ownerErr = getPersonNameFieldError(formData.ownerName, (key) => t(lang, key));
    if (ownerErr) next.ownerName = ownerErr;
    if (!formData.companyName.trim()) next.companyName = t(lang, 'valCompanyNameRequired');
    else if (formData.companyName.trim().length < 2) next.companyName = t(lang, 'valCompanyNameMin2');
    if (!formData.email.trim()) next.email = t(lang, 'valEmailRequired');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = t(lang, 'valEmailInvalidSignup');
    if (!formData.password) next.password = t(lang, 'valPasswordRequired');
    else if (!isStrongPassword(formData.password)) next.password = t(lang, 'valPasswordStrongPolicy');
    return next;
  };

  const collectOtpFieldError = () => {
    const trimmed = otp.trim();
    if (!trimmed) return t(lang, 'valOtpRequired');
    if (!/^\d{6}$/.test(trimmed)) return t(lang, 'valOtpInvalid');
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (infoMessage) setInfoMessage('');
    if (emailExistsOfferLogin) setEmailExistsOfferLogin(false);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

  const mapRegisterApiErrorToFields = (status, data) => {
    const code = data?.code;
    const msg = localizeRegisterSubmitError(lang, status, data);
    const next = { ...EMPTY_FIELD_ERRORS };
    if (code === 'ACCOUNT_EXISTS_USE_LOGIN') {
      next.email = t(lang, 'registerAccountExists');
      return { fields: next, offerLogin: true, banner: '' };
    }
    if (
      code === 'OWNER_NAME_INVALID_CHARS' ||
      code === 'OWNER_NAME_NOT_FULL' ||
      code === 'OWNER_NAME_WORD_TOO_SHORT'
    ) {
      next.ownerName = msg;
      return { fields: next, offerLogin: false, banner: '' };
    }
    if (code === 'COMPANY_NAME_TOO_SHORT' || code === 'DUPLICATE_COMPANY_NAME') {
      next.companyName = msg;
      return { fields: next, offerLogin: false, banner: '' };
    }
    if (String(msg).toLowerCase().includes('password')) {
      next.password = msg;
      return { fields: next, offerLogin: false, banner: '' };
    }
    return { fields: EMPTY_FIELD_ERRORS, offerLogin: false, banner: msg };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const nextFieldErrors = collectRegisterFieldErrors();
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      setError('');
      setEmailExistsOfferLogin(false);
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setEmailExistsOfferLogin(false);
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
      const mapped = mapRegisterApiErrorToFields(st, data);
      setFieldErrors(mapped.fields);
      setEmailExistsOfferLogin(mapped.offerLogin);
      setError(mapped.banner);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    const otpErr = collectOtpFieldError();
    if (otpErr) {
      setFieldErrors({ ...EMPTY_FIELD_ERRORS, otp: otpErr });
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors(EMPTY_FIELD_ERRORS);
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
      const otpMsg = localizeVerifyRegistrationOtpError(
        lang,
        apiError?.response?.status,
        apiError?.response?.data || {}
      );
      setFieldErrors({ ...EMPTY_FIELD_ERRORS, otp: otpMsg });
      setError('');
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
    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
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
          <div className="rounded-full bg-app-primary p-s12 shadow-app-soft ring-4 ring-app-primary/15">
            <img
              src="/logo4.webp"
              alt=""
              className="h-[80px] w-[80px] rounded-full object-contain sm:h-[96px] sm:w-[96px]"
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

        <div className="mt-s36 w-full rounded-app border border-app-divider bg-app-surface p-s24 shadow-app-card">
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
            <form onSubmit={handleSubmit} className="space-y-s20" noValidate>
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
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.ownerName)}
                  className={inputClassFor(Boolean(fieldErrors.ownerName))}
                  placeholder={t(lang, 'placeholderOwnerSignup')}
                />
                <AuthFieldError message={fieldErrors.ownerName} />
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
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.companyName)}
                  className={inputClassFor(Boolean(fieldErrors.companyName))}
                  placeholder={t(lang, 'placeholderCompanySignup')}
                />
                <AuthFieldError message={fieldErrors.companyName} />
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
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={inputClassFor(Boolean(fieldErrors.email))}
                  placeholder={t(lang, 'placeholderWorkEmailSignup')}
                />
                <AuthFieldError message={fieldErrors.email} />
                {emailExistsOfferLogin && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/login', {
                        state: { prefillEmail: formData.email.trim().toLowerCase() },
                      })
                    }
                    className={`${authLinkSecondaryClass} mt-s8 text-[13px]`}
                  >
                    {t(lang, 'signIn')} →
                  </button>
                )}
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
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.password)}
                  inputClassName={inputClassFor(Boolean(fieldErrors.password))}
                  placeholder={t(lang, 'placeholderPasswordMin8')}
                />
                <AuthFieldError message={fieldErrors.password} />
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
