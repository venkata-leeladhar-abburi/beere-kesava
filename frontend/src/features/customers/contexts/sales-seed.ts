import { UnifiedSaree, SaleInfo, ReturnInfo, PurchaseSummary, SareeOrigin, SareeSaleStatus } from "./sales-types";

// ─── Seed reference data (codes match the source pages exactly) ───────────────
const WEAVERS = [
  { weaverId: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", weaverName: "Ravi Kumar",   weaverLoom: 2 },
  { weaverId: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", weaverName: "Padma Veni",   weaverLoom: 1 },
  { weaverId: "71413724-378d-4336-93dd-1db33cba3510", weaverName: "Anand K.",     weaverLoom: 3 },
  { weaverId: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", weaverName: "Suresh Murti", weaverLoom: 2 },
  { weaverId: "95cc89ea-6cf3-418c-bf9b-299e59f47389", weaverName: "Meena R.",     weaverLoom: 4 },
  { weaverId: "d3fd5a81-7d3a-478d-9a0f-d65a5db6779a", weaverName: "Lakshmi D.",   weaverLoom: 2 },
  { weaverId: "c7d8e833-dcd7-4a52-a867-f77d8ca2e1cf", weaverName: "Venkat Rao",   weaverLoom: 3 },
  { weaverId: "51490482-11cf-425b-8d54-7bd918f6db18", weaverName: "Kamala B.",    weaverLoom: 1 },
];

const FACTORY_LOOMS = [
  { factoryLoomId: "FL-001", factoryLoomNumber: "Loom F-01", operatorName: "Srinivas Kumar",    loomLocation: "Factory Floor A" },
  { factoryLoomId: "FL-002", factoryLoomNumber: "Loom F-02", operatorName: "Mahesh Reddy",      loomLocation: "Factory Floor A" },
  { factoryLoomId: "FL-003", factoryLoomNumber: "Loom F-03", operatorName: "Ramesh Naidu",      loomLocation: "Factory Floor B" },
  { factoryLoomId: "FL-004", factoryLoomNumber: "Loom F-04", operatorName: "Suresh Babu",       loomLocation: "Factory Floor B" },
  { factoryLoomId: "FL-005", factoryLoomNumber: "Loom F-05", operatorName: "Venkateswara Rao",  loomLocation: "Factory Floor C" },
];

/** Mirrors ExternalPurchasesPage INITIAL_RAW — same ids, invoices and bill amounts. */
const PURCHASES_RAW: (Omit<PurchaseSummary, "billAmount" | "paidAmount"> & {
  billAmount: number; paidPct: number; sareeType: string;
})[] = [
  { id: "EXT-2026-0001", supplier: "Ravi Silks",               location: "Dharmavaram, AP",  date: "01 Jun 2026", invoiceNumber: "INV-RS-2026-118", gstNumber: "37ABCRS1234F1Z5", billAmount:  34000, paidPct: 1,    status: "Paid",    sareeCount: 4,  sareeType: "Plain Silk"  },
  { id: "EXT-2026-0002", supplier: "Mysore Sarees",            location: "Mysore, KA",       date: "05 Jun 2026", invoiceNumber: "INV-MS-2026-552", gstNumber: "29MYSRS5678K1Z2", billAmount:  74400, paidPct: 0,    status: "Pending", sareeCount: 12, sareeType: "Mysore Silk" },
  { id: "EXT-2026-0003", supplier: "Chennai Silks",            location: "Chennai, TN",      date: "08 Jun 2026", invoiceNumber: "INV-CS-2026-073", gstNumber: "33CHNSK9012L1Z8", billAmount:  66000, paidPct: 0.4,  status: "Partial", sareeCount: 6,  sareeType: "Kanjivaram"  },
  { id: "EXT-2026-0004", supplier: "Kanchipuram House",        location: "Kanchipuram, TN",  date: "10 Jun 2026", invoiceNumber: "INV-KH-2026-209", gstNumber: "33KNCH3456M1Z1", billAmount:  88000, paidPct: 1,    status: "Paid",    sareeCount: 8,  sareeType: "Kanjivaram"  },
  { id: "EXT-2026-0005", supplier: "Venkateshwara Handlooms",  location: "Ongole, AP",       date: "11 Jun 2026", invoiceNumber: "INV-VH-2026-014", gstNumber: "37VENK7890N1Z6", billAmount:  22500, paidPct: 1,    status: "Paid",    sareeCount: 3,  sareeType: "Plain Silk"  },
  { id: "EXT-2026-0006", supplier: "Pochampally Coop",         location: "Pochampally, TG",  date: "11 Jun 2026", invoiceNumber: "INV-PC-2026-301", gstNumber: "36POCH2345P1Z9", billAmount: 120000, paidPct: 0,    status: "Pending", sareeCount: 15, sareeType: "Patola"      },
];

export const SEED_PURCHASE_SUMMARIES: PurchaseSummary[] = PURCHASES_RAW.map(p => ({
  id: p.id, supplier: p.supplier, location: p.location, date: p.date,
  invoiceNumber: p.invoiceNumber, gstNumber: p.gstNumber,
  billAmount: p.billAmount, paidAmount: Math.round(p.billAmount * p.paidPct),
  status: p.status, sareeCount: p.sareeCount,
}));

const DESIGNS = ["BKB-045", "BKB-031", "BKB-022", "BKB-038", "BKB-019", "BKB-052"];
const TYPES = [
  { sareeTypeCode: "SB-001", sareeTypeName: "Self Brocade"    },
  { sareeTypeCode: "HZ-003", sareeTypeName: "Heavy Zari"      },
  { sareeTypeCode: "PS-002", sareeTypeName: "Plain Silk"      },
  { sareeTypeCode: "BS-004", sareeTypeName: "Bridal Special"  },
];
const RETAIL_CUSTOMERS = ["Mrs. Kamala Reddy", "Mrs. Anita Sharma", "Mrs. Sujatha Rao", "Mrs. Devi Prasad", "Mrs. Latha Iyer", "Mrs. Bhavani S."];
const WHOLESALE_CUSTOMERS = ["Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Annapurna Silks", "Rajam Silks"];
const RETURN_REASONS = ["Colour mismatch", "Zari defect noticed by customer", "Size / length complaint", "Customer changed design choice", "Border weaving fault"];
const MONTHS = ["Apr", "May", "Jun", "Jul"];
/** Batch ids in use — same series as BatchContext / FactoryLoomPage. */
const WEAVER_BATCHES = ["BATCH-078", "BATCH-091", "BATCH-093", "BATCH-094", "BATCH-095"];
const LOOM_BATCHES   = ["BATCH-085", "BATCH-088", "BATCH-090", "BATCH-092", "BATCH-096"];

// Deterministic pseudo-random so the report is stable across renders.
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
function pick<T>(arr: readonly T[], seed: number): T {
  // arr is always non-empty at every call site, but noUncheckedIndexedAccess
  // can't verify that from the index expression — assert the invariant.
  const item = arr[Math.floor(rnd(seed) * arr.length) % arr.length];
  if (item === undefined) throw new Error("pick() called with an empty array");
  return item;
}
function dateFor(seed: number): string {
  const d = 1 + Math.floor(rnd(seed) * 27);
  return `${String(d).padStart(2, "0")} ${pick(MONTHS, seed * 3)} 2026`;
}

function buildSaree(i: number, base: Partial<UnifiedSaree> & { sareeId: string; origin: SareeOrigin }): UnifiedSaree {
  const t = pick(TYPES, i * 1.7);
  const costPrice = base.origin === "external"
    ? 400 + Math.round(rnd(i * 2.1) * 300)
    : 3200 + Math.round(rnd(i * 2.1) * 2400);
  const sellPercent = 20 + Math.round(rnd(i * 3.3) * 15);
  const finalAmount = Math.round(costPrice + (costPrice * sellPercent) / 100);

  // ~45% still unsold, ~32% retail, ~16% wholesale, ~7% returned
  const roll = rnd(i * 5.9);
  let status: SareeSaleStatus = "unsold";
  if (roll > 0.93) status = "returned";
  else if (roll > 0.77) status = "wholesale";
  else if (roll > 0.45) status = "retail";

  const saleDate = dateFor(i * 7.7);
  const sale: SaleInfo | null =
    status === "unsold" ? null
    : status === "wholesale"
      ? { saleRef: `ORD-2026-${String(30 + (i % 20)).padStart(3, "0")}`, channel: "wholesale", date: saleDate, customer: pick(WHOLESALE_CUSTOMERS, i * 4.4), amount: Math.round(finalAmount * 0.88) }
      : { saleRef: `SAL-2026-${String(100 + i).padStart(3, "0")}`,        channel: "retail",    date: saleDate, customer: pick(RETAIL_CUSTOMERS,   i * 4.4), amount: finalAmount };

  const ret: ReturnInfo | null = status === "returned"
    ? { returnRef: `RET-2026-${String(10 + (i % 40)).padStart(3, "0")}`, date: dateFor(i * 9.1), reason: pick(RETURN_REASONS, i * 6.2), refundAmount: finalAmount, restocked: rnd(i * 8.8) > 0.4 }
    : null;

  return {
    designCode: pick(DESIGNS, i * 2.5),
    sareeTypeCode: t.sareeTypeCode,
    sareeTypeName: t.sareeTypeName,
    weight: `${680 + ((i * 37) % 220)}g`,
    qcDate: dateFor(i * 1.3),
    batchId: null,
    costPrice, sellPercent, finalAmount,
    status, sale, ret,
    ageDays: status === "unsold" || status === "returned" ? 5 + Math.floor(rnd(i * 11.2) * 140) : 0,
    ...base,
  } as UnifiedSaree;
}

function buildDataset(): UnifiedSaree[] {
  const out: UnifiedSaree[] = [];
  let i = 1;

  // ── Weaver-produced (outsourced to our own weavers) ──
  WEAVERS.forEach((w, wi) => {
    const count = 6 + Math.floor(rnd(wi * 3.1) * 8);   // 6–13 sarees each
    for (let n = 1; n <= count; n++, i++) {
      const first = (w.weaverName.split(/[\s.]+/)[0] ?? w.weaverName).toUpperCase();
      out.push(buildSaree(i, {
        sareeId: `${first}-L${w.weaverLoom}-${String(n).padStart(3, "0")}`,
        origin: "weaver",
        weaverId: w.weaverId, weaverName: w.weaverName, weaverLoom: w.weaverLoom,
        batchId: WEAVER_BATCHES[(wi + n) % WEAVER_BATCHES.length],
      }));
    }
  });

  // ── Factory loom produced (in-house) ──
  FACTORY_LOOMS.forEach((l, li) => {
    const count = 5 + Math.floor(rnd(li * 4.7) * 9);   // 5–13 sarees each
    for (let n = 1; n <= count; n++, i++) {
      out.push(buildSaree(i, {
        sareeId: `BKB-${l.factoryLoomNumber.replace("Loom ", "")}-${String(n).padStart(3, "0")}`,
        origin: "factoryLoom",
        factoryLoomId: l.factoryLoomId, factoryLoomNumber: l.factoryLoomNumber,
        operatorName: l.operatorName, loomLocation: l.loomLocation,
        batchId: LOOM_BATCHES[(li + n) % LOOM_BATCHES.length],
      }));
    }
  });

  // ── External purchases (saree ids follow ExternalPurchasesPage.buildSareeCode) ──
  PURCHASES_RAW.forEach(p => {
    const prefix = (p.supplier.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4) || "SUPP").padEnd(4, "X");
    for (let n = 1; n <= p.sareeCount; n++, i++) {
      out.push(buildSaree(i, {
        sareeId: `${prefix}-${String(n).padStart(3, "0")}-${p.invoiceNumber}`,
        origin: "external",
        purchaseId: p.id, supplier: p.supplier, supplierLocation: p.location,
        invoiceNumber: p.invoiceNumber, purchaseDate: p.date,
        qcDate: p.date,
        sareeTypeCode: "EX-000", sareeTypeName: p.sareeType,
      }));
    }
  });

  return out;
}

export const SEED_UNIFIED_SAREES = buildDataset();

// ─── Selectors (pure — usable from any page) ─────────────────────────────────
export const isOutstanding = (s: UnifiedSaree) =>
  s.status === "unsold" || (s.status === "returned" && s.ret?.restocked === true);

export const isSold = (s: UnifiedSaree) => s.status === "retail" || s.status === "wholesale";

export function ageBucket(days: number): "0-30" | "31-60" | "61-90" | "90+" {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export interface SellerRank {
  key: string;
  name: string;
  sub: string;
  origin: SareeOrigin;
  produced: number;
  sold: number;
  retail: number;
  wholesale: number;
  returned: number;
  outstanding: number;
  revenue: number;
  sellThroughPct: number;
}

export function rankSellers(sarees: UnifiedSaree[], origin: SareeOrigin): SellerRank[] {
  const map = new Map<string, SellerRank>();
  sarees.filter(s => s.origin === origin).forEach(s => {
    const key =
      origin === "weaver"     ? (s.weaverId || "?") :
      origin === "factoryLoom"? (s.factoryLoomId || "?") :
                                (s.supplier || "?");
    const name =
      origin === "weaver"     ? (s.weaverName || "—") :
      origin === "factoryLoom"? (s.factoryLoomNumber || "—") :
                                (s.supplier || "—");
    const sub =
      origin === "weaver"     ? `${s.weaverId} · Loom ${s.weaverLoom}` :
      origin === "factoryLoom"? `${s.operatorName} · ${s.loomLocation}` :
                                (s.supplierLocation || "—");

    let r = map.get(key);
    if (!r) { r = { key, name, sub, origin, produced: 0, sold: 0, retail: 0, wholesale: 0, returned: 0, outstanding: 0, revenue: 0, sellThroughPct: 0 }; map.set(key, r); }
    r.produced++;
    if (s.status === "retail")    { r.retail++;    r.sold++; r.revenue += s.sale?.amount || 0; }
    if (s.status === "wholesale") { r.wholesale++; r.sold++; r.revenue += s.sale?.amount || 0; }
    if (s.status === "returned")  { r.returned++;  r.revenue -= s.ret?.refundAmount || 0; }
    if (isOutstanding(s))         { r.outstanding++; }
  });
  return [...map.values()]
    .map(r => ({ ...r, sellThroughPct: r.produced ? Math.round((r.sold / r.produced) * 100) : 0 }))
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue);
}

export interface PurchaseOutstanding extends PurchaseSummary {
  sarees: UnifiedSaree[];
  unsoldSarees: UnifiedSaree[];
  returnedSarees: UnifiedSaree[];
  soldCount: number;
  unsoldCount: number;
  returnedCount: number;
  unsoldValue: number;      // at expected selling price
  unsoldCost: number;       // money still locked in stock
  refundValue: number;
  dueAmount: number;        // bill outstanding
}

export function purchaseOutstanding(sarees: UnifiedSaree[]): PurchaseOutstanding[] {
  return SEED_PURCHASE_SUMMARIES.map(p => {
    const rows = sarees.filter(s => s.purchaseId === p.id);
    const unsoldSarees = rows.filter(isOutstanding);
    const returnedSarees = rows.filter(s => s.status === "returned");
    return {
      ...p,
      sarees: rows,
      unsoldSarees,
      returnedSarees,
      soldCount: rows.filter(isSold).length,
      unsoldCount: unsoldSarees.length,
      returnedCount: returnedSarees.length,
      unsoldValue: unsoldSarees.reduce((a, s) => a + s.finalAmount, 0),
      unsoldCost: unsoldSarees.reduce((a, s) => a + s.costPrice, 0),
      refundValue: returnedSarees.reduce((a, s) => a + (s.ret?.refundAmount || 0), 0),
      dueAmount: p.billAmount - p.paidAmount,
    };
  });
}
