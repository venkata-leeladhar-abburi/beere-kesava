import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../contexts/AuthContext";
import { RatesProvider } from "../features/pricing/contexts/RatesContext";

/**
 * Fake AuthContext value for tests — contexts under test (e.g. the various
 * src/features/*\/contexts providers) call useAuth() for the current actor,
 * but tests don't need real login/localStorage wiring, just a non-null
 * context so useAuth() doesn't throw. See AuthContext.tsx's exported
 * AuthContext for why this direct Provider usage (bypassing AuthProvider)
 * is supported.
 */
const TEST_AUTH_VALUE = {
  isAuthenticated: true,
  role: "admin" as const,
  phone: "9999999999",
  token: "test-token",
  user: {
    id: "test-user",
    name: "Test User",
    email: "test@example.com",
    mobile: "9999999999",
    role: "ADMIN",
  },
  login: () => {},
  selectRole: () => {},
  logout: () => {},
  adminViewingAs: null,
  clearAdminView: () => {}, enterStaffView: () => {},
};

/** Fresh QueryClient per test so cache state never leaks between tests. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders with a QueryClientProvider wrapper — use for any component or hook
 * that reads a TanStack Query-backed context (all the domain contexts in
 * src/features/*\/contexts).
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  const queryClient = createTestQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={TEST_AUTH_VALUE}>
          {/* Real RatesProvider — it fetches via its own axios call and catches
              failures into isError rather than throwing, so it's safe to mount
              unmocked; consumers (e.g. BulkOrderContext) just need a non-null
              context, not real rate data. */}
          <RatesProvider>{ui}</RatesProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
      options,
    ),
  };
}
