import { apiClient } from "./client";
import type { BackendActorSummary } from "./invoices";

/**
 * The money side of the Accountant Staff Directory.
 *
 * Two endpoints with one query shape. `summary` aggregates in the database
 * and is what every headline figure reads from; `ledger` returns the
 * individual rows behind those figures and is row-capped. Splitting them this
 * way means a capped row list can shorten a table without ever making a total
 * wrong — which is why the period is a server parameter rather than a
 * client-side filter over whatever the cap returned.
 */

/** Weaver/vendor/supplier payments go out; a retail counter sale brings money in. */
export type StaffLedgerKind = "WEAVER" | "VENDOR" | "SUPPLIER" | "RETAIL_SALE";

export interface StaffLedgerRow {
  id: string;
  kind: StaffLedgerKind;
  direction: "OUT" | "IN";
  date: string;
  /** Rupees, already narrowed from the backend's Decimal. */
  amount: number;
  partyName: string | null;
  partyCode: string | null;
  /** UTR for a payment, UPI/card reference for a counter sale. */
  reference: string | null;
  /** Null wherever the source table stores no method — weaver payments never
   *  carry one, so they report null rather than a guess. */
  method: string | null;
  firmName: string | null;
  /** Null for rows recorded before per-user attribution existed. */
  recordedById: string | null;
  recordedBy: BackendActorSummary | null;
}

export interface StaffLedgerResponse {
  items: StaffLedgerRow[];
  /** True when the row cap clipped the list. Totals are unaffected. */
  truncated: boolean;
}

export interface KindTotal {
  amount: number;
  count: number;
}

/** Exact totals for one recorder over the requested period. */
export interface StaffFinanceTotals {
  /** Null identifies the unattributed bucket. */
  recordedById: string | null;
  paidOut: number;
  collectedIn: number;
  txns: number;
  avgTxn: number;
  lastActivity: string | null;
  byKind: Record<StaffLedgerKind, KindTotal>;
}

export interface StaffFinanceSummaryResponse {
  items: StaffFinanceTotals[];
}

export interface StaffFinanceParams {
  /** A user id, or "unattributed" for rows with no recorded actor. */
  recordedById?: string;
  kind?: StaffLedgerKind;
  /** Inclusive period bounds, as instants. */
  from?: string;
  to?: string;
  /** Row cap — ledger only; summary is aggregated and never capped. */
  limit?: number;
}

/** Sentinel id for the rows that predate per-user attribution. */
export const UNATTRIBUTED_ID = "unattributed";

function toQuery(params: StaffFinanceParams, withLimit: boolean): string {
  const query = new URLSearchParams();
  if (withLimit) query.set("limit", String(params.limit ?? 2000));
  if (params.recordedById) query.set("recordedById", params.recordedById);
  if (params.kind) query.set("kind", params.kind);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  return query.toString();
}

export const staffFinanceApi = {
  ledger: (params: StaffFinanceParams = {}) =>
    apiClient.get<StaffLedgerResponse>(`/payments/staff-ledger?${toQuery(params, true)}`),

  summary: (params: StaffFinanceParams = {}) =>
    apiClient.get<StaffFinanceSummaryResponse>(`/payments/staff-summary?${toQuery(params, false)}`),
};
