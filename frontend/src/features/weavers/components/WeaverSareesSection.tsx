import React, { useEffect, useMemo, useRef, useState } from "react";
import { useBatches } from "../../production/contexts/BatchContext";
import { useQc, QcResult } from "../../qc/contexts/QcContext";
import { useFinishing } from "../../finishing/contexts/FinishingContext";
import { useSales, UnifiedSaree, isSold, isOutstanding, ageBucket } from "../../customers/contexts/SalesContext";
import { useDesignLibrary } from "../../design-library/contexts/DesignLibraryContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../shared/ui/DataPagination";
import { useCanSeeMoney } from "../../../shared/ui/MoneyAccess";
import { Search } from "lucide-react";

// ── Design tokens (matches WeaversPage) ──────────────────────────────────────
const T = {
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  antiqueGold: "#C89B47",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  silkCream: "#F7F2EA",
  taupe: "#8B7060",
  crimson: "#C0392B",
  green: "#1E6640",
  orange: "#E67E22",
  blue: "#4A7FB5",
  purple: "#9B4DCA",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** External saree IDs follow SupplierContext.buildSareeCode: PREFIX-###-INVOICE.
 *  Pulls out the 3-digit serial so it reads as its own field rather than being
 *  buried inside the compound saree ID. */
function externalSerialOf(sareeId: string): string | null {
  const m = sareeId.match(/^[A-Za-z]+-(\d{3,4})-/);
  return m ? m[1] : null;
}

const AGE_COLOR: Record<string, string> = {
  "0-30": T.green, "31-60": T.antiqueGold, "61-90": T.orange, "90+": T.crimson,
};

/** Renders a date string in a compact, consistent form. */
function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Row model ────────────────────────────────────────────────────────────────
type FinishingStatus = "completed" | "in-finishing" | "pending" | "none" | "rejected";

export interface WeaverSareeRow {
  sareeId: string;
  batchId: string | null;
  loomNumber: number | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderLabel: string | null;
  designCode: string | null;
  /** Body colour, resolved from the design library via designCode. */
  color: string | null;

  /** true when the saree comes from a production batch assigned to this weaver */
  isAssigned: boolean;
  assignedDate: string | null;

  qcStatus: QcResult | "pending";
  receivedDate: string | null;
  qcDate: string | null;
  defects: string[];
  makingCharge: number | null;
  deduction: number | null;
  payable: number | null;

  finishingStatus: FinishingStatus;
  finishingAssignedDate: string | null;
  finishingCompletedDate: string | null;

  /** present when the saree exists in the sales / stock ledger */
  stock: UnifiedSaree | null;

  /** Who wove/produced this saree — only populated in "all" (cross-weaver) mode. */
  ownerKind: "weaver" | "loom" | null;
  ownerId: string | null;
  ownerLabel: string | null;
}

const QC_CFG: Record<QcResult | "pending", { label: string; color: string }> = {
  passed: { label: "QC Passed", color: T.green },
  semi: { label: "Semi-Approved", color: T.antiqueGold },
  defective: { label: "Defective", color: T.crimson },
  pending: { label: "In Production", color: T.taupe },
};

const FIN_CFG: Record<FinishingStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: T.green },
  "in-finishing": { label: "In Finishing", color: T.antiqueGold },
  pending: { label: "Not Assigned", color: T.taupe },
  none: { label: "—", color: T.taupe },
  rejected: { label: "Rejected", color: T.crimson },
};

// ── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey =
  | "assigned" | "produced" | "qcpassed" | "semi"
  | "defective" | "finishing" | "sold" | "outstanding" | "shortage" | "external";

/** Which date each tab filters and sorts on. */
function tabDate(row: WeaverSareeRow, tab: TabKey): string | null {
  switch (tab) {
    case "assigned": return row.assignedDate;
    case "produced": return row.receivedDate ?? row.stock?.qcDate ?? null;
    case "qcpassed":
    case "semi":
    case "defective": return row.qcDate;
    case "finishing": return row.finishingCompletedDate;
    case "sold": return row.stock?.sale?.date ?? null;
    case "outstanding": return row.stock?.qcDate ?? null;
    case "shortage": return row.finishingCompletedDate ?? row.qcDate ?? null;
    case "external": return row.stock?.purchaseDate ?? row.stock?.qcDate ?? null;
  }
}

