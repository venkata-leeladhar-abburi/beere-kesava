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
import type { EntityType } from "@/lib/domain/status";

export type SareeOrigin = "weaver" | "factoryLoom" | "external";
export type SaleChannel = EntityType;
/** unsold = outstanding stock. returned = was sold retail, customer brought it back.
 *
 * Deliberately not one of lib/domain/status.ts's 6 taxonomies: it fuses
 * "not yet sold" with "sold via channel X" with "returned" into one field.
 * INVENTORY_STATUS has a "returned" key but no "unsold" key, and doesn't
 * track sale channel — splitting this into isSold + SaleChannel + a returned
 * flag would need touching every consumer (SalesContext.tsx, reports,
 * payments/outstanding/*, weavers/WeaverSareesSection/*), most of which are
 * outside this pass's assigned files. Left as a documented custom type. */
export type SareeSaleStatus = "unsold" | "retail" | "wholesale" | "returned";

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
  // PAYMENT_STATUS-shaped ("Paid"→paid, "Pending"→unpaid, "Partial"→partial)
  // but already consumed via direct string comparison and raw-label
  // rendering in payments/components/outstanding/ExternalOutstanding.tsx
  // (`p.status === "Paid"`, `<Pill label={p.status} />`), which is outside
  // this pass's assigned files and — per git status — is being actively
  // edited by another concurrent agent right now. Retyping here without
  // updating that consumer would break it. Left as a documented exception.
  status: "Paid" | "Pending" | "Partial";
  sareeCount: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export interface SalesContextValue {
  sarees: UnifiedSaree[];
  /** Sarees with a SaleRecord against them. `sarees` cannot answer this — the
   *  stock list it is built from drops sold pieces server-side, so anything
   *  needing to know "has this been sold" has no other signal. */
  soldSareeIds: Set<string>;
  purchases: PurchaseSummary[];
  recordSale: (sareeId: string, sale: SaleInfo) => void;
  recordReturn: (sareeId: string, ret: ReturnInfo) => void;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}
