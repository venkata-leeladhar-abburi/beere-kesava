import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Role = "admin" | "superadmin" | "worker" | "weaver" | "shop" | "accountant";

export interface AuthState {
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
  /**
   * Opens a staff portal as the signed-in admin/superadmin, remembering the
   * role to come back to. This is what writes ADMIN_VIEW_KEY — the flag that
   * `adminViewingAs` and every portal's "Return to Admin" button read.
   *
   * Deliberately NOT impersonation: the session, token and user identity are
   * untouched, so anything recorded while in here is attributed to the admin
   * themselves. Callers must gate this to admin/superadmin.
   */
  enterStaffView: (role: Role) => void;
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
      return JSON.parse(raw) as AuthState;
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

  const enterStaffView = useCallback((target: Role) => {
    setState(prev => {
      // Remember the role being left, not whatever is in storage already —
      // re-entering from a staff portal must not overwrite the original
      // admin role with a staff one and strand the way back.
      if (prev.role === "admin" || prev.role === "superadmin") {
        try { localStorage.setItem(ADMIN_VIEW_KEY, prev.role); } catch { /* ignore */ }
        setAdminViewingAs(prev.role);
      }
      return { ...prev, role: target };
    });
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
    <AuthContext.Provider value={{ ...state, login, selectRole, logout, adminViewingAs, clearAdminView, enterStaffView }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/**
 * Gate for every data query in the app: `enabled: useAuthGate()`.
 *
 * The 15 shared data providers in App.tsx are mounted ABOVE <BrowserRouter>,
 * so they mount on /login too — before RequireRole has run, and with no token
 * in storage. Any query without this gate fires the moment the app boots and
 * comes back 401 AUTH_REQUIRED from the globally-registered JwtAuthGuard,
 * painting error states over the login screen.
 *
 * Requires a token as well as the flag: `isAuthenticated` is restored from
 * localStorage, and the two can disagree for a tick (or permanently, if the
 * token was cleared by handleUnauthorized while the state blob survived).
 * The request needs the token, so the token is what's checked.
 *
 * Pass roles to narrow further — a query hitting a role-scoped endpoint
 * should stay quiet for roles that would only ever get a 403:
 *
 *   enabled: useAuthGate("accountant", "admin", "superadmin")
 */
export function useAuthGate(...allowedRoles: Role[]): boolean {
  const { isAuthenticated, role, token } = useAuth();
  // Read from context, not straight from storage: `token` is set
  // synchronously by login(), while the localStorage write happens in an
  // effect one tick later. A storage-only check would leave every query
  // disabled on the render that signs the user in, with no state change left
  // to re-enable them. Storage is only the fallback for a session restored
  // before `token` was part of the persisted blob.
  const hasToken =
    !!token ||
    (typeof window !== "undefined" &&
      !!(localStorage.getItem("token") || sessionStorage.getItem("token")));

  if (!isAuthenticated || !hasToken) return false;
  if (allowedRoles.length === 0) return true;
  return role !== null && allowedRoles.includes(role);
}
