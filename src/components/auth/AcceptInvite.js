import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userAPI } from '../../services/api';
import Spinner from '../ui/Spinner';
import { getStoredLanguage, t } from '../../i18n';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t(lang, 'acceptInvitation')}</h1>
          <p className="text-gray-400">{t(lang, 'setPasswordActivate')}</p>
        </div>

        <div className="bg-primary-800 rounded-2xl shadow-2xl p-8 border border-primary-700">
          {!token && (
            <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-sm text-red-200">
              Invitation token is missing. Please use the link from your email.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-green-500 bg-green-500/10 p-3 text-sm text-green-200">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-secondary-600 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">{t(lang, 'pleaseWait')}</span>
                </>
              ) : (
                t(lang, 'setPassword')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-secondary-400 hover:text-secondary-300 text-sm font-medium"
            >
              {t(lang, 'backToLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
