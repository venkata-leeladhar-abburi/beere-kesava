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
  return <DataAccessContext.Provider value={scopes}>{children}</DataAccessContext.Provider>;
}

/** True when the current portal/role may see values in `scope`. Falls back
 *  to the legacy `MoneyAccessProvider` boolean when no `DataAccessProvider`
 *  is mounted above this component, so pages that haven't adopted the new
 *  provider yet still gate correctly. */
export function useDataAccess(scope: DataAccessScope): boolean {
  const scopes = React.useContext(DataAccessContext);
  const legacyCanSeeMoney = useCanSeeMoney();
  if (scopes === null) return legacyCanSeeMoney;
  return scopes[scope] ?? true;
}

/** Renders its children only where `scope` is visible. */
export function DataGate({ scope, children }: { scope: DataAccessScope; children: React.ReactNode }) {
  return useDataAccess(scope) ? <>{children}</> : null;
}
