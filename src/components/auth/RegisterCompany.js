import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import Spinner from '../ui/Spinner';

const RegisterCompany = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/absai-logo.png"
              alt="ABSAI Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Company Account</h1>
          <p className="text-gray-400">Set up your workspace and start inviting your team.</p>
        </div>

        <div className="bg-primary-800 rounded-2xl shadow-2xl p-8 border border-primary-700">
          {error && (
            <div className="mb-6 bg-red-500 bg-opacity-10 border border-red-500 rounded-xl p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="e.g. Acme Solutions"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="owner@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-secondary-600 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Creating workspace...</span>
                </>
              ) : (
                'Create Company'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              disabled={loading}
              className="text-secondary-400 hover:text-secondary-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
