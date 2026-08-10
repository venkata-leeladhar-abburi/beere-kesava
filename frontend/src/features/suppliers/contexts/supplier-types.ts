// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** One saree line inside an external purchase. */
export interface SareeTag {
  id: string;           // auto-generated: SUPPLIER-PREFIX + serial + invoice number
  weight: string;
  date: string;
  sareeType: string;
  color: string;
  price: number;        // cost price, per piece
  sellPercent: number;  // markup %
  /** Pieces bought under this line. Defaults to 1 for older records. */
  quantity?: number;
  finalAmount: number;  // (price + price * sellPercent / 100) * quantity
  notes: string;
  /** Optional photo of the saree, stored as a data URL. */
  imageUrl?: string;
}

export interface Purchase {
  id: string;
  /** Links back to a Supplier.id when the purchase was raised against a registered supplier. */
  supplierId?: string;
  supplier: string;
  location: string;
  date: string;
  sareeCount: number;
  gstNumber: string;
  invoiceNumber: string;
  billAmount: string;
  status: string;       // Paid | Pending | Partial
  notes: string;
  addedBy?: string;
  invoiceFileName?: string;
  sarees: SareeTag[];
}

/** Purchase.status's real values — same 3-state concept as
 *  customers/contexts/sales-types.ts's ExternalPurchaseStatus, kept local
 *  here since Purchase.status is typed loosely as `string`. */
export const PURCHASE_PAYMENT_STATUS = {
  Paid: "Paid",
  Pending: "Pending",
  Partial: "Partial",
} as const;

export interface SupplierPayment {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque";
  reference: string;
  /** Purchase this payment settles, when it maps to a single bill. */
  purchaseId?: string;
  notes?: string;
}

/** Approval lifecycle for an external-purchase request — "pending" isn't in
 *  DocumentStatus (lib/domain/status.ts), so this keeps its own type rather
 *  than force-fitting the 8-state document taxonomy. */
export type PurchaseRequestStatus = "pending" | "approved" | "rejected";
export const PURCHASE_REQUEST_STATUS = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const satisfies Record<string, PurchaseRequestStatus>;

/** An external-purchase request raised by an admin, awaiting superadmin approval. */
export interface PurchaseRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  requestedBy: string;
  requestedDate: string;
  sareeType: string;
  quantity: number;
  estimatedAmount: number;
  urgency: "Normal" | "Urgent";
  reason: string;
  status: PurchaseRequestStatus;
  decidedBy?: string;
  decidedDate?: string;
  decisionNote?: string;

  // ── Full external-purchase payload ──────────────────────────────────────
  // The admin fills in a complete purchase; the superadmin reviews exactly
  // what will be created, and approving turns it into a real purchase.
  /** Supplier city/state as captured on the request. */
  location?: string;
  gstNumber?: string;
  invoiceNumber?: string;
  /** Purchase date the admin entered, as typed. */
  purchaseDate?: string;
  billAmount?: string;
  notes?: string;
  invoiceFileName?: string;
  /** Every saree line on the request, with pricing and quantity. */
  sarees?: SareeTag[];
  /** Purchase created when the request was approved. */
  createdPurchaseId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  initials: string;
  contactName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  state: string;
  address: string;
  gstCode: string;
  /** What this supplier mainly supplies — e.g. "Kanjivaram", "Plain Silk". */
  specialty: string;
  terms: string;
  bankName?: string;
  accountNo?: string;
  notes?: string;
  visitingCard?: string;
  status: SupplierStatus;
  rating: number;
}

/** Supplier account status — like PersonStatus (lib/domain/status.ts) but this
 *  feature's real states add "overdue", so it keeps its own type. */
export type SupplierStatus = "active" | "inactive" | "overdue";
export const SUPPLIER_STATUS = {
  Active: "active",
  Inactive: "inactive",
  Overdue: "overdue",
} as const satisfies Record<string, SupplierStatus>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers shared by the suppliers + external purchases pages
// ─────────────────────────────────────────────────────────────────────────────

export function formatINR(n: number): string {
  return "₹" + Math.max(0, Math.round(n)).toLocaleString("en-IN");
}

