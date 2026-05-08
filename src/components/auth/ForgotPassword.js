import React, { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';
import AuthPageLayout from './AuthPageLayout';
import {
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

const ForgotPassword = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(getStoredLanguage());
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword(formData.email);
      setSuccess('OTP sent to your email. Please check your inbox.');
      setStep(1);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.verifyOTP(formData.email, formData.otp, formData.newPassword);
      setSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: t(lang, 'enterEmail'), description: t(lang, 'receiveOtp') },
    { number: 2, title: t(lang, 'verifyAndReset'), description: t(lang, 'setNewPassword') }
  ];

  useEffect(() => {
    const onLanguageChanged = () => setLang(getStoredLanguage());
    window.addEventListener('language-changed', onLanguageChanged);
    return () => window.removeEventListener('language-changed', onLanguageChanged);
  }, []);

  return (
    <AuthPageLayout>
      <div className="w-full max-w-2xl">
        <div className="mb-s36 flex justify-center">
          <div className="rounded-full bg-app-primary p-s16 shadow-none">
            <img src="/logo4.webp" alt="" className="h-[72px] w-[72px] object-contain sm:h-[90px] sm:w-[90px]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-app-text">
            {t(lang, 'resetPassword')}
          </h1>
          <p className="mt-s8 text-[13px] text-app-text-secondary">
            {step === 0 ? t(lang, 'resetPasswordSubtitleEmail') : t(lang, 'resetPasswordSubtitleOtp')}
          </p>
        </div>

        <div className="mb-s36 mt-s36">
          <div className="flex flex-wrap items-start justify-center gap-y-s24">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center px-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-all ${
                      step >= index
                        ? 'bg-orange text-white shadow-app-soft'
                        : 'border-2 border-app-border bg-app-surface-variant text-app-text-tertiary'
                    }`}
                  >
                    {step > index ? (
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  <div className="mt-s8 max-w-[140px] text-center">
                    <div
                      className={`text-[13px] font-semibold ${
                        step >= index ? 'text-app-text' : 'text-app-text-tertiary'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="mt-1 text-[12px] text-app-text-secondary">{s.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 mb-14 hidden h-1 w-16 rounded self-center sm:block ${
                      step > index ? 'bg-orange' : 'bg-app-border'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="w-full rounded-app border border-app-divider bg-app-surface p-s24 shadow-app-soft">
          {error && (
            <div className="mb-s24 animate-fade-in rounded-app-input border border-app-error/40 bg-app-error/10 p-s16">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-app-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="flex-1 text-[13px] text-app-error">{error}</p>
                <button type="button" onClick={() => setError('')} className="text-app-error/80 hover:text-app-error" aria-label="Close error">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-s24 animate-fade-in rounded-app-input border border-app-success/40 bg-app-success/10 p-s16">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-app-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="flex-1 text-[13px] text-app-success">{success}</p>
                <button type="button" onClick={() => setSuccess('')} className="text-app-success/80 hover:text-app-success" aria-label="Close success message">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={step === 0 ? handleSendOTP : handleVerifyOTP} className="space-y-s24">
            {step === 0 ? (
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
                  className={authInputClass}
                  placeholder="Enter your registered email"
                />
                <p className="mt-s8 text-[13px] text-app-text-secondary">
                  We&apos;ll send a one-time password to this email address.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="otp" className={authLabelClass}>
                    OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    autoFocus
                    maxLength={6}
                    className={`${authInputClass} text-center font-mono text-2xl tracking-[0.35em]`}
                    placeholder="000000"
                  />
                  <p className="mt-s8 text-[13px] text-app-text-secondary">
                    Enter the 6-digit code sent to {formData.email}
                  </p>
                </div>

                <div>
                  <label htmlFor="newPassword" className={authLabelClass}>
                    {t(lang, 'password')}
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={authInputClass}
                    placeholder="Enter your new password"
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
                    autoComplete="new-password"
                    className={authInputClass}
                    placeholder="Confirm your new password"
                  />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
              {loading ? (
                <>
                  <ButtonBusyDots className="text-white" />
                  <span className="ml-2">{t(lang, 'processing')}</span>
                </>
              ) : step === 0 ? (
                t(lang, 'sendOtp')
              ) : (
                t(lang, 'resetPassword')
              )}
            </button>
          </form>

          <div className="mt-s24 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`${authLinkSecondaryClass} inline-flex items-center`}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t(lang, 'backToLogin')}
            </button>
          </div>
        </div>

        <p className="mt-s36 text-center text-[13px] text-app-text-tertiary">{t(lang, 'needHelpContactAdmin')}</p>
      </div>
    </AuthPageLayout>
  );
};

export default ForgotPassword;
