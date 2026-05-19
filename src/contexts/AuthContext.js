import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, refreshAccessToken, userAPI } from '../services/api';
import { decodeJwtPayload, getJwtExpiresAtMs, isJwtExpired } from '../utils/jwt';
import {
  patchUserCompanyMembership,
  resolveCompanyMemberRole,
} from '../utils/companyMembership';
import { registerFcmWithBackend, unregisterFcmFromBackend } from '../services/fcmClient';

const AuthContext = createContext();

const readTokenCompanyId = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.companyId ? String(payload.companyId) : null;
};

/** Restore session on first paint so protected routes and auth gates never flash the wrong UI. */
function readInitialAuth() {
  if (typeof localStorage === 'undefined') {
    return { user: null, loading: false };
  }
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (token && isJwtExpired(token, 0)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { user: null, loading: false };
  }

  if (token && userData) {
    try {
      let parsed = JSON.parse(userData);
      const fromToken = readTokenCompanyId(token);
      if (fromToken && !parsed.activeCompanyId) {
        parsed = { ...parsed, activeCompanyId: fromToken };
      }
      return { user: parsed, loading: false };
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return { user: null, loading: false };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const initialAuth = useMemo(() => readInitialAuth(), []);
  const [user, setUser] = useState(initialAuth.user);
  const loading = initialAuth.loading;

  const logout = useCallback(() => {
    unregisterFcmFromBackend().catch(() => {});
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  /** Refresh workspace membership from server (role changes, invites, etc.). */
  useEffect(() => {
    const uid = user?._id || user?.id;
    if (!uid) return undefined;

    let cancelled = false;
    userAPI
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.user?.companies;
        if (!Array.isArray(list) || !list.length) return;
        const activeId =
          res?.data?.activeCompanyId || user?.activeCompanyId || readTokenCompanyId(localStorage.getItem('token'));
        const role =
          res?.data?.companyMemberRole ||
          resolveCompanyMemberRole({ ...user, companies: list }, activeId);
        const next = patchUserCompanyMembership({ ...user, companies: list }, activeId, role);
        setUser(next);
        localStorage.setItem('user', JSON.stringify(next));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  /** Register device for Firebase push when session is restored. */
  useEffect(() => {
    if (!user) return undefined;
    registerFcmWithBackend().catch(() => {});
    return undefined;
  }, [user?._id, user?.id]);

  /** Proactive refresh before short-lived JWTs expire (requires `POST /auth/refresh` on backend). */
  useEffect(() => {
    if (!user) return undefined;

    const tick = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      if (isJwtExpired(token)) {
        logout();
        if (!window.location.pathname.toLowerCase().includes('login')) {
          window.location.href = '/login';
        }
        return;
      }
      const expMs = getJwtExpiresAtMs(token);
      if (expMs == null) return;
      const msLeft = expMs - Date.now();
      if (msLeft > 0 && msLeft < 4 * 60 * 1000) {
        await refreshAccessToken();
      }
    };

    const id = setInterval(tick, 90_000);
    tick();
    return () => clearInterval(id);
  }, [user, logout]);

  const login = (userData, token) => {
    const fromToken = readTokenCompanyId(token);
    const merged =
      fromToken && !userData.activeCompanyId
        ? { ...userData, activeCompanyId: fromToken }
        : userData;
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
    localStorage.setItem('token', token);
    registerFcmWithBackend().catch(() => {});
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const switchActiveCompany = async (companyId) => {
    if (!companyId) {
      throw new Error('companyId is required');
    }

    const response = await authAPI.switchCompany(companyId);
    const nextToken = response?.data?.token;
    const nextCompanyId = response?.data?.activeCompanyId
      ? String(response.data.activeCompanyId)
      : String(companyId);

    if (!nextToken) {
      throw new Error('No token returned from switch-company');
    }

    const list = response?.data?.companies;
    const nextUserName =
      typeof response?.data?.userName === 'string' && response.data.userName.trim()
        ? response.data.userName.trim()
        : null;

    let nextUser = user
      ? {
          ...user,
          activeCompanyId: nextCompanyId,
          ...(Array.isArray(list) ? { companies: list } : {}),
          ...(nextUserName ? { name: nextUserName } : {}),
        }
      : user;
    if (nextUser) {
      const role = resolveCompanyMemberRole(nextUser, nextCompanyId);
      nextUser = patchUserCompanyMembership(nextUser, nextCompanyId, role);
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
    }
    localStorage.setItem('token', nextToken);

    return response;
  };

  const resolveActiveCompanyId = () => {
    if (user?.activeCompanyId) return String(user.activeCompanyId);
    return readTokenCompanyId(
      typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    );
  };

  /** Owner or company admin/manager for the active company (JWT companyId). */
  const canManageCompanyTeam = () => {
    const activeId = resolveActiveCompanyId();
    if (!user || !activeId) return false;
    const role = resolveCompanyMemberRole(user, activeId);
    return role === 'owner' || ['admin', 'manager'].includes(role);
  };

  /** Workspace-level admin UI (owner / company admin|manager). Platform console uses `isPlatformAdmin`. */
  const isAdmin = () => canManageCompanyTeam();

  /** Platform dashboard at `/admin` — only JWT `role: super_admin`. */
  const isPlatformAdmin = () => user?.role === 'super_admin';

  /** Subscription nav, attendance team summary, etc. */
  const canSeeSubscriptionNav = () => isAdmin();

  const isCompanyOwner = () => {
    const activeId = resolveActiveCompanyId();
    if (!user || !activeId) return false;
    return resolveCompanyMemberRole(user, activeId) === 'owner';
  };

  /** Same rules as API: owner or company admin/manager in the active workspace. */
  const canInviteUsersToCompany = () => canManageCompanyTeam();

  const value = {
    user,
    login,
    logout,
    updateUser,
    switchActiveCompany,
    isAdmin,
    isPlatformAdmin,
    canManageCompanyTeam,
    canSeeSubscriptionNav,
    isCompanyOwner,
    canInviteUsersToCompany,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
