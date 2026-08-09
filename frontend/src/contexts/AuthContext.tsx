import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Role = "admin" | "superadmin" | "worker" | "weaver" | "shop" | "accountant";

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  phone: string | null;
  token?: string | null;
  user?: {
    id: string;
    weaverId?: string | null;
    empId?: string | null;
    name: string;
    email: string;
    mobile: string;
    role: string;
    accessLevel?: string;
    dateAdded?: string | null;
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

// Exported (in addition to useAuth) so dev-only harnesses that render a
// single component tree outside the real app — e.g. doc-preview.tsx — can
// supply a fake value directly, without needing the real provider's
// localStorage/network wiring.
export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "bk_auth_state";
/** Written by the admin/superadmin dashboards just before entering a staff portal. */
export const ADMIN_VIEW_KEY = "bk_original_admin_role";
/**
 * Written by useCurrentWeaver's admin-viewing-as-weaver fallback to remember
 * which weaver "you" are for the rest of the tab's session. Never cleared by
 * that hook itself — if left behind, a later WEAVER login on the same tab
 * whose token momentarily lacks weaverId (or any other run of that fallback)
 * picks up the *previous* session's weaver instead of resolving fresh. Must
 * be cleared on every login and logout, not just admin-view transitions.
 */
const IMPERSONATE_WEAVER_KEY = "admin_impersonate_weaver_id";

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
    // A fresh login is never a continuation of somebody's admin session,
    // nor of whichever weaver a previous session on this tab resolved to.
    try {
      localStorage.removeItem(ADMIN_VIEW_KEY);
      sessionStorage.removeItem(IMPERSONATE_WEAVER_KEY);
    } catch { /* ignore */ }
    setAdminViewingAs(null);
    const normalizedRole = user?.role ? (user.role.toLowerCase() as Role) : null;
    const effectiveToken = token || "demo-token-" + Date.now();
    setState({ isAuthenticated: true, role: normalizedRole, phone, token: effectiveToken, user: user || null });
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
    try {
      localStorage.removeItem("token");
      localStorage.removeItem(ADMIN_VIEW_KEY);
      sessionStorage.removeItem(IMPERSONATE_WEAVER_KEY);
    } catch { /* ignore */ }
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
