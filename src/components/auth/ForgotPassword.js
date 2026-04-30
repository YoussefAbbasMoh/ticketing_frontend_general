import React, { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import { getStoredLanguage, t } from '../../i18n';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t(lang, 'resetPassword')}</h1>
          <p className="text-gray-400">
            {step === 0 ? t(lang, 'resetPasswordSubtitleEmail') : t(lang, 'resetPasswordSubtitleOtp')}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((s, index) => (
              <React.Fragment key={s.number}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    step >= index 
                      ? 'bg-secondary-500 text-white shadow-lg' 
                      : 'bg-primary-700 text-gray-400 border-2 border-primary-600'
                  }`}>
                    {step > index ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${step >= index ? 'text-white' : 'text-gray-500'}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{s.description}</div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 mb-12 rounded transition-all ${
                    step > index ? 'bg-secondary-500' : 'bg-primary-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
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

          {success && (
            <div className="mb-6 animate-fade-in">
              <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-400 hover:text-green-300 transition-colors flex-shrink-0"
                  aria-label="Close success message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={step === 0 ? handleSendOTP : handleVerifyOTP} className="space-y-6">
            {step === 0 ? (
              /* Step 1: Email Input */
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
                  className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all"
                  placeholder="Enter your registered email"
                />
                <p className="mt-2 text-sm text-gray-400">
                  We'll send a one-time password to this email address.
                </p>
              </div>
            ) : (
              /* Step 2: OTP and Password Inputs */
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Enter the 6-digit code sent to {formData.email}
                  </p>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all"
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all"
                    placeholder="Confirm your new password"
                  />
                </div>
              </>
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
                  <span className="ml-2">{t(lang, 'processing')}</span>
                </>
              ) : (
                step === 0 ? t(lang, 'sendOtp') : t(lang, 'resetPassword')
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-secondary-400 hover:text-secondary-300 text-sm font-medium transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t(lang, 'backToLogin')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>{t(lang, 'needHelpContactAdmin')}</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
