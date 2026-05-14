import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, refreshAccessToken } from '../services/api';
import { decodeJwtPayload, getJwtExpiresAtMs, isJwtExpired } from '../utils/jwt';

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

/** Login sends `companyId`; profile/DB may use `company` or populated `{ _id }`. */
const memberCompanyId = (entry) => {
  if (!entry) return '';
  const raw = entry.companyId ?? entry.company;
  if (raw == null) return '';
  if (typeof raw === 'object' && raw._id != null) return String(raw._id);
  return String(raw);
};

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
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

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

    const nextUser = user
      ? {
          ...user,
          activeCompanyId: nextCompanyId,
          ...(Array.isArray(list) ? { companies: list } : {}),
          ...(nextUserName ? { name: nextUserName } : {}),
        }
      : user;
    if (nextUser) {
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
    if (!user?.companies?.length || !activeId) return false;
    const m = user.companies.find((c) => memberCompanyId(c) === activeId);
    if (!m) return false;
    return Boolean(m.isOwner) || ['admin', 'manager'].includes(m.companyRole);
  };

  /**
   * Workspace-level admin UI (owner / company admin|manager, or legacy global `manager` role).
   * Platform console uses `isPlatformAdmin`, not this.
   */
  const isAdmin = () => {
    if (user?.role === 'manager') return true;
    return canManageCompanyTeam();
  };

  /** Platform dashboard at `/admin` — only JWT `role: super_admin`. */
  const isPlatformAdmin = () => user?.role === 'super_admin';

  /** Subscription nav, attendance team summary, etc. */
  const canSeeSubscriptionNav = () => isAdmin();

  const isCompanyOwner = () => {
    const activeId = resolveActiveCompanyId();
    if (!user?.companies?.length || !activeId) return false;
    const m = user.companies.find((c) => memberCompanyId(c) === activeId);
    return Boolean(m?.isOwner) || String(m?.companyRole || '').toLowerCase() === 'owner';
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
