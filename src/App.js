import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { getStoredLanguage } from './i18n';
import { createAppTheme } from './theme';


import RouteFallback from './components/app/RouteFallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import Layout from './components/layout/Layout';

const Login = lazy(() => import('./components/auth/Login'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const RegisterCompany = lazy(() => import('./components/auth/RegisterCompany'));
const AcceptInvite = lazy(() => import('./components/auth/AcceptInvite'));
const Home = lazy(() => import('./components/home/Home'));
const AddWorkspacePage = lazy(() => import('./components/workspace/AddWorkspacePage'));
const ProjectDetails = lazy(() => import('./components/project/ProjectDetails'));
const NewTicket = lazy(() => import('./components/ticket/NewTicket'));
const EditTicket = lazy(() => import('./components/ticket/EditTicket'));
const Settings = lazy(() => import('./components/settings/Settings'));
const Chat = lazy(() => import('./components/chat/Chat'));
const AttendancePage = lazy(() => import('./components/attendance/AttendancePage'));
const PersonalTasksPage = lazy(() => import('./components/personal-tasks/PersonalTasksPage'));
const SubscriptionPage = lazy(() => import('./components/subscription/SubscriptionPage'));
const SubscriptionCheckoutPage = lazy(() =>
  import('./components/subscription/SubscriptionCheckoutPage')
);
const WorkspaceCalendarPage = lazy(() => import('./components/calendar/WorkspaceCalendarPage'));
const LandingPage = lazy(() =>
  import('./landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LegalPage = lazy(() =>
  import('./landing/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const AdminLogin = lazy(() => import('./components/auth/AdminLogin'));
const PlatformAdminRoute = lazy(() => import('./components/admin/platform/PlatformAdminRoute'));
const AdminLayout = lazy(() => import('./components/admin/platform/AdminLayout'));
const AdminOverviewPage = lazy(() => import('./components/admin/platform/AdminOverviewPage'));
const AdminCompaniesPage = lazy(() => import('./components/admin/platform/AdminCompaniesPage'));
const AdminUsersPage = lazy(() => import('./components/admin/platform/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./components/admin/platform/AdminUserDetailPage'));
const AdminSubscriptionsPage = lazy(() => import('./components/admin/platform/AdminSubscriptionsPage'));
const AdminPlansPage = lazy(() => import('./components/admin/platform/AdminPlansPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function SubscriptionRouteGate() {
  const { canSeeSubscriptionNav } = useAuth();
  if (!canSeeSubscriptionNav()) {
    return <Navigate to="/" replace />;
  }
  return <SubscriptionPage />;
}

function SubscriptionCheckoutRouteGate() {
  const { canSeeSubscriptionNav } = useAuth();
  if (!canSeeSubscriptionNav()) {
    return <Navigate to="/" replace />;
  }
  return <SubscriptionCheckoutPage />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const activeCompanyKey = user?.activeCompanyId ? String(user.activeCompanyId) : 'no-company';

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes key={activeCompanyKey}>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/register-company"
        element={
          loading ? (
            <RouteFallback />
          ) : user ? (
            <Navigate to="/workspaces/new" replace />
          ) : (
            <RegisterCompany />
          )
        }
      />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/workspaces/new"
        element={
          user ? (
            <ProtectedRoute>
              <Layout>
                <AddWorkspacePage />
              </Layout>
            </ProtectedRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
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
      <Route path="/privacy-policy" element={<LegalPage />} />
      <Route path="/terms-of-service" element={<LegalPage />} />
      <Route path="/cookie-policy" element={<LegalPage />} />

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

      <Route path="/personal-tasks" element={
        <ProtectedRoute>
          <Layout>
            <PersonalTasksPage />
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
            <SubscriptionRouteGate />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/subscription/checkout" element={
        <ProtectedRoute>
          <Layout>
            <SubscriptionCheckoutRouteGate />
          </Layout>
        </ProtectedRoute>
      } />

      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <PlatformAdminRoute>
              <AdminLayout />
            </PlatformAdminRoute>
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="companies" element={<AdminCompaniesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  const [lang, setLang] = useState(getStoredLanguage());
  const isArabic = String(lang || 'en').toLowerCase().startsWith('ar');
  const theme = useMemo(() => createAppTheme(isArabic ? 'rtl' : 'ltr'), [isArabic]);

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
        <ScrollToTop />
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