/** Parses "₹1,20,000" / "1,20,000" into a number. */
export function parseINR(s: string | undefined | null): number {
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** First 4 letters of the supplier name, used as the saree code prefix. */
export function supplierPrefix(supplier: string): string {
  const letters = (supplier || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters.slice(0, 4) || "SUPP").padEnd(4, "X");
}

export function buildSareeCode(supplier: string, serial: number, invoiceNumber: string): string {
  const inv = (invoiceNumber || "").trim() || "NOINV";
  return `${supplierPrefix(supplier)}-${String(serial).padStart(3, "0")}-${inv}`;
}

/**
 * Code for one physical saree inside a purchase line.
 *
 * A line is bought as N pieces of the same type under one serial number, but
 * every piece is tagged individually, so the piece number is spliced into the
 * line code just before the invoice segment:
 *   line  RAVI-001-INV-RS-2026-118
 *   piece RAVI-001-0001-INV-RS-2026-118
 */
export function buildSareePieceCode(supplier: string, serial: number, pieceNo: number, invoiceNumber: string): string {
  const inv = (invoiceNumber || "").trim() || "NOINV";
  return `${supplierPrefix(supplier)}-${String(serial).padStart(3, "0")}-${String(pieceNo).padStart(4, "0")}-${inv}`;
}

/** Same splice, but starting from an already-built line code. */
export function pieceCodeFromLineCode(lineCode: string, pieceNo: number): string {
  const parts = lineCode.split("-");
  if (parts.length < 3) return `${lineCode}-${String(pieceNo).padStart(4, "0")}`;
  const [prefix, serial, ...invParts] = parts;
  return `${prefix}-${serial}-${String(pieceNo).padStart(4, "0")}-${invParts.join("-")}`;
}

export function computeFinalAmount(price: number, sellPercent: number, quantity = 1): number {
  const qty = quantity > 0 ? quantity : 1;
  return (price + (price * sellPercent) / 100) * qty;
}

/** Total pieces across saree lines — each line may cover more than one piece. */
export function totalPieces(sarees: SareeTag[]): number {
  return sarees.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);
}

/** What the line cost us: buying price per piece × pieces. */
export function lineBuying(s: Pick<SareeTag, "price" | "quantity">): number {
  return (Number(s.price) || 0) * (Number(s.quantity) || 1);
}

/** What the line should sell for — buying plus markup, across all pieces. */
export function lineSelling(s: Pick<SareeTag, "price" | "sellPercent" | "quantity">): number {
  return computeFinalAmount(Number(s.price) || 0, Number(s.sellPercent) || 0, Number(s.quantity) || 1);
}

export function lineProfit(s: Pick<SareeTag, "price" | "sellPercent" | "quantity">): number {
  return lineSelling(s) - lineBuying(s);
}

/** One physical saree, expanded out of a purchase line. */
export interface SareePiece extends SareeTag {
  /** The line's own serial code, e.g. RAVI-001-INV-RS-2026-118. */
  lineCode: string;
  /** 1-based position of this piece within its line. */
  pieceNo: number;
  /** How many pieces the parent line covers. */
  lineQuantity: number;
}

/**
 * Expand purchase lines into individual sarees — one row per physical piece,
 * each with its own code. Money is stated per piece.
 */
export function expandSareePieces<T extends SareeTag>(sarees: T[]): (T & SareePiece)[] {
  return sarees.flatMap(s => {
    const qty = Number(s.quantity) || 1;
    const price = Number(s.price) || 0;
    const sellPercent = Number(s.sellPercent) || 0;
    return Array.from({ length: qty }, (_, i) => ({
      ...s,
      id: pieceCodeFromLineCode(s.id, i + 1),
      lineCode: s.id,
      pieceNo: i + 1,
      lineQuantity: qty,
      quantity: 1,
      price,
      finalAmount: computeFinalAmount(price, sellPercent, 1),
    }));
  });
}

export interface PurchaseTotals {
  pieces: number;
  buying: number;
  selling: number;
  profit: number;
}

/** Roll a set of saree lines up into buying / selling / profit totals. */
export function purchaseTotals(sarees: Pick<SareeTag, "price" | "sellPercent" | "quantity">[]): PurchaseTotals {
  return sarees.reduce<PurchaseTotals>(
    (acc, s) => {
      acc.pieces += Number(s.quantity) || 1;
      acc.buying += lineBuying(s);
      acc.selling += lineSelling(s);
      acc.profit += lineProfit(s);
      return acc;
    },
    { pieces: 0, buying: 0, selling: 0, profit: 0 }
  );
}

export function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "SU";
}
