/**
 * <DataAccessProvider> — design-system/06-DOMAIN.md Part E.5.
 * ═══════════════════════════════════════════════════════════════════════════
 * Generalises the existing `MoneyAccessProvider` (shared/ui/MoneyAccess.tsx —
 * "the right architecture", per the Phase 6 audit) from a single boolean
 * into 5 named scopes, so a page can hide cost price from shop staff while
 * still showing sell price, without needing 5 separate boolean contexts.
 *
 * `MoneyAccessProvider` itself is left untouched — existing call sites keep
 * working unchanged. `<Money gate="cost">` prefers `DataAccessProvider` when
 * one is mounted and falls back to the legacy `useCanSeeMoney()` otherwise,
 * so a page that only ever mounted `MoneyAccessProvider` doesn't need to be
 * touched to keep gating correctly.
 */
import * as React from "react";
import { useCanSeeMoney } from "../MoneyAccess";
import { useMoneyVisible } from "../MoneyValue";

/** Scope → what it covers (Part E.5's table). */
export type DataAccessScope = "cost" | "sell" | "margin" | "payroll" | "customer-pii";

export type DataAccessScopes = Partial<Record<DataAccessScope, boolean>>;

const DataAccessContext = React.createContext<DataAccessScopes | null>(null);

export interface DataAccessProviderProps {
  /** Unlisted scopes default to `true` — mounting this provider is opt-in
   *  per scope, not an all-or-nothing switch. */
  scopes: DataAccessScopes;
  children: React.ReactNode;
}

export function DataAccessProvider({ scopes, children }: DataAccessProviderProps) {
  // Merge onto whatever a parent provider already declared instead of
  // replacing it outright — otherwise a narrowly-scoped provider nested
  // inside a restrictive one (e.g. a shared page reused inside the shop
  // portal) would silently reset every scope it doesn't mention back to the
  // "unlisted defaults to true" fallback, un-gating the whole subtree.
  const parentScopes = React.useContext(DataAccessContext);
  const merged = parentScopes ? { ...parentScopes, ...scopes } : scopes;
  return <DataAccessContext.Provider value={merged}>{children}</DataAccessContext.Provider>;
}

/** True when the current portal/role may see values in `scope`. Falls back
 *  to the legacy `MoneyAccessProvider` boolean when no `DataAccessProvider`
 *  is mounted above this component, so pages that haven't adopted the new
 *  provider yet still gate correctly. Always ANDed with the account-level
 *  `MONEY_HIDDEN` flag (see MoneyValue.tsx) — of the three independent
 *  money-visibility mechanisms in this app, that one is a per-account
 *  setting rather than a per-portal one, so no scope/provider state should
 *  ever be able to override it back on. */
export function useDataAccess(scope: DataAccessScope): boolean {
  const scopes = React.useContext(DataAccessContext);
  const legacyCanSeeMoney = useCanSeeMoney();
  const moneyVisible = useMoneyVisible();
  if (!moneyVisible) return false;
  if (scopes === null) return legacyCanSeeMoney;
  return scopes[scope] ?? true;
}

/** Renders its children only where `scope` is visible. */
export function DataGate({ scope, children }: { scope: DataAccessScope; children: React.ReactNode }) {
  return useDataAccess(scope) ? <>{children}</> : null;
}
