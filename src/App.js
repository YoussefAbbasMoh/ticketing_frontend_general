import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import { getStoredLanguage } from './i18n';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import RegisterCompany from './components/auth/RegisterCompany';
import AcceptInvite from './components/auth/AcceptInvite';
import Home from './components/home/Home';
import ProjectDetails from './components/project/ProjectDetails';
import NewTicket from './components/ticket/NewTicket';
import EditTicket from './components/ticket/EditTicket';
import Settings from './components/settings/Settings';
import Chat from './components/chat/Chat';
import AttendancePage from './components/attendance/AttendancePage';
import SubscriptionPage from './components/subscription/SubscriptionPage';

function AppRoutes() {
  const { user } = useAuth();
  const activeCompanyKey = user?.activeCompanyId ? String(user.activeCompanyId) : 'no-company';

  return (
    <Routes key={activeCompanyKey}>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register-company" element={user ? <Navigate to="/" replace /> : <RegisterCompany />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/project/:projectId" element={
        <ProtectedRoute>
          <Layout>
            <ProjectDetails />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/project/:projectId/new-ticket" element={
        <ProtectedRoute>
          <Layout>
            <NewTicket />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/ticket/:ticketId/edit" element={
        <ProtectedRoute>
          <Layout>
            <EditTicket />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute>
          <Layout>
            <Chat />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/attendance" element={
        <ProtectedRoute>
          <Layout>
            <AttendancePage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/subscription" element={
        <ProtectedRoute>
          <Layout>
            <SubscriptionPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    const applyDirection = (nextLang) => {
      const isArabic = String(nextLang || 'ar').toLowerCase().startsWith('ar');
      document.documentElement.setAttribute('lang', isArabic ? 'ar' : 'en');
      document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      document.body.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    };

    applyDirection(lang);

    const onLanguageChanged = () => {
      const next = getStoredLanguage();
      setLang(next);
      applyDirection(next);
    };

    const onStorage = (event) => {
      if (event.key === 'lang' || event.key === 'language') {
        onLanguageChanged();
      }
    };

    window.addEventListener('language-changed', onLanguageChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('language-changed', onLanguageChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [lang]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
