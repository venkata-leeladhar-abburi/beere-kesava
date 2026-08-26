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
}

// Exported (in addition to useAuth) so dev-only harnesses that render a
// single component tree outside the real app — e.g. doc-preview.tsx — can
// supply a fake value directly, without needing the real provider's
// localStorage/network wiring.
export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "bk_auth_state";
/**
 * Timestamp (ms) of the last recorded user activity, refreshed on
 * mount/interaction while the tab is visible. Used to distinguish "reopened
 * the app a few seconds later — resume where I was" from "came back after 5+
 * idle minutes — treat the stored session as stale and require login again",
 * per product decision: a stale `isAuthenticated: true` in localStorage
 * shouldn't let a navigation land straight on an authenticated page after a
 * real gap away.
 */
const LAST_ACTIVITY_KEY = "bk_last_activity";
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

function touchActivity() {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); } catch { /* ignore */ }
}

function isSessionStale(): boolean {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return false; // no recorded activity yet (e.g. first-ever login) — don't punish that
    return Date.now() - Number(raw) > IDLE_TIMEOUT_MS;
  } catch {
    return false;
  }
}
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
      // A session that's been idle for 5+ minutes doesn't get to resume just
      // because the browser still has it in storage — this is what makes
      // "opened this link again after a while" bounce to /login instead of
      // landing straight on whatever page was linked.
      if (parsed.isAuthenticated && isSessionStale()) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem("token");
        } catch { /* ignore */ }
        return { isAuthenticated: false, role: null, phone: null, token: null, user: null };
      }
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

  // Idle-timeout: keep the activity clock moving while the user is actually
  // doing something, and check it periodically + whenever the tab regains
  // focus/visibility (the common "switched away, came back later" case a
  // page-load-only check would miss since this is a long-lived SPA session,
  // not a fresh mount per navigation).
  useEffect(() => {
    if (!state.isAuthenticated) return;

    touchActivity();
    const onActivity = () => touchActivity();
    const events: (keyof DocumentEventMap)[] = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }));

    const checkIdle = () => {
      if (isSessionStale()) logout();
    };
    const onVisibility = () => { if (document.visibilityState === "visible") checkIdle(); };
    document.addEventListener("visibilitychange", onVisibility);
    const interval = setInterval(checkIdle, 30_000);

    return () => {
      events.forEach(e => document.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- logout is stable (useCallback, no deps)
  }, [state.isAuthenticated]);

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
