import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, LayoutGrid, AlignJustify, Printer } from "lucide-react";
import { C, F, card } from "./tokens";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { Button, Input } from "../../../../shared/ui/primitives";
import { rawMaterialsApi, GrnReceiptItem } from "../../../../shared/api/rawMaterials";
import { jariToReels } from "../../../../shared/lib/weightUnits";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { Modal } from "../../../../shared/ui/overlay";
import { GRNPrintView } from "./GRNSuccessPrint";
import type { ReconResult } from "@/lib/domain/status";

/** One received material line, as shown in the Materials column. */
export interface ReceiptMaterialLine {
  /** Structured per-line id (e.g. "GRN-SreeVignesh-004-002-1") — the same id printed on that line's barcode label. */
  itemCode: string;
  type: "Warp" | "Resham" | "Jari";
  name: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface ReceiptRecord {
  grnId: string;
  poRef: string;
  vendor: string;
  firmName: string;
  dateReceived: string;
  /** Structured per-material lines. Replaced a joined-then-reparsed string, which mangled any description containing the delimiter. */
  materials: ReceiptMaterialLine[];
  receivedBy: string;
  // Reconciliation result of a GRN receipt against its PO — lib/domain/status.ts's
  // `ReconResult` (Part D.1: found living inside `status` as "Match"/"Short"/
  // "Excess", not a lifecycle state, so it's its own typed column, not a StatusPill).
  status: ReconResult;
  /** The full receipt, when this row came from the database — lets the row open a real print-tags view. Undefined for locally-tracked rows that never hit the backend. */
  fullReceipt?: GrnReceiptItem;
}

const HIST_STATUS_CFG: Record<ReconResult, { label: string; color: string; bg: string }> = {
  match:  { label: "Match",  color: C.green, bg: "rgba(30,102,64,0.10)" },
  short:  { label: "Short",  color: C.gold,  bg: "rgba(196,146,58,0.14)" },
  excess: { label: "Excess", color: "#1565C0", bg: "rgba(21,101,192,0.10)" },
};

const MAT_COLOR: Record<ReceiptMaterialLine["type"], string> = {
  Warp: "#7A5010",
  Resham: "#7A5E1C",
  Jari: C.burg,
};

/** One spaced block per material: type, name + description, quantity, and the line's own GRN item code. */
function renderMaterialsSummary(lines: ReceiptMaterialLine[]) {
  if (lines.length === 0) return <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 260 }}>
      {lines.map(line => (
        <div key={line.itemCode} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: MAT_COLOR[line.type] }}>{line.type}</span>
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{line.name}</span>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>{line.quantity} {line.unit}</span>
          </div>
          {line.description && (
            <span style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }}>{line.description}</span>
          )}
          <span style={{ fontFamily: F.m, fontSize: 10.5, color: C.muted }}>{line.itemCode}</span>
        </div>
      ))}
    </div>
  );
}


interface ReceiptHistoryTableProps {
  receiptHistory?: ReceiptRecord[];
  compact?: boolean;
}

