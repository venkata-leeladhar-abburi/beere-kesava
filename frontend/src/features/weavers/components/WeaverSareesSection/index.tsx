import { useEffect, useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { isSold, isOutstanding } from "@/features/customers";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { usePagination } from "../../../../shared/ui/DataPagination";
import { useCanSeeMoney } from "../../../../shared/ui/MoneyAccess";
import { T, F } from "./theme";
import { WeaverSareeRow, TabKey, tabDate } from "./types";
import { inr, externalSerialOf, QC_CFG, FIN_CFG } from "./utils";
import { ExternalSareesTable } from "./ExternalSareesTable";
import { Button, SearchInput } from "../../../../shared/ui/primitives";
import { MainSareesTable } from "./MainSareesTable";
import { Select, TabsBar } from "./WeaverSareesControls";
import { useWeaverSareeRows } from "./useWeaverSareeRows";
import { useExternalPurchaseRows } from "./useExternalPurchaseRows";
import { usePrintSareeTags, type SareeTagData } from "./SareeTagPrint";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";





/** Saree Type filter label — the ST- code where there is one (in-house
 * production), otherwise the free-text type an external purchase recorded. */
function sareeTypeLabel(r: WeaverSareeRow): string | null {
  if (r.sareeTypeCode) return `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}`;
  return r.sareeTypeName || null;
}

const VALID_TAB_KEYS: TabKey[] = [
  "assigned", "produced", "qcpassed", "semi", "defective",
  "finishing", "sold", "outstanding", "shortage", "external", "dispatched",
];

function loadPersistedTab(persistKey: string | undefined): TabKey {
  if (!persistKey) return "assigned";
  try {
    const saved = sessionStorage.getItem(`bk-saree-tab:${persistKey}`);
    return VALID_TAB_KEYS.includes(saved as TabKey) ? (saved as TabKey) : "assigned";
  } catch {
    return "assigned";
  }
}

// ── Main section ─────────────────────────────────────────────────────────────
export function WeaverSareesSection({ weaverId, weaverName, ownerType = "weaver", selectable = false, selectedIds, onToggleRow, onToggleAll, onVisibleChange, persistKey }: {
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
  /** When set, the active tab survives a refresh (sessionStorage, scoped to
   *  this key) instead of always reopening on "Assigned". Omit it for
   *  transient hosts (a picker modal, a drawer) where starting fresh every
   *  time is the right behavior. */
  persistKey?: string;
}) {
  const isLoom = ownerType === "loom";
  const isAll = ownerType === "all";
  const ledgerRows = useWeaverSareeRows({ weaverId, isLoom, isAll });
  // External purchases are only listed in cross-weaver ("all") mode, which is
  // the only mode that shows the External Purchases tab.
  const { rows: externalRows, isLoading: externalLoading } = useExternalPurchaseRows(isAll);
  const rows = useMemo(
    // The stock ledger has no external sarees of its own; drop any that a
    // legacy row still claims so a piece can't be listed twice.
    () => (isAll ? [...ledgerRows.filter(r => r.stock?.origin !== "external"), ...externalRows] : ledgerRows),
    [isAll, ledgerRows, externalRows],
  );
  const printSareeTags = usePrintSareeTags();
  // The tag itself needs the weaver's full name and a print date, which
  // WeaverSareeRow doesn't carry directly: `ownerLabel` only exists in "all"
  // (cross-weaver) mode, and single-weaver/loom mode instead gets the name
  // via the `weaverName` prop.
  const toTagData = (r: WeaverSareeRow): SareeTagData => ({
    ...r,
    weaverName: isLoom ? null : (isAll ? r.ownerLabel : weaverName) ?? null,
    date: r.qcDate ?? r.receivedDate ?? r.assignedDate ?? null,
  });
  const printTags = (rs: WeaverSareeRow[]) => printSareeTags(rs.map(toTagData));

  const [tab, setTabState] = useState<TabKey>(() => loadPersistedTab(persistKey));
  const setTab = (t: TabKey) => {
    setTabState(t);
    if (!persistKey) return;
    try {
      sessionStorage.setItem(`bk-saree-tab:${persistKey}`, t);
    } catch {
      // sessionStorage unavailable (private browsing) — losing the saved
      // tab is harmless, so fail silently rather than break tab switching.
    }
  };
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
  const [fPayment, setFPayment] = useState("all");

  const isExternalTab = tab === "external";

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
      case "dispatched": return r.dispatched;
    }
  };

  // ── Filter options, derived from the rows actually available ────────────────
  // Saree Type and Colour are the only two dropdowns shown on *both* the
  // external tab and the production tabs, so their options are narrowed to
  // whichever side is on screen — otherwise the external tab offered ST- codes
  // no purchased piece can ever carry (and vice versa), and picking one
  // emptied the table with no way to tell why.
  const opts = useMemo(() => {
    const uniq = (vals: (string | null)[]) =>
      ["all", ...Array.from(new Set(vals.filter((v): v is string => !!v))).sort()];
    const externalRowsOnly = rows.filter(r => r.stock?.origin === "external");
    const productionRows = rows.filter(r => r.stock?.origin !== "external");
    const typeSource = isExternalTab ? externalRowsOnly : productionRows;
    return {
      batch: uniq(productionRows.map(r => r.batchId)),
      loom: uniq(productionRows.map(r => (r.loomNumber != null ? `Loom ${r.loomNumber}` : null))),
      order: uniq(productionRows.map(r => r.bulkOrderLabel ?? (r.isAssigned ? "General Stock" : null))),
      // External purchases record a free-text saree type with no ST- code, so
      // the plain name is the label there — without this they could never
      // match the Saree Type filter and the dropdown looked broken.
      type: uniq(typeSource.map(sareeTypeLabel)),
      color: uniq(typeSource.map(r => r.color)),
      qc: ["all", "QC Passed", "Semi-Approved", "Defective", "In Production"],
      finishing: ["all", "Completed", "In Finishing", "Not Assigned", "Rejected"],
      ownerWeaver: uniq(productionRows.filter(r => r.ownerKind === "weaver").map(r => r.ownerLabel)),
      ownerLoom: uniq(productionRows.filter(r => r.ownerKind === "loom").map(r => r.ownerLabel)),
      supplier: uniq(externalRowsOnly.map(r => r.stock?.supplier ?? null)),
      purchaseOrder: uniq(externalRowsOnly.map(r => r.stock?.purchaseId ?? null)),
    };
  }, [rows, isExternalTab]);

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

  // Saree Type and Colour are the one pair of controls shared by both filter
  // bars, and the two sides have disjoint vocabularies (ST- codes on the
  // production side, the free text an external purchase records on the other).
  // Carrying a selection across that boundary can only ever match nothing, so
  // it is dropped on the way over rather than silently emptying the table.
  useEffect(() => { setFType("all"); setFColor("all"); }, [isExternalTab]);

  // A filter still holding a value that no longer exists in its options — the
  // supplier whose last purchase was deleted, the batch that finished while
  // the page was open — filters everything out while the dropdown shows a
  // choice that is no longer offered. Drop those back to "all" as the options
  // change so the table can never be emptied by an unselectable value.
  useEffect(() => {
    if (!opts.supplier.includes(fSupplier)) setFSupplier("all");
    if (!opts.batch.includes(fBatch)) setFBatch("all");
    if (!opts.order.includes(fOrder)) setFOrder("all");
    if (!opts.ownerWeaver.includes(fOwnerWeaver)) setFOwnerWeaver("all");
    if (!opts.ownerLoom.includes(fOwnerLoom)) setFOwnerLoom("all");
  }, [opts, fSupplier, fBatch, fOrder, fOwnerWeaver, fOwnerLoom]);

  useEffect(() => {
    if (!supplierPoOpts.includes(fPurchaseOrder)) setFPurchaseOrder("all");
  }, [supplierPoOpts, fPurchaseOrder]);

  useEffect(() => {
    if (!poSerialOpts.includes(fSerial)) setFSerial("all");
  }, [poSerialOpts, fSerial]);

  useEffect(() => {
    const looms = isAll ? weaverLoomOpts : opts.loom;
    if (!looms.includes(fLoom)) setFLoom("all");
  }, [isAll, weaverLoomOpts, opts.loom, fLoom]);

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

  // A filter only ever applies to the tab whose filter bar actually shows it.
  //
  // The two filter bars are disjoint — supplier / purchase order / serial /
  // payment belong to External Purchases, batch / loom / owner / bulk order /
  // QC / finishing belong to the production tabs — but the state behind them
  // is shared and survives a tab switch. Applying all of it everywhere meant a
  // supplier picked on External Purchases silently emptied every production
  // tab (and a QC status picked on a production tab silently emptied External
  // Purchases), with no control on screen to undo it. Scoping by tab is what
  // makes the tab counts agree with the rows the table actually lists.
  const passesFilters = (r: WeaverSareeRow, t: TabKey) => {
    if (!matchesSearch(r)) return false;
    // Shown on both filter bars.
    if (fType !== "all" && sareeTypeLabel(r) !== fType) return false;
    if (fColor !== "all" && r.color !== fColor) return false;

    if (t === "external") {
      if (fSupplier !== "all" && r.stock?.supplier !== fSupplier) return false;
      if (fPurchaseOrder !== "all" && r.stock?.purchaseId !== fPurchaseOrder) return false;
      if (fPurchaseOrder !== "all" && fSerial !== "all" && externalSerialOf(r.sareeId) !== fSerial) return false;
      if (fPayment !== "all" && (r.external?.paymentStatus ?? null) !== fPayment) return false;
      return true;
    }

    if (fBatch !== "all" && r.batchId !== fBatch) return false;
    if (fLoom !== "all" && (r.loomNumber == null || `Loom ${r.loomNumber}` !== fLoom)) return false;
    if (fOrder !== "all" && (r.bulkOrderLabel ?? (r.isAssigned ? "General Stock" : null)) !== fOrder) return false;
    if (fQc !== "all" && QC_CFG[r.qcStatus].label !== fQc) return false;
    if (fFinishing !== "all" && FIN_CFG[r.finishingStatus].label !== fFinishing) return false;
    if (isAll && fOwnerWeaver !== "all" && (r.ownerKind !== "weaver" || r.ownerLabel !== fOwnerWeaver)) return false;
    if (isAll && fOwnerLoom !== "all" && (r.ownerKind !== "loom" || r.ownerLabel !== fOwnerLoom)) return false;
    return true;
  };

  // Selectable mode (InventoryPage's main table, the Raise Quotation / Dispatch
  // pickers) is exclusively for picking sarees to dispatch — a saree already on
  // a dispatch record has nothing to offer there, so it's dropped from every
  // tab except "Dispatched" itself (kept as an audit view, not a pick list).
  // Read-only usages (production audit, weaver drawer) are unaffected.
  const rowsForTab = (t: TabKey) => (selectable && t !== "dispatched") ? rows.filter(r => !r.dispatched) : rows;

  const counts = useMemo(() => {
    const c = {} as Record<TabKey, number>;
    (["assigned", "produced", "qcpassed", "semi", "defective", "finishing", "sold", "outstanding", "shortage", "external", "dispatched"] as TabKey[])
      .forEach(t => {
        c[t] = rowsForTab(t).filter(r => inTab(r, t) && passesFilters(r, t) && matchesDateFilter(tabDate(r, t), dateFilter)).length;
      });
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, selectable, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial, fPayment]);

  const visible = useMemo(() => rowsForTab(tab)
    .filter(r => inTab(r, tab) && passesFilters(r, tab) && matchesDateFilter(tabDate(r, tab), dateFilter))
    .sort((a, b) => {
      // Selected rows (picked via Scan or a checkbox) float to the top —
      // otherwise scanning a saree deep in a long list selects it with no
      // visible feedback unless the user already happens to be on the right
      // page. Everything else keeps its normal date/id ordering.
      const aSel = selectedIds?.has(a.sareeId) ? 1 : 0;
      const bSel = selectedIds?.has(b.sareeId) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      const da = tabDate(a, tab), db = tabDate(b, tab);
      if (da && db) return new Date(db).getTime() - new Date(da).getTime();
      return a.sareeId.localeCompare(b.sareeId);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, selectable, tab, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial, fPayment, selectedIds]);

  // Pagination applies only to what's rendered — `visible` itself stays the full
  // filtered set so select-all and the parent's onVisibleChange (scan / bulk
  // actions) keep working across every matching row, not just the current page.
  const pag = usePagination(visible, 10);
  // `pag` (from usePagination) is a new object every render, so it can't be
  // added as a dep without resetting the page on every unrelated render;
  // only its setPage function (stable across renders) is actually needed here.
  // Also jumps to page 1 on a selection change — selected rows sort to the
  // top of `visible` above, so this is what actually makes a freshly-scanned
  // saree visible without a manual page flip when it wasn't already on the
  // current page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pag.setPage(1); }, [tab, dateFilter, search, fBatch, fLoom, fOrder, fType, fColor, fQc, fFinishing, fOwnerWeaver, fOwnerLoom, fSupplier, fPurchaseOrder, fSerial, fPayment, selectedIds]);
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
    { key: "dispatched", label: "Dispatched", color: T.taupe },
    ...(isAll ? [{ key: "external" as TabKey, label: "External Purchases", color: T.taupe }] : []),
  ];

  // Only counts filters that are on screen for this tab — the ones passesFilters
  // is actually applying — so "Clear filters" never appears for a control the
  // user cannot see and the empty state doesn't blame invisible filters.
  const filtersActive = search.trim() !== "" || dateFilter.mode !== "all"
    || fType !== "all" || fColor !== "all"
    || (isExternalTab
      ? (fSupplier !== "all" || fPurchaseOrder !== "all" || fSerial !== "all" || fPayment !== "all")
      : (fBatch !== "all" || fLoom !== "all" || fOrder !== "all" || fQc !== "all" || fFinishing !== "all"
        || fOwnerWeaver !== "all" || fOwnerLoom !== "all"));

  const resetFilters = () => {
    setSearch("");
    setFBatch("all"); setFLoom("all"); setFOrder("all");
    setFType("all"); setFColor("all"); setFQc("all"); setFFinishing("all");
    setFOwnerWeaver("all"); setFOwnerLoom("all"); setFSupplier("all"); setFPurchaseOrder("all"); setFSerial("all");
    setFPayment("all");
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
                      : tab === "dispatched" ? "Dispatched On"
                        : "In Stock Since";
  const categoryTabGroup = {
    id: "tabCategory",
    label: "Category / View",
    value: tab,
    defaultValue: "assigned",
    options: TABS.map(t => ({
      value: t.key,
      label: `${t.label} (${counts[t.key] ?? 0})`,
    })),
    onChange: (v: string) => setTab(v as TabKey),
  };

  const mobileFilterGroups = [
    categoryTabGroup,
    {
      id: "time",
      label: "Time Period",
      value: dateFilter.mode,
      defaultValue: "all",
      options: [
        { value: "all", label: "All Time" },
        { value: "day", label: "Specific Date" },
        { value: "range", label: "Date Range" },
        { value: "month", label: "Monthly" },
        { value: "year", label: "Yearly" },
      ],
      onChange: (m: string) => {
        const mode = m as DateFilterState["mode"];
        if (mode === "day") setDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
        else if (mode === "month") setDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
        else if (mode === "year") setDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
        else setDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
      },
    },
    ...(isExternalTab ? [
      {
        id: "supplier",
        label: "Supplier",
        value: fSupplier,
        options: opts.supplier.map(s => ({ value: s, label: s === "all" ? "All Suppliers" : s })),
        onChange: (v: string) => { setFSupplier(v); setFPurchaseOrder("all"); setFSerial("all"); },
      },
      {
        id: "po",
        label: "Purchase Order",
        value: fPurchaseOrder,
        options: supplierPoOpts.map(p => ({ value: p, label: p === "all" ? "All POs" : p })),
        onChange: (v: string) => { setFPurchaseOrder(v); setFSerial("all"); },
      },
      {
        id: "type",
        label: "Saree Type",
        value: fType,
        options: opts.type.map(t => ({ value: t, label: t === "all" ? "All Types" : t })),
        onChange: setFType,
      },
      {
        id: "color",
        label: "Colour",
        value: fColor,
        options: opts.color.map(c => ({ value: c, label: c === "all" ? "All Colours" : c })),
        onChange: setFColor,
      },
      {
        id: "payment",
        label: "Payment",
        value: fPayment,
        options: ["all", "Paid", "Partial", "Pending"].map(p => ({ value: p, label: p === "all" ? "All Payments" : p })),
        onChange: setFPayment,
      },
    ] : [
      {
        id: "batch",
        label: "Batch",
        value: fBatch,
        options: opts.batch.map(b => ({ value: b, label: b === "all" ? "All Batches" : b })),
        onChange: setFBatch,
      },
      ...(isAll ? [{
        id: "weaver",
        label: "Weaver",
        value: fOwnerWeaver,
        options: opts.ownerWeaver.map(w => ({ value: w, label: w === "all" ? "All Weavers" : w })),
        onChange: (v: string) => { setFOwnerWeaver(v); setFLoom("all"); },
      }] : []),
      {
        id: "order",
        label: "Bulk Order",
        value: fOrder,
        options: opts.order.map(o => ({ value: o, label: o === "all" ? "All Orders" : o })),
        onChange: setFOrder,
      },
      {
        id: "type",
        label: "Saree Type",
        value: fType,
        options: opts.type.map(t => ({ value: t, label: t === "all" ? "All Types" : t })),
        onChange: setFType,
      },
      {
        id: "color",
        label: "Colour",
        value: fColor,
        options: opts.color.map(c => ({ value: c, label: c === "all" ? "All Colours" : c })),
        onChange: setFColor,
      },
      {
        id: "qc",
        label: "QC Status",
        value: fQc,
        options: opts.qc.map(q => ({ value: q, label: q === "all" ? "All QC Statuses" : q })),
        onChange: setFQc,
      },
      {
        id: "finishing",
        label: "Finishing",
        value: fFinishing,
        options: opts.finishing.map(f => ({ value: f, label: f === "all" ? "All Finishing Statuses" : f })),
        onChange: setFFinishing,
      },
    ]),
  ];

  return (
    <div>
      {/* Desktop Tabs & Date range (Hidden on mobile where Category tabs are inside the filter bar) */}
      <div className="hidden md:block">
        <TabsBar
          TABS={TABS}
          tab={tab}
          setTab={setTab}
          counts={counts}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      </div>

      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search saree ID, batch, type, weaver…"
          filterGroups={mobileFilterGroups}
          onResetAll={resetFilters}
        />
      </div>

      {/* Desktop Attribute filters */}
      <div className="hidden md:flex" style={{
        background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px",
        marginBottom: 24, gap: 14, alignItems: "center", flexWrap: "wrap",
        boxShadow: "0 2px 10px rgba(74,6,27,0.05)"
      }}>
        <div style={{ flex: "1 1 280px" }}>
          <SearchInput
            aria-label="Search saree ID, batch, type, colour, weaver"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Saree ID, batch, type, colour, weaver…"
          />
        </div>

        {isExternalTab ? (
          <>
            <Select label="Supplier" value={fSupplier} options={opts.supplier}
              onChange={v => { setFSupplier(v); setFPurchaseOrder("all"); setFSerial("all"); }} />
            <Select label="Purchase Order" value={fPurchaseOrder} options={supplierPoOpts}
              onChange={v => { setFPurchaseOrder(v); setFSerial("all"); }} />
            {fPurchaseOrder !== "all" && (
              <Select label="Serial No." value={fSerial} options={poSerialOpts} onChange={setFSerial} />
            )}
            <Select label="Saree Type" value={fType} options={opts.type} onChange={setFType} />
            <Select label="Colour" value={fColor} options={opts.color} onChange={setFColor} />
            <Select label="Payment" value={fPayment} options={["all", "Paid", "Partial", "Pending"]} onChange={setFPayment} />
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

        <div className="ml-auto flex items-center gap-2">
          {selectable && selectedIds && selectedIds.size > 0 && (
            <Button
              onClick={() => printTags(rows.filter(r => selectedIds.has(r.sareeId)))}
              variant="secondary"
              size="sm"
              iconLeft={Printer}
            >
              Print Tags ({selectedIds.size})
            </Button>
          )}
          {filtersActive && (
            <Button onClick={resetFilters} variant="tertiary" size="sm">
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div style={{
          background: T.warmIvory, borderRadius: 16, padding: 24, textAlign: "center", color: T.taupe,
          fontFamily: F.ui, fontSize: 14, fontStyle: "italic", border: `1px solid ${T.borderDef}`,
        }}>
          {isExternalTab && externalLoading
            ? "Loading external purchases…"
            : `No sarees match this view${filtersActive ? " with the current filters." : "."}`}
        </div>
      ) : isExternalTab ? (
        <ExternalSareesTable pageRows={pageRows} canSeeMoney={canSeeMoney} pag={pag} responsive={false} />
      ) : (
        <MainSareesTable
          pageRows={pageRows}
          visible={visible}
          selectable={selectable}
          selectedIds={selectedIds}
          onToggleAll={onToggleAll}
          onToggleRow={onToggleRow}
          isAll={isAll}
          isLoom={isLoom}
          tab={tab}
          dateHeader={dateHeader}
          showQcMoney={showQcMoney}
          showMoney={showMoney}
          pag={pag}
          responsive={false}
          onPrintTag={r => printTags([r])}
        />
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
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>{s.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: s.c, marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
          <div className="max-w-[320px]" style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, alignSelf: "center", lineHeight: 1.5 }}>
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