// ── Small presentational bits ────────────────────────────────────────────────
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 11,
      fontWeight: 700, color, background: `${color}1A`, borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

const th: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase",
  letterSpacing: "0.8px", textAlign: "left", padding: "10px 12px",
  borderBottom: `1.5px solid ${T.borderDef}`, whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, padding: "10px 12px",
  borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle", whiteSpace: "nowrap",
};
const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        height: 38, padding: "0 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
        background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none"
      }}>
      {options.map(o => <option key={o} value={o}>{o === "all" ? (label === "Finishing" || label === "QC Status" ? `All ${label}` : `All ${label}s`) : o}</option>)}
    </select>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────
export function WeaverSareesSection({ weaverId, weaverName, ownerType = "weaver", selectable = false, selectedIds, onToggleRow, onToggleAll, onVisibleChange }: {
  /** Weaver id (WV-00X) or factory loom id (FL-00X), depending on ownerType. Unused when ownerType is "all". */
  weaverId?: string;
  weaverName?: string;
  /** "all" shows every saree across every weaver and factory loom, with owner filters/column. */
  ownerType?: "weaver" | "loom" | "all";
  /** When true, renders a checkbox column (main table only) driven by the props below. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (sareeId: string) => void;
  onToggleAll?: (visibleIds: string[]) => void;
  /** Fired whenever the currently visible (filtered + sorted) row list changes. */
  onVisibleChange?: (rows: WeaverSareeRow[]) => void;
}) {
  const isLoom = ownerType === "loom";
  const isAll = ownerType === "all";
  const { batches } = useBatches();
  const { qcRecords: allQcRecords, getQcForWeaver, getQcForLoom } = useQc();
  const { readySarees, assignments, returns } = useFinishing();
  const { sarees: allStock } = useSales();
  const { getDesign } = useDesignLibrary();

  const [tab, setTab] = useState<TabKey>("assigned");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [fBatch, setFBatch] = useState("all");
  const [fLoom, setFLoom] = useState("all");
  const [fOrder, setFOrder] = useState("all");
  const [fType, setFType] = useState("all");
  const [fColor, setFColor] = useState("all");
  const [fQc, setFQc] = useState("all");
  const [fFinishing, setFFinishing] = useState("all");
  const [fOwnerWeaver, setFOwnerWeaver] = useState("all");
  const [fOwnerLoom, setFOwnerLoom] = useState("all");
  const [fSupplier, setFSupplier] = useState("all");
  const [fPurchaseOrder, setFPurchaseOrder] = useState("all");
  const [fSerial, setFSerial] = useState("all");

  const isExternalTab = tab === "external";

  const qcRecords = isAll ? allQcRecords : isLoom ? getQcForLoom(weaverId!) : getQcForWeaver(weaverId!);

  // ── Build one enriched row per saree, joining batch + QC + finishing + stock ──
  const rows = useMemo<WeaverSareeRow[]>(() => {
    const byId = new Map<string, WeaverSareeRow>();

    const blank = (sareeId: string): WeaverSareeRow => ({
      sareeId, batchId: null, loomNumber: null, sareeTypeCode: null, sareeTypeName: null,
      bulkOrderLabel: null, designCode: null, color: null,
      isAssigned: false, assignedDate: null, qcStatus: "pending",
      receivedDate: null, qcDate: null, defects: [], makingCharge: null, deduction: null,
      payable: null, finishingStatus: "none", finishingAssignedDate: null,
      finishingCompletedDate: null, stock: null,
      ownerKind: null, ownerId: null, ownerLabel: null,
    });

    // 1. Sarees assigned to this weaver/loom (or everyone, in "all" mode) through production batches
    batches.forEach(b => {
      b.rows.forEach(r => {
        const rowIsLoom = r.recipientType === "factoryLoom";
        const belongs = isAll ? true : isLoom ? r.factoryLoomId === weaverId : r.weaverId === weaverId;
        if (!belongs || !r.sareeId) return;
        const row = byId.get(r.sareeId) ?? blank(r.sareeId);
        row.batchId = b.batchId;
        row.loomNumber = (isLoom || (isAll && rowIsLoom)) ? null : (r.weaverLoom ?? null);
        row.sareeTypeCode = r.sareeTypeCode ?? null;
        row.sareeTypeName = r.sareeTypeName ?? null;
        row.bulkOrderLabel = r.bulkOrderLabel ?? null;
        row.designCode = r.designCode ?? null;
        row.isAssigned = true;
        row.assignedDate = b.createdAt;
        if (isAll) {
          if (rowIsLoom) {
            row.ownerKind = "loom"; row.ownerId = r.factoryLoomId ?? null; row.ownerLabel = r.factoryLoomNumber ?? null;
          } else {
            row.ownerKind = "weaver"; row.ownerId = r.weaverId ?? null; row.ownerLabel = r.weaverName ?? null;
          }
        }
        // Fall back to the batch flag until a QC record exists for the saree
        if (r.qcPassed === true) row.qcStatus = "passed";
        else if (r.qcPassed === false) row.qcStatus = "defective";
        byId.set(r.sareeId, row);
      });
    });

    // 2. QC outcomes — authoritative over the batch flag
    qcRecords.forEach(q => {
      const row = byId.get(q.sareeId) ?? blank(q.sareeId);
      row.batchId = row.batchId ?? q.batchId;
      row.loomNumber = row.loomNumber ?? q.loomNumber;
      row.sareeTypeCode = row.sareeTypeCode ?? q.sareeTypeCode;
      row.sareeTypeName = row.sareeTypeName ?? q.sareeTypeName;
      row.bulkOrderLabel = row.bulkOrderLabel ?? q.bulkOrderLabel;
      row.qcStatus = q.result;
      row.receivedDate = q.receivedDate;
      row.qcDate = q.qcDate;
      row.defects = q.defects;
      row.makingCharge = q.makingCharge;
      row.deduction = q.deduction;
      row.payable = q.payable;
      if (isAll && !row.ownerKind) {
        if (q.factoryLoomId) {
          row.ownerKind = "loom"; row.ownerId = q.factoryLoomId; row.ownerLabel = q.factoryLoomNumber;
        } else if (q.weaverId) {
          row.ownerKind = "weaver"; row.ownerId = q.weaverId; row.ownerLabel = q.weaverName;
        }
      }
      byId.set(q.sareeId, row);
    });

    // 3. Stock / sales ledger entries for this weaver/loom (or everyone, in "all" mode)
    allStock.forEach(s => {
      const belongs = isAll ? true : isLoom
        ? s.origin === "factoryLoom" && s.factoryLoomId === weaverId
        : s.origin === "weaver" && s.weaverId === weaverId;
      if (!belongs) return;
      const row = byId.get(s.sareeId) ?? blank(s.sareeId);
      row.batchId = row.batchId ?? s.batchId;
      row.loomNumber = (isLoom || (isAll && s.origin === "factoryLoom")) ? null : (row.loomNumber ?? s.weaverLoom ?? null);
      row.sareeTypeCode = row.sareeTypeCode ?? s.sareeTypeCode;
      row.sareeTypeName = row.sareeTypeName ?? s.sareeTypeName;
      row.designCode = row.designCode ?? s.designCode ?? null;
      row.stock = s;
      if (isAll && !row.ownerKind) {
        if (s.origin === "factoryLoom") {
          row.ownerKind = "loom"; row.ownerId = s.factoryLoomId ?? null; row.ownerLabel = s.factoryLoomNumber ?? null;
        } else if (s.origin === "weaver") {
          row.ownerKind = "weaver"; row.ownerId = s.weaverId ?? null; row.ownerLabel = s.weaverName ?? null;
        }
      }
      byId.set(s.sareeId, row);
    });

    // 4. Finishing stage
    byId.forEach(row => {
      const ret = returns.find(r => r.sareeId === row.sareeId);
      const asg = assignments.find(a => a.sareeId === row.sareeId);
      if (ret) {
        row.finishingStatus = ret.condition === "damaged" ? "rejected" : "completed";
        row.finishingCompletedDate = ret.receivedDate;
        row.finishingAssignedDate = asg?.assignedDate ?? null;
      } else if (asg && asg.status === "awaiting-return") {
        row.finishingStatus = "in-finishing";
        row.finishingAssignedDate = asg.assignedDate;
      } else if (readySarees.some(s => s.id === row.sareeId) || row.qcStatus === "passed") {
        row.finishingStatus = "pending";
      }
    });

    // 5. Body colour comes from the design library entry for the saree's design
    byId.forEach(row => {
      row.color = row.designCode ? (getDesign(row.designCode)?.color || null) : null;
    });

    return [...byId.values()];
  }, [batches, qcRecords, allStock, returns, assignments, readySarees, weaverId, isLoom, isAll, getDesign]);

  // ── Tab membership ──────────────────────────────────────────────────────────
  const inTab = (r: WeaverSareeRow, t: TabKey) => {
    switch (t) {
      case "assigned": return r.isAssigned;
      case "produced": return r.stock !== null && r.stock.origin !== "external";
      case "qcpassed": return r.qcStatus === "passed";
      case "semi": return r.qcStatus === "semi";
      case "defective": return r.qcStatus === "defective";
      case "finishing": return r.finishingStatus === "completed";
      case "sold": return r.stock !== null && r.stock.origin !== "external" && isSold(r.stock);
      case "outstanding": return r.stock !== null && r.stock.origin !== "external" && isOutstanding(r.stock);
      case "shortage": return !!r.bulkOrderLabel && (r.qcStatus === "defective" || r.finishingStatus === "rejected");
      case "external": return r.stock !== null && r.stock.origin === "external";
    }
  };

  // ── Filter options, derived from the rows actually available ────────────────
  const opts = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      ["all", ...Array.from(new Set(vals.filter((v): v is string => !!v))).sort()];
    return {
      batch: uniq(rows.map(r => r.batchId)),
      loom: uniq(rows.map(r => (r.loomNumber != null ? `Loom ${r.loomNumber}` : null))),
      order: uniq(rows.map(r => r.bulkOrderLabel ?? (r.isAssigned ? "General Stock" : null))),
      type: uniq(rows.map(r => (r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : null))),
      color: uniq(rows.map(r => r.color)),
      qc: ["all", "QC Passed", "Semi-Approved", "Defective", "In Production"],
      finishing: ["all", "Completed", "In Finishing", "Not Assigned", "Rejected"],
      ownerWeaver: uniq(rows.filter(r => r.ownerKind === "weaver").map(r => r.ownerLabel)),
      ownerLoom: uniq(rows.filter(r => r.ownerKind === "loom").map(r => r.ownerLabel)),
      supplier: uniq(rows.filter(r => r.stock?.origin === "external").map(r => r.stock?.supplier ?? null)),
      purchaseOrder: uniq(rows.filter(r => r.stock?.origin === "external").map(r => r.stock?.purchaseId ?? null)),
    };
  }, [rows]);

  // Purchase orders belonging only to the currently selected supplier (cascading filter).
  const supplierPoOpts = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      ["all", ...Array.from(new Set(vals.filter((v): v is string => !!v))).sort()];
    if (fSupplier === "all") return opts.purchaseOrder;
    return uniq(rows.filter(r => r.stock?.origin === "external" && r.stock?.supplier === fSupplier)
      .map(r => r.stock?.purchaseId ?? null));
  }, [rows, fSupplier, opts.purchaseOrder]);

  // Serial numbers within the selected purchase order — only meaningful once a
  // single PO is chosen, so the dropdown itself only appears then.
  const poSerialOpts = useMemo(() => {
    if (fPurchaseOrder === "all") return ["all"];
    const uniq = (vals: (string | null)[]) =>
      ["all", ...Array.from(new Set(vals.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
    return uniq(rows.filter(r => r.stock?.origin === "external" && r.stock?.purchaseId === fPurchaseOrder)
      .map(r => externalSerialOf(r.sareeId)));
  }, [rows, fPurchaseOrder]);

  // Loom numbers belonging only to the currently selected weaver (for the cascading loom filter).
  const weaverLoomOpts = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      ["all", ...Array.from(new Set(vals.filter((v): v is string => !!v))).sort()];
    if (!isAll || fOwnerWeaver === "all") return ["all"];
    return uniq(rows.filter(r => r.ownerKind === "weaver" && r.ownerLabel === fOwnerWeaver)
      .map(r => (r.loomNumber != null ? `Loom ${r.loomNumber}` : null)));
  }, [rows, isAll, fOwnerWeaver]);

  const matchesSearch = (r: WeaverSareeRow) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      r.sareeId, r.batchId, r.sareeTypeCode, r.sareeTypeName, r.color, r.bulkOrderLabel, r.ownerLabel,
      r.stock?.supplier, r.stock?.supplierLocation, r.stock?.invoiceNumber, r.stock?.purchaseId,
      r.stock?.origin === "external" ? externalSerialOf(r.sareeId) : null,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  };

  const passesFilters = (r: WeaverSareeRow) => {
    if (!matchesSearch(r)) return false;
    if (fBatch !== "all" && r.batchId !== fBatch) return false;
    if (fLoom !== "all" && (r.loomNumber == null || `Loom ${r.loomNumber}` !== fLoom)) return false;
    if (fOrder !== "all" && (r.bulkOrderLabel ?? (r.isAssigned ? "General Stock" : null)) !== fOrder) return false;
    if (fType !== "all") {
      const label = r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : null;
      if (label !== fType) return false;
    }
    if (fColor !== "all" && r.color !== fColor) return false;
    if (fQc !== "all" && QC_CFG[r.qcStatus].label !== fQc) return false;
    if (fFinishing !== "all" && FIN_CFG[r.finishingStatus].label !== fFinishing) return false;
    if (isAll && fOwnerWeaver !== "all" && (r.ownerKind !== "weaver" || r.ownerLabel !== fOwnerWeaver)) return false;
    if (isAll && fOwnerLoom !== "all" && (r.ownerKind !== "loom" || r.ownerLabel !== fOwnerLoom)) return false;
    if (fSupplier !== "all" && r.stock?.supplier !== fSupplier) return false;
    if (fPurchaseOrder !== "all" && r.stock?.purchaseId !== fPurchaseOrder) return false;
    if (fPurchaseOrder !== "all" && fSerial !== "all" && externalSerialOf(r.sareeId) !== fSerial) return false;
    return true;
  };

  const counts = useMemo(() => {
    const c = {} as Record<TabKey, number>;
    (["assigned", "produced", "qcpassed", "semi", "defective", "finishing", "sold", "outstanding", "shortage", "external"] as TabKey[])
      .forEach(t => {
        c[t] = rows.filter(r => inTab(r, t) && passesFilters(r) && matchesDateFilter(tabDate(r, t), dateFilter)).length;
      });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial]);

  const visible = useMemo(() => rows
    .filter(r => inTab(r, tab) && passesFilters(r) && matchesDateFilter(tabDate(r, tab), dateFilter))
    .sort((a, b) => {
      const da = tabDate(a, tab), db = tabDate(b, tab);
      if (da && db) return new Date(db).getTime() - new Date(da).getTime();
      return a.sareeId.localeCompare(b.sareeId);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, tab, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial]);

  // Pagination applies only to what's rendered — `visible` itself stays the full
  // filtered set so select-all and the parent's onVisibleChange (scan / bulk
  // actions) keep working across every matching row, not just the current page.
  const pag = usePagination(visible, 25);
  useEffect(() => { pag.setPage(1); }, [tab, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial]);
  const pageRows = pag.pageItems;

  // Keep the parent in sync with the currently visible rows (for Scan / bulk actions), without looping.
  const onVisibleChangeRef = useRef(onVisibleChange);
  onVisibleChangeRef.current = onVisibleChange;
  useEffect(() => {
    onVisibleChangeRef.current?.(visible);
  }, [visible]);

  const TABS: { key: TabKey; label: string; color: string }[] = [
    { key: "assigned", label: "Assigned", color: T.royalBurgundy },
    { key: "produced", label: "Produced", color: T.luxuryBrown },
    { key: "qcpassed", label: "QC Passed", color: T.green },
    { key: "semi", label: "Semi-Approved", color: T.antiqueGold },
    { key: "defective", label: "Defective", color: T.crimson },
    { key: "finishing", label: "Finishing Completed", color: T.purple },
    { key: "sold", label: "Sold", color: T.blue },
    { key: "outstanding", label: "Outstanding", color: T.orange },
    { key: "shortage", label: "Shortage Sarees", color: T.crimson },
    ...(isAll ? [{ key: "external" as TabKey, label: "External Purchases", color: T.taupe }] : []),
  ];

  const filtersActive = search.trim() !== "" || fBatch !== "all" || fLoom !== "all" || fOrder !== "all"
    || fType !== "all" || fColor !== "all" || fQc !== "all" || fFinishing !== "all"
    || fOwnerWeaver !== "all" || fOwnerLoom !== "all" || fSupplier !== "all" || fPurchaseOrder !== "all"
    || fSerial !== "all" || dateFilter.mode !== "all";

  const resetFilters = () => {
    setSearch("");
    setFBatch("all"); setFLoom("all"); setFOrder("all");
    setFType("all"); setFColor("all"); setFQc("all"); setFFinishing("all");
    setFOwnerWeaver("all"); setFOwnerLoom("all"); setFSupplier("all"); setFPurchaseOrder("all"); setFSerial("all");
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  // Which optional columns this tab shows
  const canSeeMoney = useCanSeeMoney();
  const showMoney = canSeeMoney && (tab === "produced" || tab === "sold" || tab === "outstanding");
  const showQcMoney = canSeeMoney && (tab === "semi" || tab === "defective");
  const dateHeader =
    tab === "assigned" ? "Assigned On"
      : tab === "produced" ? "Received On"
        : tab === "qcpassed" ? "QC Passed On"
          : tab === "semi" ? "Semi-Approved On"
            : tab === "defective" ? "Marked Defective On"
              : tab === "finishing" ? "Finishing Completed On"
                : tab === "sold" ? "Sold On"
                  : tab === "shortage" ? "Rejected On"
                    : tab === "external" ? "Purchase Date"
                      : "In Stock Since";

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "8px 16px", borderRadius: 99, fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                background: on ? t.color : "#FFFFFF", color: on ? "#FFFDF9" : T.taupe,
                border: on ? "none" : `1.5px solid ${T.borderDef}`, transition: "all 0.16s",
              }}>
              {t.label}
              <span style={{
                fontFamily: F.mono, fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                color: on ? "#FFFDF9" : t.color,
              }}>{counts[t.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Date range */}
      <div style={{ marginBottom: 12 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Attribute filters */}
      <div style={{
        background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px",
        marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
        boxShadow: "0 2px 10px rgba(74,6,27,0.05)"
      }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Saree ID, batch, type, colour, weaver…"
            style={{ width: "100%", padding: "9px 12px 9px 38px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {isExternalTab ? (
          <>
            <Select label="Supplier" value={fSupplier} options={opts.supplier}
              onChange={v => { setFSupplier(v); setFPurchaseOrder("all"); }} />
            <Select label="Purchase Order" value={fPurchaseOrder} options={supplierPoOpts}
              onChange={v => { setFPurchaseOrder(v); setFSerial("all"); }} />
            {fPurchaseOrder !== "all" && (
              <Select label="Serial No." value={fSerial} options={poSerialOpts} onChange={setFSerial} />
            )}
            <Select label="Saree Type" value={fType} options={opts.type} onChange={setFType} />
            <Select label="Colour" value={fColor} options={opts.color} onChange={setFColor} />
          </>
        ) : (
          <>
            <Select label="Batch" value={fBatch} options={opts.batch} onChange={setFBatch} />
            {!isLoom && !isAll && <Select label="Loom" value={fLoom} options={opts.loom} onChange={setFLoom} />}
            {isAll && (
              <Select label="Weaver" value={fOwnerWeaver} options={opts.ownerWeaver}
                onChange={v => { setFOwnerWeaver(v); setFLoom("all"); }} />
            )}
            {isAll && fOwnerWeaver !== "all" && (
              <Select label="Weaver's Loom" value={fLoom} options={weaverLoomOpts} onChange={setFLoom} />
            )}
            {isAll && <Select label="Factory Loom" value={fOwnerLoom} options={opts.ownerLoom} onChange={setFOwnerLoom} />}
            <Select label="Bulk Order" value={fOrder} options={opts.order} onChange={setFOrder} />
            <Select label="Saree Type" value={fType} options={opts.type} onChange={setFType} />
            <Select label="Colour" value={fColor} options={opts.color} onChange={setFColor} />
            <Select label="QC Status" value={fQc} options={opts.qc} onChange={setFQc} />
            <Select label="Finishing" value={fFinishing} options={opts.finishing} onChange={setFFinishing} />
          </>
        )}

        {filtersActive && (
          <button onClick={resetFilters}
            style={{
              height: 38, padding: "0 14px", background: "transparent", color: T.royalBurgundy,
              border: `1px solid ${T.borderDef}`, borderRadius: 10, fontFamily: F.ui,
              fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto"
            }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div style={{
          background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe,
          fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}`,
        }}>
          No sarees match this view{filtersActive ? " with the current filters." : "."}
        </div>
      ) : isExternalTab ? (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
            <thead>
              <tr style={{ background: T.warmCream }}>
                <th style={th}>Saree ID</th>
                <th style={th}>Serial No.</th>
                <th style={th}>Supplier</th>
                <th style={th}>Purchase Order</th>
                <th style={th}>Location</th>
                <th style={th}>Saree Type</th>
                <th style={th}>Colour</th>
                <th style={th}>Weight</th>
                <th style={th}>Purchase Date</th>
                {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Cost Price</th>}
                {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Sell %</th>}
                {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Final Amount</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={r.sareeId} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)" }}>
                  <td style={tdMono}>{r.sareeId}</td>
                  <td style={{ ...td, fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>
                    {externalSerialOf(r.sareeId) || "—"}
                  </td>
                  <td style={{ ...td, fontWeight: 600, color: T.royalBurgundy }}>{r.stock?.supplier || "—"}</td>
                  <td style={{ ...td, fontFamily: F.mono, fontSize: 12 }}>{r.stock?.purchaseId || "—"}</td>
                  <td style={td}>{r.stock?.supplierLocation || "—"}</td>
                  <td style={td}>{r.sareeTypeName || "—"}</td>
                  <td style={td}>{r.color || <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>}</td>
                  <td style={td}>{r.stock?.weight || "—"}</td>
                  <td style={td}>{fmtDate(r.stock?.purchaseDate)}</td>
                  {canSeeMoney && (
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                      {r.stock ? inr(r.stock.costPrice) : "—"}
                    </td>
                  )}
                  {canSeeMoney && (
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                      {r.stock ? `${r.stock.sellPercent}%` : "—"}
                    </td>
                  )}
                  {canSeeMoney && (
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                      {r.stock ? inr(r.stock.finalAmount) : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div style={{ padding: "0 14px" }}>
            <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
              onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
          </div>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ background: T.warmCream }}>
                {selectable && (
                  <th style={{ ...th, width: 34 }}>
                    <input type="checkbox"
                      checked={visible.length > 0 && visible.every(r => selectedIds?.has(r.sareeId))}
                      onChange={() => onToggleAll?.(visible.map(r => r.sareeId))}
                      style={{ cursor: "pointer" }} />
                  </th>
                )}
                <th style={th}>Saree ID</th>
                <th style={th}>Batch</th>
                {isAll && <th style={th}>Weaver / Loom</th>}
                {!isLoom && <th style={th}>Loom</th>}
                <th style={th}>Saree Type</th>
                <th style={th}>Colour</th>
                <th style={th}>Bulk Order</th>
                <th style={th}>{dateHeader}</th>
                {tab === "sold" && <><th style={th}>Channel</th><th style={th}>Customer</th></>}
                {tab === "outstanding" && <th style={th}>Days In Stock</th>}
                {(tab === "semi" || tab === "defective") && <th style={th}>Defects</th>}
                <th style={th}>QC Status</th>
                <th style={th}>Finishing</th>
                <th style={th}>Finishing Completed</th>
                {showQcMoney && <>
                  <th style={{ ...th, textAlign: "right" }}>Making Charge</th>
                  <th style={{ ...th, textAlign: "right" }}>Deducted</th>
                  <th style={{ ...th, textAlign: "right" }}>Weaver Earns</th>
                </>}
                {showMoney && <th style={{ ...th, textAlign: "right" }}>{tab === "sold" ? "Sold For" : "Sell Price"}</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => {
                const qc = QC_CFG[r.qcStatus];
                const fin = FIN_CFG[r.finishingStatus];
                const typeLabel = r.sareeTypeCode
                  ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}`
                  : "—";
                return (
                  <tr key={r.sareeId} style={{ background: selectedIds?.has(r.sareeId) ? "rgba(110,15,45,0.05)" : idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)" }}>
                    {selectable && (
                      <td style={td}>
                        <input type="checkbox" checked={!!selectedIds?.has(r.sareeId)}
                          onChange={() => onToggleRow?.(r.sareeId)} style={{ cursor: "pointer" }} />
                      </td>
                    )}
                    <td style={tdMono}>{r.sareeId}</td>
                    <td style={tdMono}>{r.batchId || "—"}</td>
                    {isAll && (
                      <td style={{ ...td, fontWeight: 600, color: r.ownerKind === "loom" ? T.antiqueGold : T.royalBurgundy }}>
                        {r.ownerLabel || "—"}
                      </td>
                    )}
                    {!isLoom && (
                      <td style={{ ...td, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 700 }}>
                        {r.loomNumber != null ? `L${r.loomNumber}` : "—"}
                      </td>
                    )}
                    <td style={td}>{typeLabel}</td>
                    <td style={td}>
                      {r.color
                        ? r.color
                        : <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>}
                    </td>
                    <td style={{ ...td, color: r.bulkOrderLabel ? T.royalBurgundy : T.green, fontWeight: 600 }}>
                      {r.bulkOrderLabel || "General Stock"}
                    </td>
                    <td style={td}>{fmtDate(tabDate(r, tab))}</td>

                    {tab === "sold" && <>
                      <td style={td}>
                        {r.stock?.sale
                          ? <Chip label={r.stock.sale.channel === "retail" ? "Retail" : "Wholesale"}
                              color={r.stock.sale.channel === "retail" ? T.blue : T.purple} />
                          : "—"}
                      </td>
                      <td style={td}>{r.stock?.sale?.customer || "—"}</td>
                    </>}

                    {tab === "outstanding" && (
                      <td style={td}>
                        {r.stock
                          ? <Chip label={`${r.stock.ageDays} days`} color={AGE_COLOR[ageBucket(r.stock.ageDays)]} />
                          : "—"}
                      </td>
                    )}

                    {(tab === "semi" || tab === "defective") && (
                      <td style={td}>
                        {r.defects.length > 0
                          ? <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                              {r.defects.map(d => (
                                <span key={d} style={{
                                  fontFamily: F.ui, fontSize: 10.5, fontWeight: 600, color: qc.color,
                                  background: `${qc.color}1A`, borderRadius: 5, padding: "2px 7px",
                                }}>{d}</span>
                              ))}
                            </span>
                          : "—"}
                      </td>
                    )}

                    <td style={td}><Chip label={qc.label} color={qc.color} /></td>
                    <td style={td}>
                      {r.finishingStatus === "none"
                        ? <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>
                        : <Chip label={fin.label} color={fin.color} />}
                    </td>
                    <td style={td}>{fmtDate(r.finishingCompletedDate)}</td>

                    {showQcMoney && <>
                      <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                        {r.makingCharge != null ? inr(r.makingCharge) : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, color: T.crimson, fontWeight: 700 }}>
                        {r.deduction != null ? `− ${inr(r.deduction)}` : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: r.payable ? T.green : T.crimson }}>
                        {r.payable != null ? inr(r.payable) : "—"}
                      </td>
                    </>}

                    {showMoney && (
                      <td style={{
                        ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700,
                        color: tab === "sold" ? T.green : T.royalBurgundy,
                      }}>
                        {r.stock ? inr(tab === "sold" ? (r.stock.sale?.amount || 0) : r.stock.finalAmount) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          <div style={{ padding: "0 14px" }}>
            <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
              onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
          </div>
        </div>
      )}

      {/* Payment impact summary for the QC-deduction tabs */}
      {canSeeMoney && (tab === "semi" || tab === "defective") && visible.length > 0 && (
        <div style={{
          marginTop: 12, display: "flex", gap: 20, flexWrap: "wrap",
          background: tab === "defective" ? "rgba(192,57,43,0.06)" : "rgba(200,155,71,0.08)",
          border: `1px solid ${tab === "defective" ? "rgba(192,57,43,0.20)" : T.borderGold}`,
          borderRadius: 12, padding: "14px 18px",
        }}>
          {[
            { l: "Sarees", v: String(visible.length), c: T.luxuryBrown },
            { l: "Making charge", v: inr(visible.reduce((a, r) => a + (r.makingCharge || 0), 0)), c: T.luxuryBrown },
            { l: "Deducted", v: inr(visible.reduce((a, r) => a + (r.deduction || 0), 0)), c: T.crimson },
            { l: "Weaver earns", v: inr(visible.reduce((a, r) => a + (r.payable || 0), 0)), c: T.green },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>{s.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: s.c, marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, alignSelf: "center", maxWidth: 320, lineHeight: 1.5 }}>
            {tab === "defective"
              ? (isAll
                  ? `Defective sarees carry no making-charge credit — the full charge is written off.`
                  : isLoom
                    ? `Defective sarees from ${weaverName} carry no making-charge credit — the full charge is written off.`
                    : `${weaverName} is not paid for defective sarees — the full making charge is withheld.`)
              : `Semi-approved sarees carry the deduction entered by worker staff at QC.`}
          </div>
        </div>
      )}
    </div>
  );
}
