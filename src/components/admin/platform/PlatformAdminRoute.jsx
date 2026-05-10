import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { WorkspaceShellSkeleton } from '../../ui/LoadingSkeletons';

export default function PlatformAdminRoute({ children }) {
  const { user, loading, isPlatformAdmin } = useAuth();

  if (loading) {
    return <WorkspaceShellSkeleton compact />;
  }

  if (!user || !isPlatformAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
