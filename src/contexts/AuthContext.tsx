import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Role = "admin" | "superadmin" | "worker" | "weaver" | "shop";

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  phone: string | null;
}

interface AuthContextValue extends AuthState {
  login: (phone: string) => void;
  selectRole: (role: Role | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "bk_auth_state";

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
  return { isAuthenticated: false, role: null, phone: null };
}

function saveState(state: AuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const login = useCallback((phone: string) => {
    setState({ isAuthenticated: true, role: null, phone });
  }, []);

  const selectRole = useCallback((role: Role | null) => {
    setState(prev => ({ ...prev, role }));
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, role: null, phone: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
