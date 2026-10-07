import type { DocumentStatus } from "../../../lib/domain/status";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** One saree line inside an external purchase. */
export interface SareeTag {
  id: string; // auto-generated: SUPPLIER-PREFIX + serial + invoice number
  /** Real PurchaseSareeLine.id (UUID) — the FK a SupplierReturnRequest is created against. */
  lineId?: string;
  weight: string;
  date: string;
  sareeType: string;
  color: string;
  price: number; // cost price, per piece
  sellPercent: number; // markup %
  /** Pieces bought under this line. Defaults to 1 for older records. */
  quantity?: number;
  finalAmount: number; // (price + price * sellPercent / 100) * quantity
  notes: string;
  /** Optional photo of the saree, stored as a data URL. */
  imageUrl?: string;
  /** Optional per-physical-piece photo, indexed by piece position
   * (pieceImageUrls[0] is piece 1 of `quantity`). Independent of the line's
   * own `imageUrl` — a piece with nothing here shows no photo rather than
   * borrowing the serial's, since each physical saree is photographed
   * separately. */
  pieceImageUrls?: string[];
  /** How many of this line's `quantity` pieces have been returned to the supplier. */
  returnedQuantity?: number;
  /** Which of them (1-based positions), when known — see returnedPieceSet. */
  returnedPieceNos?: number[];
}

/** How a purchase discount was entered: a % of the subtotal or a flat ₹ amount. */
export type DiscountType = "percent" | "amount";

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
  /** What we owe the supplier — subtotal − discount + GST (see computePurchaseBill). */
  billAmount: string;
  /** Sarees' buying total before discount/GST. Undefined on older purchases
   *  whose bill was typed in by hand. */
  subtotal?: number;
  discountType?: DiscountType;
  /** The discount as entered — 5 for 5%, or 1700 for ₹1,700. */
  discountValue?: number;
  /** Rupees taken off the subtotal. */
  discountAmount?: number;
  gstPercent?: number;
  /** Rupees of GST added on (subtotal − discount). */
  gstAmount?: number;
  /** Paid | Pending | Partial — follows the payments linked to the purchase,
   *  never chosen on the purchase form. */
  status: string;
  notes: string;
  addedBy?: string;
  invoiceFileName?: string;
  /** Uploaded invoice file/photo, resolvable via shared/api/uploads resolveAssetUrl. */
  invoiceFileUrl?: string;
  sarees: SareeTag[];
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque";
  reference: string;
  /** Purchase this payment settles, when it maps to a single bill. */
  purchaseId?: string;
  /** Firm.id of our firm the payment was made from. */
  firmId?: string;
  notes?: string;
  /** Accountant / Admin who recorded this payment; undefined if unattributed. */
  recordedBy?: { firstName: string; lastName: string; role: string } | null;
}

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
  status: DocumentStatus;
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
  code?: string;
  name: string;
  initials: string;
  /** Admin-entered short label printed on an external-purchase saree tag in
   *  place of the full name (e.g. "RAVI" for "Ravi Silks & Sons"). */
  shortName?: string;
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
  ifscCode?: string;
  notes?: string;
  visitingCard?: string;
  status: "active" | "inactive" | "overdue";
  rating: number;
  /** Firm.id this supplier is connected to — undefined when not connected. */
  firmId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers shared by the suppliers + external purchases pages
// ─────────────────────────────────────────────────────────────────────────────

