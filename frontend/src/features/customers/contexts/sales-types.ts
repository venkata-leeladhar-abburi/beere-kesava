/**
 * SalesContext — the single place that links every saree back to WHERE IT CAME FROM
 * (weaver / factory loom / external supplier) and WHAT HAPPENED TO IT
 * (still in stock, sold retail, sold wholesale, or returned by the customer).
 *
 * Field names are kept identical to the pages they mirror so the reports read the
 * same as the source screens:
 *   - weaver fields      → BatchContext.SareeRow  (weaverId / weaverName / weaverLoom)
 *   - factory loom fields→ FactoryLoomPage.FactoryLoom (loomNumber / operatorName / location)
 *   - external fields    → ExternalPurchasesPage.Purchase + SareeTag
 *                          (supplier / invoiceNumber / billAmount / price / sellPercent / finalAmount)
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type SareeOrigin = "weaver" | "factoryLoom" | "external";
export type SaleChannel = "retail" | "wholesale";
/** unsold = outstanding stock. returned = was sold retail, customer brought it back. */
export type SareeSaleStatus = "unsold" | "retail" | "wholesale" | "returned";
/** Typed constants for `SareeSaleStatus` values — reference these instead of
 *  bare string literals so call sites stay type-checked (design-system/06-DOMAIN.md Part D). */
export const SALE_STATUS = {
  Unsold: "unsold",
  Retail: "retail",
  Wholesale: "wholesale",
  Returned: "returned",
} as const satisfies Record<string, SareeSaleStatus>;

export interface SaleInfo {
  saleRef: string;
  channel: SaleChannel;
  date: string;          // "12 Jun 2026"
  customer: string;
  amount: number;        // ₹ realised
}

export interface ReturnInfo {
  returnRef: string;
  date: string;
  reason: string;
  refundAmount: number;
  /** true once the saree has been put back into saleable stock */
  restocked: boolean;
}

export interface UnifiedSaree {
  sareeId: string;
  origin: SareeOrigin;

  // ── weaver origin (mirrors BatchContext.SareeRow) ──
  weaverId?: string | null;
  weaverName?: string | null;
  weaverLoom?: number | null;

  // ── factory loom origin (mirrors FactoryLoomPage.FactoryLoom) ──
  factoryLoomId?: string | null;
  factoryLoomNumber?: string | null;
  operatorName?: string | null;
  loomLocation?: string | null;

  // ── external origin (mirrors ExternalPurchasesPage.Purchase) ──
  purchaseId?: string | null;
  supplier?: string | null;
  supplierLocation?: string | null;
  invoiceNumber?: string | null;
  purchaseDate?: string | null;

  // ── common saree fields ──
  batchId: string | null;
  designCode: string;
  sareeTypeCode: string;
  sareeTypeName: string;
  weight: string;
  qcDate: string;          // for external = received / tagged date

  costPrice: number;       // external: SareeTag.price · in-house: material + making cost
  sellPercent: number;     // external: SareeTag.sellPercent
  finalAmount: number;     // expected selling price

  status: SareeSaleStatus;
  sale: SaleInfo | null;
  ret: ReturnInfo | null;
  /** days the saree has been sitting unsold (for ageing buckets) */
  ageDays: number;
}

export interface PurchaseSummary {
  id: string;
  supplier: string;
  location: string;
  date: string;
  invoiceNumber: string;
  gstNumber: string;
  billAmount: number;
  paidAmount: number;
  status: ExternalPurchaseStatus;
  sareeCount: number;
}

/** External-purchase payment status — a 3-state variant distinct from the
 *  richer 8-state `PaymentStatus` taxonomy (lib/domain/status.ts); the exact
 *  values here are what this codebase's purchase records actually use. */
export type ExternalPurchaseStatus = "Paid" | "Pending" | "Partial";
export const PURCHASE_STATUS = {
  Paid: "Paid",
  Pending: "Pending",
  Partial: "Partial",
} as const satisfies Record<string, ExternalPurchaseStatus>;

// ─── Context ──────────────────────────────────────────────────────────────────
export interface SalesContextValue {
  sarees: UnifiedSaree[];
  purchases: PurchaseSummary[];
  recordSale: (sareeId: string, sale: SaleInfo) => void;
  recordReturn: (sareeId: string, ret: ReturnInfo) => void;
  isError: boolean;
  error: unknown;
}
