import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { ButtonBusyDots } from '../ui/LoadingSkeletons';
import { getStoredLanguage, t } from '../../i18n';
import AuthPageLayout from './AuthPageLayout';
import {
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authPrimaryButtonClass,
} from './authFieldClasses';

/** Match backend invite normalization (trim, strip ZWSP, lowercase hex). */
const normalizeInviteToken = (raw) =>
  String(raw || '')
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase();

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(
    () => normalizeInviteToken(searchParams.get('token') || ''),
    [searchParams]
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lang, setLang] = useState(getStoredLanguage());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invitation token is missing or invalid.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await userAPI.acceptInvite(token, password);
      setSuccess('Invitation accepted successfully. You can now login.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Could not accept invitation.');
    } finally {
      setLoading(false);
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
        <div className="mb-s36 flex justify-center">
          <div className="rounded-full bg-app-primary p-s16 shadow-none">
            <img src="/logo4.webp" alt="" className="h-[72px] w-[72px] object-contain sm:h-[90px] sm:w-[90px]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-app-text">
            {t(lang, 'acceptInvitation')}
          </h1>
          <p className="mt-s8 text-[13px] text-app-text-secondary">{t(lang, 'setPasswordActivate')}</p>
        </div>

        <div className="mt-s36 w-full rounded-app border border-app-divider bg-app-surface p-s24 shadow-app-soft">
          {!token && (
            <div className="mb-s16 rounded-app-input border border-app-error/40 bg-app-error/10 p-s12 text-[13px] text-app-error">
              Invitation token is missing. Please use the link from your email.
            </div>
          )}
          {error && (
            <div className="mb-s16 rounded-app-input border border-app-error/40 bg-app-error/10 p-s12 text-[13px] text-app-error">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-s16 rounded-app-input border border-app-success/40 bg-app-success/10 p-s12 text-[13px] text-app-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-s20">
            <div>
              <label htmlFor="password" className={authLabelClass}>
                {t(lang, 'password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={authInputClass}
                placeholder={t(lang, 'enterYourPassword')}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={authLabelClass}>
                {t(lang, 'confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={authInputClass}
                placeholder={t(lang, 'confirmYourPassword')}
              />
            </div>

            <button type="submit" disabled={loading || !token} className={authPrimaryButtonClass}>
              {loading ? (
                <>
                  <ButtonBusyDots className="text-white" />
                  <span className="ml-2">{t(lang, 'pleaseWait')}</span>
                </>
              ) : (
                t(lang, 'setPassword')
              )}
            </button>
          </form>

          <div className="mt-s24 text-center">
            <button type="button" onClick={() => navigate('/login')} className={authLinkSecondaryClass}>
              {t(lang, 'backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
};

export default AcceptInvite;