/** Parses "₹1,20,000" / "1,20,000" into a number. */
export function parseINR(s: string | undefined | null): number {
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * Saree code prefix for a supplier: its full short name (the one set on the
 * supplier's profile, e.g. "SabooSeide" → SABOOSEIDE), uppercased with
 * spaces and punctuation dropped so it stays one barcode-safe segment. A
 * supplier with no short name — including one typed in manually on the
 * purchase — falls back to the first 4 letters of its name.
 */
export function supplierPrefix(supplier: string, shortName?: string | null): string {
  const short = (shortName || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (short) return short;
  const letters = (supplier || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters.slice(0, 4) || "SUPP").padEnd(4, "X");
}

/**
 * Line code for one purchase serial: supplier prefix, then invoice number,
 * then the 3-digit serial for that line within the purchase — e.g. a
 * purchase from Ravi Silks (short name RAVI) against invoice 34, third line,
 * is RAVI-34-003.
 */
export function buildSareeCode(
  supplier: string,
  serial: number,
  invoiceNumber: string,
  shortName?: string | null
): string {
  const inv = (invoiceNumber || "").trim() || "NOINV";
  return `${supplierPrefix(supplier, shortName)}-${inv}-${String(serial).padStart(3, "0")}`;
}

/**
 * Codes for every line in the Add/Edit Purchase form, in order.
 *
 * A line already saved keeps its serial but follows the current short name
 * and invoice number — exactly what the server (SareeCodesService) will
 * re-code it to on save, moving every record of its pieces and keeping the
 * old code as an alias so stickers already printed still scan. The form only
 * previews it; the server never takes a saved line's code from the form.
 * New lines get a fresh serial, numbered by position but skipping any serial
 * a saved line already holds — so removing line 2 of 3 and adding a line
 * never hands out a second "-003".
 */
export function assignLineCodes(
  rows: { code?: string }[],
  supplier: string,
  invoiceNumber: string,
  shortName?: string | null
): string[] {
  const current = (code: string) => {
    const serial = serialFromLineCode(code);
    return serial ? buildSareeCode(supplier, Number(serial), invoiceNumber, shortName) : code;
  };
  const taken = new Set(rows.flatMap((r) => (r.code ? [current(r.code)] : [])));
  let serial = 0;
  return rows.map((r, idx) => {
    if (r.code) return current(r.code);
    serial = Math.max(serial, idx);
    let code: string;
    do {
      serial += 1;
      code = buildSareeCode(supplier, serial, invoiceNumber, shortName);
    } while (taken.has(code));
    taken.add(code);
    return code;
  });
}

/**
 * Code for one physical saree inside a purchase line.
 *
 * A line is bought as N pieces of the same type under one serial number;
 * every piece is tagged individually by appending its piece number onto the
 * end of the line code:
 *   line   RAVI-34-003
 *   piece  RAVI-34-003-01, RAVI-34-003-02, …
 */
export function buildSareePieceCode(
  supplier: string,
  serial: number,
  pieceNo: number,
  invoiceNumber: string,
  shortName?: string | null
): string {
  return pieceCodeFromLineCode(buildSareeCode(supplier, serial, invoiceNumber, shortName), pieceNo);
}

/** Same append, but starting from an already-built line code. */
export function pieceCodeFromLineCode(lineCode: string, pieceNo: number): string {
  return `${lineCode}-${String(pieceNo).padStart(2, "0")}`;
}

/**
 * The serial number inside a purchase-line code.
 *
 * A line code is `PREFIX-INVOICE-SERIAL` and the invoice number is free text
 * that routinely contains its own dashes and digits ("INV-2026-12"), so the
 * serial can only be read from the *end* of the code, never by counting
 * segments from the front. Returns null when the code isn't in that shape.
 */
export function serialFromLineCode(lineCode: string): string | null {
  return lineCode.match(/-(\d{3,4})$/)?.[1] ?? null;
}

/** The same serial, read from a physical piece code (line code + `-<pieceNo>`). */
export function serialFromPieceCode(pieceCode: string): string | null {
  return pieceCode.match(/-(\d{3,4})-\d{2,}$/)?.[1] ?? null;
}

/** Rounds a rupee figure to whole paise — every amount this module produces
 *  is a real payable number, never a float tail like 26928.499999999996 that
 *  a back-computed markup percentage would otherwise leave behind. */
function toPaiseRupees(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What one piece sells for: buying price plus markup, rounded to paise. */
export function sellingPerPiece(price: number, sellPercent: number): number {
  return toPaiseRupees(price + (price * sellPercent) / 100);
}

export function computeFinalAmount(price: number, sellPercent: number, quantity = 1): number {
  const qty = quantity > 0 ? quantity : 1;
  return toPaiseRupees(sellingPerPiece(price, sellPercent) * qty);
}

/**
 * The inverse of `sellingPerPiece` — the markup implied by a selling price a
 * user typed by hand. `sellPercent` stays the single stored source of truth
 * for a line (every downstream total, report and returns calculation derives
 * selling from it), so a manually-entered selling price is converted here
 * rather than stored alongside it, which would let the two disagree.
 *
 * Kept to 8 decimals to match the column's precision. That is deliberately
 * finer than it looks: at 4 decimals a ₹13,600 saree sold at ₹26,928.55 comes
 * back as ₹26,928.54, because one ten-thousandth of a percent of 13,600 is
 * still 1.36 paise. 8 decimals keeps the re-derived selling price on the typed
 * figure once rounded to paise, even on a lakh-rupee saree. A zero buying price has no markup that
 * can express a selling price, so it yields 0 — the caller keeps the field
 * usable and the percentage fills in once a price is entered.
 */
export function sellPercentFromSelling(price: number, sellingPrice: number): number {
  if (!(price > 0)) return 0;
  const exact = ((sellingPrice - price) / price) * 100;
  // Prefer the tidiest markup that still reproduces the typed price to the
  // paise — ₹600 typed as ₹750 is a plain 25%, and showing it as 25.00000000
  // in the Sell % field would only make the designer doubt the number.
  for (const decimals of [0, 2, 4]) {
    const rounded = Number(exact.toFixed(decimals));
    if (sellingPerPiece(price, rounded) === toPaiseRupees(sellingPrice)) return rounded;
  }
  return Number(exact.toFixed(8));
}

/** Markup for display — a back-computed percentage like 97.9963 reads as
 *  `98%` in a table; the stored 4-decimal value is what the money is
 *  calculated from. */
export function formatSellPercent(sellPercent: number | string | null | undefined): string {
  const n = Number(sellPercent) || 0;
  return `${Number(n.toFixed(2))}%`;
}

/** Pieces of a line still with us — the bought quantity minus the ones that
 * have gone back to the supplier. Counts shown to users are this, not the
 * original quantity, so a returned saree stops being counted as stock. */
export function remainingQuantity(s: Pick<SareeTag, "quantity" | "returnedQuantity">): number {
  const qty = Number(s.quantity) || 1;
  return Math.max(0, qty - Math.min(Number(s.returnedQuantity) || 0, qty));
}

/** Total pieces across saree lines — each line may cover more than one piece,
 * and pieces returned to the supplier no longer count. */
export function totalPieces(sarees: SareeTag[]): number {
  return sarees.reduce((sum, s) => sum + remainingQuantity(s), 0);
}

/** Pieces of a purchase still with us — counted from its lines, the same way
 * the barcode print and money totals do. The stored `sareeCount` is only a
 * fallback for a purchase with no line detail; it used to drift (edits, photo
 * uploads and approved returns each left it at a different figure). */
export function purchasePieces(p: Pick<Purchase, "sarees" | "sareeCount">): number {
  return p.sarees.length > 0 ? totalPieces(p.sarees) : p.sareeCount;
}

/** What the line cost us: buying price per piece × pieces still with us. */
export function lineBuying(s: Pick<SareeTag, "price" | "quantity" | "returnedQuantity">): number {
  return (Number(s.price) || 0) * remainingQuantity(s);
}

/** What the line should sell for — buying plus markup, across the pieces we
 * still hold; returned pieces are netted out. */
export function lineSelling(
  s: Pick<SareeTag, "price" | "sellPercent" | "quantity" | "returnedQuantity">
): number {
  return computeFinalAmount(Number(s.price) || 0, Number(s.sellPercent) || 0, remainingQuantity(s));
}

export function lineProfit(
  s: Pick<SareeTag, "price" | "sellPercent" | "quantity" | "returnedQuantity">
): number {
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
  /** Whether this specific piece has been returned to the supplier. */
  returned: boolean;
}

/**
 * Which pieces of a line have gone back to the supplier.
 *
 * `returnedPieceNos` names them when a debit note picked specific pieces.
 * Lines returned before that only carry a count, and the convention for
 * those is "the first N pieces" — so any count not covered by named pieces
 * is filled from the lowest positions not already named. The backend's
 * returnedPieceSet (purchases/returned-pieces.ts) applies the same rule.
 */
export function returnedPieceSet(
  quantity: number,
  returnedQuantity: number,
  returnedPieceNos: readonly number[] = []
): Set<number> {
  const count = Math.min(Math.max(Number(returnedQuantity) || 0, 0), quantity);
  const set = new Set<number>();
  for (const n of returnedPieceNos) {
    if (set.size >= count) break;
    if (n >= 1 && n <= quantity) set.add(n);
  }
  for (let n = 1; set.size < count && n <= quantity; n++) set.add(n);
  return set;
}

/**
 * Expand purchase lines into individual sarees — one row per physical piece,
 * each with its own code. Money is stated per piece.
 */
export function expandSareePieces<T extends SareeTag>(sarees: T[]): (T & SareePiece)[] {
  return sarees.flatMap((s) => {
    const qty = Number(s.quantity) || 1;
    const price = Number(s.price) || 0;
    const sellPercent = Number(s.sellPercent) || 0;
    const returnedSet = returnedPieceSet(qty, Number(s.returnedQuantity) || 0, s.returnedPieceNos);
    return Array.from({ length: qty }, (_, i) => ({
      ...s,
      id: pieceCodeFromLineCode(s.id, i + 1),
      lineCode: s.id,
      pieceNo: i + 1,
      lineQuantity: qty,
      quantity: 1,
      price,
      finalAmount: computeFinalAmount(price, sellPercent, 1),
      // Deliberately NOT falling back to the line's `imageUrl` — the serial's
      // photo is not this physical piece's photo. Each piece is uploaded on
      // its own, and an un-photographed piece shows the empty placeholder.
      imageUrl: s.pieceImageUrls?.[i] || undefined,
      returned: returnedSet.has(i + 1),
      // Restated per piece so money helpers net this piece out on its own
      // rather than reading the whole line's returned count against qty 1.
      returnedQuantity: returnedSet.has(i + 1) ? 1 : 0,
      returnedPieceNos: undefined,
    }));
  });
}

/** Returns a copy of `s` with piece `pieceNo`'s photo override set, padding
 * `pieceImageUrls` out to length as needed so the index lines up. */
export function withPieceImage<T extends SareeTag>(s: T, pieceNo: number, dataUrl: string): T {
  const next = [...(s.pieceImageUrls ?? [])];
  while (next.length < pieceNo) next.push("");
  next[pieceNo - 1] = dataUrl;
  return { ...s, pieceImageUrls: next };
}

export interface PurchaseTotals {
  pieces: number;
  buying: number;
  selling: number;
  profit: number;
}

/** What the purchase was invoiced for — every piece bought, ignoring anything
 * later returned. The supplier's bill doesn't shrink when stock goes back, so
 * bill figures use this rather than the netted `purchaseTotals`. */
export function invoicedSelling(
  sarees: Pick<SareeTag, "price" | "sellPercent" | "quantity">[]
): number {
  return sarees.reduce(
    (sum, s) =>
      sum +
      computeFinalAmount(Number(s.price) || 0, Number(s.sellPercent) || 0, Number(s.quantity) || 1),
    0
  );
}

/** What the supplier invoiced us for the sarees — buying price × every piece
 * bought, ignoring later returns (the bill doesn't shrink when stock goes
 * back). The subtotal a purchase's discount and GST apply to. */
export function invoicedBuying(sarees: Pick<SareeTag, "price" | "quantity">[]): number {
  return toPaiseRupees(
    sarees.reduce(
      (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) > 0 ? Number(s.quantity) : 1),
      0
    )
  );
}

export interface PurchaseBill {
  subtotal: number;
  discountAmount: number;
  /** subtotal − discountAmount — what GST is charged on. */
  taxable: number;
  gstAmount: number;
  /** subtotal − discountAmount + gstAmount. */
  billAmount: number;
  /** Why the entered discount/GST can't be saved, or null when it's fine. */
  error: string | null;
}

/**
 * The purchase bill, from its saree lines plus the discount and GST entered
 * on the form. Mirrors the backend's PurchasesService.computeBill, which
 * recalculates the same figures on save — the discount only lowers what we
 * pay the supplier; each saree's own cost and selling price are untouched.
 */
export function computePurchaseBill(
  sarees: Pick<SareeTag, "price" | "quantity">[],
  discountType: DiscountType,
  discountValue: number,
  gstPercent: number
): PurchaseBill {
  const subtotal = invoicedBuying(sarees);
  const value = Math.max(0, Number(discountValue) || 0);
  const gst = Math.max(0, Number(gstPercent) || 0);
  let error: string | null = null;
  if (discountType === "percent" && value > 100) error = "Discount can't be more than 100%";
  else if (discountType === "amount" && value > subtotal)
    error = "Discount can't be more than the sarees' total";
  else if (gst > 100) error = "GST can't be more than 100%";
  const discountAmount = toPaiseRupees(
    discountType === "percent" ? (subtotal * Math.min(value, 100)) / 100 : Math.min(value, subtotal)
  );
  const taxable = toPaiseRupees(subtotal - discountAmount);
  const gstAmount = toPaiseRupees((taxable * Math.min(gst, 100)) / 100);
  return {
    subtotal,
    discountAmount,
    taxable,
    gstAmount,
    billAmount: toPaiseRupees(taxable + gstAmount),
    error,
  };
}

/** Roll a set of saree lines up into buying / selling / profit totals, with
 * returned pieces netted out — see `invoicedSelling` for the gross figure. */
export function purchaseTotals(
  sarees: Pick<SareeTag, "price" | "sellPercent" | "quantity" | "returnedQuantity">[]
): PurchaseTotals {
  return sarees.reduce<PurchaseTotals>(
    (acc, s) => {
      acc.pieces += remainingQuantity(s);
      acc.buying += lineBuying(s);
      acc.selling += lineSelling(s);
      acc.profit += lineProfit(s);
      return acc;
    },
    { pieces: 0, buying: 0, selling: 0, profit: 0 }
  );
}

export function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "SU"
  );
}
