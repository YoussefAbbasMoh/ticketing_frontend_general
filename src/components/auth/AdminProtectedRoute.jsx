import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WorkspaceShellSkeleton } from '../ui/LoadingSkeletons';

/** Like ProtectedRoute but sends guests to `/admin/login` (isolated admin console). */
export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <WorkspaceShellSkeleton compact />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
