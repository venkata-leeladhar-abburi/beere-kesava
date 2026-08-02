import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

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
  status: "pending" | "approved" | "rejected";
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
  status: "active" | "inactive" | "overdue";
  rating: number;
}

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
    { pieces: 0, buying: 0, selling: 0, profit: 0 },
  );
}

export function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "SU";
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

const SEED_SUPPLIERS: Supplier[] = [
  { id: "SUP-001", name: "Ravi Silks", initials: "RS", contactName: "Ravi Prasad", phone: "+91 94900 11223", whatsapp: "+91 94900 11223", city: "Dharmavaram", state: "Andhra Pradesh", address: "22, Silk Market Road, Dharmavaram, Andhra Pradesh - 515671", gstCode: "37ABCRS1234F1Z5", specialty: "Plain Silk", terms: "30 days", bankName: "SBI", accountNo: "31009988771", notes: "Consistent quality plain silk. Preferred for summer stock.", status: "active", rating: 5 },
  { id: "SUP-002", name: "Mysore Sarees", initials: "MS", contactName: "Girish Rao", phone: "+91 98450 33445", city: "Mysore", state: "Karnataka", address: "8, Sayyaji Rao Road, Mysore, Karnataka - 570001", gstCode: "29MYSRS5678K1Z2", specialty: "Mysore Silk", terms: "45 days", bankName: "Canara Bank", accountNo: "11220033445", notes: "Authentic Mysore silk with silk mark certification.", status: "overdue", rating: 4 },
  { id: "SUP-003", name: "Chennai Silks", initials: "CS", contactName: "Karthik Subramanian", phone: "+91 90030 55667", whatsapp: "+91 90030 55667", city: "Chennai", state: "Tamil Nadu", address: "45, Usman Road, T. Nagar, Chennai, Tamil Nadu - 600017", gstCode: "33CHNSK9012L1Z8", specialty: "Kanjivaram", terms: "30 days", bankName: "HDFC", accountNo: "50100234455", notes: "Wide Kanjivaram range. Negotiable rates on bulk lots.", status: "active", rating: 4 },
  { id: "SUP-004", name: "Kanchipuram House", initials: "KH", contactName: "Murali Krishnan", phone: "+91 99400 77889", city: "Kanchipuram", state: "Tamil Nadu", address: "15, Gandhi Road, Kanchipuram, Tamil Nadu - 631501", gstCode: "33KNCH3456M1Z1", specialty: "Kanjivaram", terms: "60 days", bankName: "ICICI", accountNo: "62200114477", notes: "Premium bridal Kanjivaram. Longer lead times during season.", status: "active", rating: 5 },
  { id: "SUP-005", name: "Venkateshwara Handlooms", initials: "VH", contactName: "Srinivas Reddy", phone: "+91 91000 22334", city: "Ongole", state: "Andhra Pradesh", address: "3, Trunk Road, Ongole, Andhra Pradesh - 523001", gstCode: "37VENK7890N1Z6", specialty: "Plain Silk", terms: "15 days", bankName: "Axis Bank", accountNo: "91800223344", notes: "Small handloom cluster. Good for trial batches.", status: "active", rating: 3 },
  { id: "SUP-006", name: "Pochampally Coop", initials: "PC", contactName: "Anitha Rani", phone: "+91 95500 66778", whatsapp: "+91 95500 66778", city: "Pochampally", state: "Telangana", address: "Handloom Park, Bhoodan Pochampally, Telangana - 508284", gstCode: "36POCH2345P1Z9", specialty: "Patola", terms: "30 days", bankName: "Telangana Grameena Bank", accountNo: "77880011223", notes: "Cooperative society. Ikat and Patola specialists.", status: "active", rating: 4 },
];

const SEED_COLORS = ["Cream", "Maroon", "Red", "Blue", "Indigo", "Gold", "Black", "Pink", "Orange", "Purple"];

function weightFor(i: number) {
  return `${680 + ((i * 37) % 220)}g`;
}

function generateSarees(count: number, date: string, sareeType: string, supplier: string, invoiceNumber: string): SareeTag[] {
  return Array.from({ length: count }, (_, i) => {
    const price = 400 + ((i * 53) % 300);
    const sellPercent = 20 + ((i * 7) % 15);
    return {
      id: buildSareeCode(supplier, i + 1, invoiceNumber),
      weight: weightFor(i),
      date,
      sareeType,
      color: SEED_COLORS[i % SEED_COLORS.length],
      price,
      sellPercent,
      quantity: 1,
      finalAmount: computeFinalAmount(price, sellPercent, 1),
      notes: "",
    };
  });
}

