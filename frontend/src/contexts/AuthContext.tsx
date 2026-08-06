import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Role = "admin" | "superadmin" | "worker" | "weaver" | "shop" | "accountant";

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  phone: string | null;
  token?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
  } | null;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, token?: string, user?: AuthState["user"]) => void;
  selectRole: (role: Role | null) => void;
  logout: () => void;
  /**
   * The admin/superadmin role a user *came from* when they opened a staff
   * portal from their own dashboard. Null for a genuine staff login.
   * Portals use this to decide what an owner may see that staff may not.
   */
  adminViewingAs: Role | null;
  /** Drops the admin-viewing flag — used when a role is chosen fresh. */
  clearAdminView: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "bk_auth_state";
/** Written by the admin/superadmin dashboards just before entering a staff portal. */
export const ADMIN_VIEW_KEY = "bk_original_admin_role";

function readAdminView(): Role | null {
  try {
    const v = localStorage.getItem(ADMIN_VIEW_KEY);
    return v === "admin" || v === "superadmin" ? v : null;
  } catch {
    return null;
  }
}

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthState;
      return parsed;
    }
  } catch {
    // ignore
  }
  return { isAuthenticated: false, role: null, phone: null, token: null, user: null };
}

function saveState(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.token) {
      localStorage.setItem("token", state.token);
    } else {
      localStorage.removeItem("token");
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);
  const [adminViewingAs, setAdminViewingAs] = useState<Role | null>(readAdminView);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const clearAdminView = useCallback(() => {
    try { localStorage.removeItem(ADMIN_VIEW_KEY); } catch { /* ignore */ }
    setAdminViewingAs(null);
  }, []);

  const login = useCallback((phone: string, token?: string, user?: AuthState["user"]) => {
    // A fresh login is never a continuation of somebody's admin session.
    try { localStorage.removeItem(ADMIN_VIEW_KEY); } catch { /* ignore */ }
    setAdminViewingAs(null);
    const normalizedRole = user?.role ? (user.role.toLowerCase() as Role) : null;
    setState({ isAuthenticated: true, role: normalizedRole, phone, token: token || null, user: user || null });
  }, []);

  // Entering or leaving a staff portal always writes the flag and then calls
  // selectRole, so re-reading here keeps the state in step with the dashboards.
  const selectRole = useCallback((role: Role | null) => {
    setState(prev => ({ ...prev, role }));
    setAdminViewingAs(readAdminView());
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, role: null, phone: null });
    localStorage.removeItem(STORAGE_KEY);
    try { localStorage.removeItem(ADMIN_VIEW_KEY); } catch { /* ignore */ }
    setAdminViewingAs(null);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, selectRole, logout, adminViewingAs, clearAdminView }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
