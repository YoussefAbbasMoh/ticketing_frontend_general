import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Spinner from '../../ui/Spinner';

export default function PlatformAdminRoute({ children }) {
  const { user, loading, isPlatformAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-background font-cairo">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !isPlatformAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
