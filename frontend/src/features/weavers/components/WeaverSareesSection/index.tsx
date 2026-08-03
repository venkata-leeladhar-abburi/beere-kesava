import React, { useEffect, useMemo, useRef, useState } from "react";
import { isSold, isOutstanding } from "../../../customers/contexts/SalesContext";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { useCanSeeMoney } from "../../../../shared/ui/MoneyAccess";
import { Search } from "lucide-react";
import { T, F, th, td, tdMono } from "./theme";
import { WeaverSareeRow, FinishingStatus, TabKey, tabDate } from "./types";
import { inr, fmtDate, externalSerialOf, AGE_COLOR, QC_CFG, FIN_CFG } from "./utils";
import { ExternalSareesTable } from "./ExternalSareesTable";
import { MainSareesTable } from "./MainSareesTable";
import { Select, TabsBar } from "./WeaverSareesControls";
import { useWeaverSareeRows } from "./useWeaverSareeRows";

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
  const rows = useWeaverSareeRows({ weaverId, isLoom, isAll });

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
      {/* Tabs & Date range */}
      <TabsBar
        TABS={TABS}
        tab={tab}
        setTab={setTab}
        counts={counts}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

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
        <ExternalSareesTable pageRows={pageRows} canSeeMoney={canSeeMoney} pag={pag} />
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
