import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import { getStoredLanguage, t } from '../../i18n';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/absai-logo.png" 
              alt="ABSAI Logo" 
              className="w-24 h-24 object-contain"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div 
              className="hidden items-center justify-center w-16 h-16 bg-secondary-500 rounded-2xl shadow-xl"
              style={{ display: 'none' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t(lang, 'welcomeBack')}</h1>
          <p className="text-gray-400">{t(lang, 'signInSubtitle')}</p>
        </div>  

        {/* Login Card */}
        <div className="bg-primary-800 rounded-2xl shadow-2xl p-8 border border-primary-700">
          {error && (
            <div className="mb-6 animate-fade-in">
              <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                  aria-label="Close error"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t(lang, 'emailAddress')}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t(lang, 'password')}
              />
            </div>

            {companyChoices && companyChoices.length > 0 && (
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-300 mb-2">
                  {t(lang, 'company')}
                </label>
                <select
                  id="companyId"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent disabled:opacity-50"
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
                <p className="mt-2 text-xs text-gray-400">
                  نفس البريد مسجّل في أكثر من شركة — اختر أين تريد العمل ثم اضغط «Sign In» مرة أخرى.
                  <br />
                  This email belongs to multiple companies — pick a workspace, then press Sign In again.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-secondary-600 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">{t(lang, 'signingIn')}</span>
                </>
              ) : (
                t(lang, 'signIn')
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
              className="text-secondary-400 hover:text-secondary-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t(lang, 'forgotPassword')}
            </button>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate('/register-company')}
                disabled={loading}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t(lang, 'newCompanyCreateWorkspace')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm ">
          <p>© 2025 Ticket Management System. All rights reserved for ABS..</p>
        </div>
      </div>

      {companyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-primary-600 bg-primary-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">{t(lang, 'chooseWorkspace')}</h2>
            <p className="mt-1 text-sm text-gray-400">
              {t(lang, 'multiCompanySelect')}
            </p>

            <div className="mt-4 space-y-2 max-h-64 overflow-auto pr-1">
              {(companyChoices || []).map((c) => {
                const id = c?.companyId != null ? String(c.companyId) : '';
                const roleLabel = c?.isOwner ? 'Owner' : (c?.companyRole || 'member');
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCompanyId(id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedCompanyId === id
                        ? 'border-secondary-500 bg-secondary-500/20'
                        : 'border-primary-600 bg-primary-700 hover:border-primary-500'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">
                      {(c?.company && c.company.name) || 'Company'}
                    </div>
                    <div className="text-xs text-gray-300">Role: {String(roleLabel)}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-primary-600 bg-primary-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{t(lang, 'needNewCompany')}</p>
                  <p className="text-xs text-gray-400">
                    {t(lang, 'openRegistrationHelp')}
                  </p>
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
                  className="h-9 w-9 rounded-full bg-secondary-500 text-white hover:bg-secondary-600"
                  title="Go to register company page"
                >
                  +
                </button>
              </div>
            </div>

            {companyActionError && (
              <p className="mt-3 text-sm text-red-300">{companyActionError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompanyModalOpen(false);
                  setCompanyActionError('');
                  setPendingLoginData(null);
                }}
                className="rounded-lg border border-primary-500 px-4 py-2 text-sm text-gray-200 hover:bg-primary-700"
                disabled={companyActionLoading}
              >
                {t(lang, 'back')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompanyChoice}
                disabled={!selectedCompanyId || companyActionLoading}
                className="rounded-lg bg-secondary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-600 disabled:opacity-50"
              >
                {companyActionLoading ? t(lang, 'pleaseWait') : t(lang, 'continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;