const SEED_PURCHASE_RAW = [
  { id: "EXT-2026-0001", supplierId: "SUP-001", supplier: "Ravi Silks",              location: "Dharmavaram, AP", date: "01 Jun 2026", seedType: "Plain Silk",  sareeCount: 4,  gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-118", billAmount: "₹34,000",    status: "Paid",    notes: "Fresh stock for summer season", addedBy: "Admin" },
  { id: "EXT-2026-0002", supplierId: "SUP-002", supplier: "Mysore Sarees",           location: "Mysore, KA",      date: "05 Jun 2026", seedType: "Mysore Silk", sareeCount: 12, gstNumber: "29MYSRS5678K1Z2", invoiceNumber: "INV-MS-2026-552", billAmount: "₹74,400",    status: "Pending", notes: "Awaiting full payment", addedBy: "Superadmin" },
  { id: "EXT-2026-0003", supplierId: "SUP-003", supplier: "Chennai Silks",           location: "Chennai, TN",     date: "08 Jun 2026", seedType: "Kanjivaram",  sareeCount: 6,  gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-073", billAmount: "₹66,000",    status: "Partial", notes: "First instalment paid", addedBy: "Admin" },
  { id: "EXT-2026-0004", supplierId: "SUP-004", supplier: "Kanchipuram House",       location: "Kanchipuram, TN", date: "10 Jun 2026", seedType: "Kanjivaram",  sareeCount: 8,  gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-209", billAmount: "₹88,000",    status: "Paid",    notes: "", addedBy: "Admin" },
  { id: "EXT-2026-0005", supplierId: "SUP-005", supplier: "Venkateshwara Handlooms", location: "Ongole, AP",      date: "11 Jun 2026", seedType: "Plain Silk",  sareeCount: 3,  gstNumber: "37VENK7890N1Z6", invoiceNumber: "INV-VH-2026-014", billAmount: "₹22,500",    status: "Paid",    notes: "Trial batch", addedBy: "Admin" },
  { id: "EXT-2026-0006", supplierId: "SUP-006", supplier: "Pochampally Coop",        location: "Pochampally, TG", date: "11 Jun 2026", seedType: "Patola",      sareeCount: 15, gstNumber: "36POCH2345P1Z9", invoiceNumber: "INV-PC-2026-301", billAmount: "₹1,20,000", status: "Pending", notes: "Inter-branch transfer", addedBy: "Superadmin" },
  { id: "EXT-2026-0007", supplierId: "SUP-001", supplier: "Ravi Silks",              location: "Dharmavaram, AP", date: "18 Apr 2026", seedType: "Plain Silk",  sareeCount: 7,  gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-092", billAmount: "₹52,500",    status: "Paid",    notes: "Repeat order", addedBy: "Admin" },
  { id: "EXT-2026-0008", supplierId: "SUP-003", supplier: "Chennai Silks",           location: "Chennai, TN",     date: "02 Mar 2026", seedType: "Kanjivaram",  sareeCount: 10, gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-018", billAmount: "₹1,10,000", status: "Paid",    notes: "Festive season stock", addedBy: "Superadmin" },
];

const SEED_PURCHASES: Purchase[] = SEED_PURCHASE_RAW.map(({ seedType, sareeCount, ...p }) => ({
  ...p,
  sareeCount,
  sarees: generateSarees(sareeCount, p.date, seedType, p.supplier, p.invoiceNumber),
}));

const SEED_PAYMENTS: SupplierPayment[] = [
  { id: "SPY-001", supplierId: "SUP-001", date: "03 Jun 2026", amount: 34000,  mode: "Bank Transfer", reference: "UTR-882910", purchaseId: "EXT-2026-0001", notes: "Full settlement" },
  { id: "SPY-002", supplierId: "SUP-001", date: "22 Apr 2026", amount: 52500,  mode: "Bank Transfer", reference: "UTR-771204", purchaseId: "EXT-2026-0007", notes: "Full settlement" },
  { id: "SPY-003", supplierId: "SUP-003", date: "12 Jun 2026", amount: 30000,  mode: "UPI",           reference: "UPI-5512309", purchaseId: "EXT-2026-0003", notes: "First instalment" },
  { id: "SPY-004", supplierId: "SUP-003", date: "06 Mar 2026", amount: 110000, mode: "Cheque",        reference: "CHQ-004411", purchaseId: "EXT-2026-0008", notes: "Full settlement" },
  { id: "SPY-005", supplierId: "SUP-004", date: "14 Jun 2026", amount: 88000,  mode: "Bank Transfer", reference: "UTR-990233", purchaseId: "EXT-2026-0004", notes: "Full settlement" },
  { id: "SPY-006", supplierId: "SUP-005", date: "13 Jun 2026", amount: 22500,  mode: "Cash",          reference: "CASH-0091",  purchaseId: "EXT-2026-0005", notes: "Paid on delivery" },
];

/** Saree lines for a seeded request, priced like a real submission. */
function requestSarees(supplier: string, invoice: string, date: string, sareeType: string, lines: { qty: number; price: number; sell: number; color: string; weight: string }[]): SareeTag[] {
  return lines.map((l, i) => ({
    id: buildSareeCode(supplier, i + 1, invoice),
    weight: l.weight,
    date,
    sareeType,
    color: l.color,
    price: l.price,
    sellPercent: l.sell,
    quantity: l.qty,
    finalAmount: computeFinalAmount(l.price, l.sell, l.qty),
    notes: "",
  }));
}

const SEED_REQUESTS: PurchaseRequest[] = [
  {
    id: "EPR-001", supplierId: "SUP-004", supplierName: "Kanchipuram House", requestedBy: "Admin",
    requestedDate: "20 Jul 2026", sareeType: "Kanjivaram", quantity: 20, estimatedAmount: 240000,
    urgency: "Urgent", reason: "Bridal season stock running low.", status: "pending",
    location: "Kanchipuram, TN", gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-244",
    purchaseDate: "20 Jul 2026", billAmount: "₹2,40,000",
    notes: "Bridal collection for the festive window. Confirm delivery before 10 Aug.",
    sarees: requestSarees("Kanchipuram House", "INV-KH-2026-244", "20 Jul 2026", "Kanjivaram", [
      { qty: 8, price: 9000,  sell: 28, color: "Maroon", weight: "890g" },
      { qty: 7, price: 10500, sell: 25, color: "Gold",   weight: "915g" },
      { qty: 5, price: 12000, sell: 30, color: "Red",    weight: "940g" },
    ]),
  },
  { id: "EPR-002", supplierId: "SUP-006", supplierName: "Pochampally Coop",  requestedBy: "Admin", requestedDate: "12 Jul 2026", sareeType: "Patola",     quantity: 12, estimatedAmount: 96000,  urgency: "Normal", reason: "Replenish Ikat range for the shop floor.", status: "approved", decidedBy: "Superadmin", decidedDate: "14 Jul 2026" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface SupplierContextValue {
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: SupplierPayment[];
  requests: PurchaseRequest[];

  addSupplier: (s: Omit<Supplier, "id" | "initials">) => string;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  getSupplier: (id: string) => Supplier | undefined;
  nextSupplierId: () => string;

  addPurchase: (p: Omit<Purchase, "id">) => string;
  updatePurchase: (id: string, patch: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;

  addPayment: (p: Omit<SupplierPayment, "id">) => void;
  raiseRequest: (r: Omit<PurchaseRequest, "id" | "status">) => void;
  decideRequest: (id: string, status: "approved" | "rejected", decidedBy: string, note?: string) => void;

  /** Purchases + payment totals + outstanding for one supplier. */
  statsFor: (supplierId: string) => {
    purchases: Purchase[];
    totalPurchased: number;
    totalPaid: number;
    outstanding: number;
    sareeCount: number;
    lastPurchaseDate: string;
  };
}

const SupplierContext = createContext<SupplierContextValue | null>(null);

export function useSuppliers() {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error("useSuppliers must be used within a SupplierProvider");
  return ctx;
}

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [purchases, setPurchases] = useState<Purchase[]>(SEED_PURCHASES);
  const [payments,  setPayments]  = useState<SupplierPayment[]>(SEED_PAYMENTS);
  const [requests,  setRequests]  = useState<PurchaseRequest[]>(SEED_REQUESTS);

  const nextSupplierId = useCallback(
    () => `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
    [suppliers.length]
  );

  const addSupplier = useCallback((s: Omit<Supplier, "id" | "initials">) => {
    const id = `SUP-${String(Date.now()).slice(-6)}`;
    setSuppliers(prev => [{ ...s, id, initials: initialsOf(s.name) }, ...prev]);
    return id;
  }, []);

  const updateSupplier = useCallback((id: string, patch: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch };
      // Keep the avatar initials in step with a renamed business.
      return patch.name ? { ...next, initials: initialsOf(patch.name) } : next;
    }));
  }, []);

  const getSupplier = useCallback(
    (id: string) => suppliers.find(s => s.id === id),
    [suppliers]
  );

  const addPurchase = useCallback((p: Omit<Purchase, "id">) => {
    const id = `EXT-2026-${String(Date.now()).slice(-4)}`;
    setPurchases(prev => [{ ...p, id }, ...prev]);
    return id;
  }, []);

  const updatePurchase = useCallback((id: string, patch: Partial<Purchase>) => {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPayment = useCallback((p: Omit<SupplierPayment, "id">) => {
    setPayments(prev => [{ ...p, id: `SPY-${String(Date.now()).slice(-6)}` }, ...prev]);
  }, []);

  const raiseRequest = useCallback((r: Omit<PurchaseRequest, "id" | "status">) => {
    setRequests(prev => [{ ...r, id: `EPR-${String(Date.now()).slice(-6)}`, status: "pending" }, ...prev]);
  }, []);

  const decideRequest = useCallback((id: string, status: "approved" | "rejected", decidedBy: string, note?: string) => {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      let createdPurchaseId: string | undefined;
      // Approving a request turns it into a real external purchase, exactly as
      // the admin submitted it — nothing to re-key on the superadmin's side.
      if (status === "approved" && r.status === "pending" && r.sarees && r.sarees.length > 0) {
        createdPurchaseId = `EXT-2026-${String(Date.now()).slice(-4)}`;
        const purchase: Purchase = {
          id: createdPurchaseId,
          supplierId: r.supplierId || undefined,
          supplier: r.supplierName,
          location: r.location ?? "—",
          date: r.purchaseDate || r.requestedDate,
          sareeCount: totalPieces(r.sarees),
          gstNumber: r.gstNumber ?? "",
          invoiceNumber: r.invoiceNumber ?? "",
          billAmount: r.billAmount || `₹${Math.round(purchaseTotals(r.sarees).selling).toLocaleString("en-IN")}`,
          status: "Pending",
          notes: r.notes ?? "",
          invoiceFileName: r.invoiceFileName,
          sarees: r.sarees,
        };
        setPurchases(prevP => [purchase, ...prevP]);
      }
      return { ...r, status, decidedBy, decidedDate: today, decisionNote: note, createdPurchaseId };
    }));
  }, []);

  const statsFor = useCallback((supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    // Older purchases may predate supplierId, so fall back to matching on the name.
    const mine = purchases.filter(p =>
      p.supplierId === supplierId || (!!supplier && p.supplier === supplier.name)
    );
    const totalPurchased = mine.reduce((sum, p) => sum + parseINR(p.billAmount), 0);
    const totalPaid = payments.filter(p => p.supplierId === supplierId).reduce((sum, p) => sum + p.amount, 0);
    return {
      purchases: mine,
      totalPurchased,
      totalPaid,
      outstanding: Math.max(0, totalPurchased - totalPaid),
      sareeCount: mine.reduce((sum, p) => sum + p.sareeCount, 0),
      lastPurchaseDate: mine[0]?.date ?? "—",
    };
  }, [purchases, payments, suppliers]);

  const value = useMemo<SupplierContextValue>(() => ({
    suppliers, purchases, payments, requests,
    addSupplier, updateSupplier, getSupplier, nextSupplierId,
    addPurchase, updatePurchase, deletePurchase,
    addPayment, raiseRequest, decideRequest, statsFor,
  }), [
    suppliers, purchases, payments, requests,
    addSupplier, updateSupplier, getSupplier, nextSupplierId,
    addPurchase, updatePurchase, deletePurchase,
    addPayment, raiseRequest, decideRequest, statsFor,
  ]);

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}