export function ReceiptHistoryTable({ receiptHistory: propReceiptHistory, compact = false }: ReceiptHistoryTableProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [tagsRecord, setTagsRecord] = useState<ReceiptRecord | null>(null);

  const { data: rawGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const receiptHistory = useMemo<ReceiptRecord[]>(() => {
    const dbReceipts: ReceiptRecord[] = (rawGrns?.items ?? []).map(g => {
      const anyRejected = g.items.some(i => Number(i.rejectedQuantity ?? 0) > 0);
      return {
        grnId: g.id,
        // Prefer the real linked purchase order over the invoice number
        // (which is only a proxy — WorkerGRN.tsx sets invoiceNo to the PO
        // number today, but that's incidental, not a guarantee).
        poRef: g.purchaseOrders[0]?.poNumber ?? g.invoiceNo ?? `PO-${g.id.slice(-6)}`,
        vendor: g.supplierName ?? "Vendor",
        firmName: g.firm?.firmName ?? "—",
        dateReceived: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
        materials: g.items.map((i, index) => {
          const isJari = i.materialType === "JARI";
          return {
            // Older rows predate itemCode; fall back to the same
            // "{receipt}-{position}" shape the backend now assigns.
            itemCode: i.itemCode || `${g.id}-${index + 1}`,
            type: (i.materialType === "WARP" ? "Warp" : i.materialType === "RESHAM" ? "Resham" : "Jari") as ReceiptMaterialLine["type"],
            name: i.name,
            description: i.description ?? "",
            quantity: isJari ? jariToReels(i.quantity, i.unit ?? "KG") : i.quantity,
            unit: isJari ? "Reels" : "kg",
          };
        }),
        receivedBy: g.receivedBy ? `${g.receivedBy.firstName} ${g.receivedBy.lastName}`.trim() : "—",
        status: (anyRejected ? "short" : "match") as ReconResult,
        fullReceipt: g,
      };
    });

    const localReceipts = propReceiptHistory ?? [];

    const combined = [...localReceipts];
    for (const r of dbReceipts) {
      if (!combined.some(c => c.grnId === r.grnId)) {
        combined.push(r);
      }
    }
    return combined;
  }, [rawGrns, propReceiptHistory]);

  const filteredHistory = receiptHistory.filter(r => {
    if (!matchesDateFilter(r.dateReceived, historyDateFilter)) return false;
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return r.grnId.toLowerCase().includes(q)
      || r.poRef.toLowerCase().includes(q)
      || r.vendor.toLowerCase().includes(q)
      // Per-line codes and descriptions are visible in the table, so they
      // should be searchable too.
      || r.materials.some(m =>
        m.itemCode.toLowerCase().includes(q)
        || m.name.toLowerCase().includes(q)
        || m.description.toLowerCase().includes(q));
  });

  const pag = usePagination(filteredHistory, 10);

  const columns: ColumnDef<ReceiptRecord>[] = [
    { id: "grnId", header: "GRN Batch ID", accessor: r => r.grnId, priority: 1, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg, whiteSpace: "nowrap" }}>{r.grnId}</span> },
    { id: "poRef", header: "PO Reference", accessor: r => r.poRef, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, color: C.text }}>{r.poRef}</span> },
    { id: "vendor", header: "Vendor", accessor: r => r.vendor, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor}</span> },
    { id: "firmName", header: "Firm Name", accessor: r => r.firmName, priority: 3, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted }}>{r.firmName}</span> },
    { id: "dateReceived", header: "Date Received", accessor: r => r.dateReceived, priority: 3, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.dateReceived}</span> },
    {
      id: "materials", header: "Materials", accessor: r => r.materials.map(m => m.itemCode).join(" "),
      cell: (_v, r) => (
        <div className="max-w-[420px]" style={{ minWidth: 260, paddingTop: 4, paddingBottom: 4 }}>
          {renderMaterialsSummary(r.materials)}
        </div>
      ),
    },
    { id: "receivedBy", header: "Received By", accessor: r => r.receivedBy, priority: 3, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.receivedBy}</span> },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const sc = HIST_STATUS_CFG[r.status];
        return <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, padding: compact ? "3px 9px" : "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{sc.label}</span>;
      },
    },
    {
      id: "tags", header: "Tags", accessor: () => "",
      cell: (_v, r) => r.fullReceipt ? (
        <Button
          variant="secondary" size="sm" iconLeft={Printer}
          onClick={() => setTagsRecord(r)}
          className="h-auto rounded-md border-[rgba(110,15,45,0.12)] bg-white text-[#6E0F2D] px-2.5 py-1 text-[11px] whitespace-nowrap"
        >
          View Tags
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={historySearch}
          onSearchChange={s => { setHistorySearch(s); pag.setPage(1); }}
          searchPlaceholder="Search by GRN ID, PO number, or vendor..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: historyDateFilter.mode,
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
                if (mode === "day") setHistoryDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setHistoryDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setHistoryDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setHistoryDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
                pag.setPage(1);
              },
            },
          ]}
          onResetAll={() => {
            setHistorySearch("");
            setHistoryDateFilter(DEFAULT_DATE_FILTER);
            pag.setPage(1);
          }}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-col gap-4 mb-4">
        <div>
          <Input
            value={historySearch}
            onChange={e => { setHistorySearch(e.target.value); pag.setPage(1); }}
            placeholder="Search by GRN ID, PO number, or vendor..."
            iconLeft={Search}
            containerClassName={compact ? "h-10" : "h-[42px]"}
          />
        </div>
        <div>
          <DateFilterBar filter={historyDateFilter} onChange={f => { setHistoryDateFilter(f); pag.setPage(1); }} />
        </div>
      </div>

      <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 w-fit">
        <Button
          onClick={() => setViewMode("card")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "card"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
          }`}
        >
          <LayoutGrid size={14} /> Card View
        </Button>
        <Button
          onClick={() => setViewMode("table")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "table"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
          }`}
        >
          <AlignJustify size={14} /> Table View
        </Button>
      </div>

      <div id="goods-receipt-history-table" style={{ ...card, overflow: "hidden", border: `1.5px solid ${C.bdr}` }}>
        <div className={viewMode === "table" ? "w-full overflow-x-auto" : ""}>
          <DataTable
            responsive={viewMode === "card"}
            columns={columns}
            data={pag.pageItems}
            getRowId={r => r.grnId}
            emptyTitle="No receipts found."
          />
        </div>
        <Pagination
          targetId="goods-receipt-history-table"
          page={pag.page}
          pageCount={pag.pageCount}
          total={pag.total}
          pageSize={pag.pageSize}
          start={pag.start}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
          itemLabel="receipts"
        />
      </div>

      <Modal open={!!tagsRecord} onOpenChange={open => { if (!open) setTagsRecord(null); }} size="md">
        <Modal.Header title={tagsRecord ? `Barcode Labels — ${tagsRecord.grnId}` : "Barcode Labels"} onClose={() => setTagsRecord(null)} />
        <Modal.Body>
          {tagsRecord?.fullReceipt && <GRNPrintView grn={tagsRecord.fullReceipt} grnBatchId={tagsRecord.grnId} />}
        </Modal.Body>
      </Modal>
    </div>
  );
}
