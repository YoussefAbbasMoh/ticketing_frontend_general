import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { getStoredLanguage } from './i18n';
import theme from './theme';

import RouteFallback from './components/app/RouteFallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

const Login = lazy(() => import('./components/auth/Login'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const RegisterCompany = lazy(() => import('./components/auth/RegisterCompany'));
const AcceptInvite = lazy(() => import('./components/auth/AcceptInvite'));
const Home = lazy(() => import('./components/home/Home'));
const ProjectDetails = lazy(() => import('./components/project/ProjectDetails'));
const NewTicket = lazy(() => import('./components/ticket/NewTicket'));
const EditTicket = lazy(() => import('./components/ticket/EditTicket'));
const Settings = lazy(() => import('./components/settings/Settings'));
const Chat = lazy(() => import('./components/chat/Chat'));
const AttendancePage = lazy(() => import('./components/attendance/AttendancePage'));
const SubscriptionPage = lazy(() => import('./components/subscription/SubscriptionPage'));
const WorkspaceCalendarPage = lazy(() => import('./components/calendar/WorkspaceCalendarPage'));
const LandingPage = lazy(() =>
  import('./landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);

function AppRoutes() {
  const { user } = useAuth();
  const activeCompanyKey = user?.activeCompanyId ? String(user.activeCompanyId) : 'no-company';

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes key={activeCompanyKey}>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register-company" element={user ? <Navigate to="/" replace /> : <RegisterCompany />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      <Route
        path="/"
        element={
          user ? (
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )
        }
      />

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

      <Route path="/workspace-calendar" element={
        <ProtectedRoute>
          <Layout>
            <WorkspaceCalendarPage />
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
    </Suspense>
  );
}

function App() {
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    const applyDirection = (nextLang) => {
      const isArabic = String(nextLang || 'en').toLowerCase().startsWith('ar');
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
      <Router>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <ChatProvider>
                <AppRoutes />
              </ChatProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
