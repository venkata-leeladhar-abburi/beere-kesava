import React from "react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { ageBucket } from "../../../customers/contexts/SalesContext";
import { T, F } from "./theme";
import { WeaverSareeRow, TabKey, tabDate } from "./types";
import { inr, fmtDate, AGE_COLOR, QC_CFG, FIN_CFG } from "./utils";
import { Checkbox } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12,
      fontWeight: 700, color, background: `${color}1A`, borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

interface MainSareesTableProps {
  pageRows: WeaverSareeRow[];
  visible: WeaverSareeRow[];
  selectable: boolean;
  selectedIds?: Set<string>;
  onToggleAll?: (visibleIds: string[]) => void;
  onToggleRow?: (sareeId: string) => void;
  isAll: boolean;
  isLoom: boolean;
  tab: TabKey;
  dateHeader: string;
  showQcMoney: boolean;
  showMoney: boolean;
  pag: UsePaginationReturn;
}

export function MainSareesTable({
  pageRows, visible, selectable, selectedIds, onToggleAll, onToggleRow,
  isAll, isLoom, tab, dateHeader, showQcMoney, showMoney, pag
}: MainSareesTableProps) {
  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: F.mono, fontSize: 12, color, ...extra });

  const columns: ColumnDef<WeaverSareeRow>[] = [
    ...(selectable ? [{
      id: "select",
      header: (() => {
        const dispatchableVisible = visible.filter(r => r.finishingStatus === "completed").map(r => r.sareeId);
        return (
          <Checkbox
            checked={dispatchableVisible.length > 0 && dispatchableVisible.every(id => selectedIds?.has(id))}
            onCheckedChange={() => onToggleAll?.(dispatchableVisible)}
          />
        );
      })(),
      accessor: () => null,
      cell: (_v: unknown, r: WeaverSareeRow) => {
        // Only sarees that finished the finishing step have an InventoryRecord
        // with status FINISHING_COMPLETE — dispatch 404s on anything else.
        const dispatchable = r.finishingStatus === "completed";
        return (
          <Checkbox
            checked={!!selectedIds?.has(r.sareeId)}
            onCheckedChange={() => dispatchable && onToggleRow?.(r.sareeId)}
            disabled={!dispatchable}
          />
        );
      },
    } as ColumnDef<WeaverSareeRow>] : []),
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId,
      cell: (_v, r) => <span style={mono(T.royalBurgundy)}>{r.sareeId}</span>,
    },
    {
      id: "batch", header: "Batch", accessor: r => r.batchId,
      cell: (_v, r) => <span style={mono(T.royalBurgundy)}>{r.batchId || "—"}</span>,
    },
    ...(isAll ? [{
      id: "owner", header: "Weaver / Loom", accessor: (r: WeaverSareeRow) => r.ownerLabel,
      cell: (_v: unknown, r: WeaverSareeRow) => (
        <span style={{ fontFamily: F.ui, fontSize: 14, color: r.ownerKind === "loom" ? T.antiqueGold : T.royalBurgundy, fontWeight: 600 }}>{r.ownerLabel || "—"}</span>
      ),
    } as ColumnDef<WeaverSareeRow>] : []),
    ...(!isLoom ? [{
      id: "loom", header: "Loom", accessor: (r: WeaverSareeRow) => r.loomNumber,
      cell: (_v: unknown, r: WeaverSareeRow) => <span style={mono(T.antiqueGold, { fontWeight: 700 })}>{r.loomNumber != null ? `L${r.loomNumber}` : "—"}</span>,
    } as ColumnDef<WeaverSareeRow>] : []),
    {
      id: "sareeType", header: "Saree Type", accessor: r => r.sareeTypeCode,
      cell: (_v, r) => <span>{r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : "—"}</span>,
    },
    {
      id: "colour", header: "Colour", accessor: r => r.color,
      cell: (_v, r) => r.color ? <span>{r.color}</span> : <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: r => r.bulkOrderLabel,
      cell: (_v, r) => <span style={{ color: r.bulkOrderLabel ? T.royalBurgundy : T.green, fontWeight: 600 }}>{r.bulkOrderLabel || "General Stock"}</span>,
    },
    {
      id: "date", header: dateHeader, accessor: r => tabDate(r, tab),
      cell: (_v, r) => <span>{fmtDate(tabDate(r, tab))}</span>,
    },
    ...(tab === "sold" ? [
      {
        id: "channel", header: "Channel", accessor: (r: WeaverSareeRow) => r.stock?.sale?.channel,
        cell: (_v: unknown, r: WeaverSareeRow) => r.stock?.sale
          ? <Chip label={r.stock.sale.channel === "retail" ? "Retail" : "Wholesale"} color={r.stock.sale.channel === "retail" ? T.blue : T.purple} />
          : "—",
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "customer", header: "Customer", accessor: (r: WeaverSareeRow) => r.stock?.sale?.customer,
        cell: (_v: unknown, r: WeaverSareeRow) => <span>{r.stock?.sale?.customer || "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
    ] : []),
    ...(tab === "outstanding" ? [{
      id: "daysInStock", header: "Days In Stock", accessor: (r: WeaverSareeRow) => r.stock?.ageDays,
      cell: (_v: unknown, r: WeaverSareeRow) => r.stock
        ? <Chip label={`${r.stock.ageDays} days`} color={AGE_COLOR[ageBucket(r.stock.ageDays)]} />
        : "—",
    } as ColumnDef<WeaverSareeRow>] : []),
    ...((tab === "semi" || tab === "defective") ? [{
      id: "defects", header: "Defects", accessor: (r: WeaverSareeRow) => r.defects,
      cell: (_v: unknown, r: WeaverSareeRow) => {
        const qc = QC_CFG[r.qcStatus];
        return r.defects.length > 0 ? (
          <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
            {r.defects.map(d => (
              <span key={d} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: qc.color, background: `${qc.color}1A`, borderRadius: 5, padding: "2px 7px" }}>{d}</span>
            ))}
          </span>
        ) : "—";
      },
    } as ColumnDef<WeaverSareeRow>] : []),
    {
      id: "qc", header: "QC Status", accessor: r => r.qcStatus,
      cell: (_v, r) => <Chip label={QC_CFG[r.qcStatus].label} color={QC_CFG[r.qcStatus].color} />,
    },
    {
      id: "finishing", header: "Finishing", accessor: r => r.finishingStatus,
      cell: (_v, r) => r.finishingStatus === "none"
        ? <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>
        : <Chip label={FIN_CFG[r.finishingStatus].label} color={FIN_CFG[r.finishingStatus].color} />,
    },
    {
      id: "finishingCompleted", header: "Finishing Completed", accessor: r => r.finishingCompletedDate,
      cell: (_v, r) => <span>{fmtDate(r.finishingCompletedDate)}</span>,
    },
    ...(showQcMoney ? [
      {
        id: "makingCharge", header: "Making Charge", type: "currency" as const, accessor: (r: WeaverSareeRow) => r.makingCharge,
        cell: (_v: unknown, r: WeaverSareeRow) => <span style={mono(T.luxuryBrown)}>{r.makingCharge != null ? inr(r.makingCharge) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "deducted", header: "Deducted", type: "currency" as const, accessor: (r: WeaverSareeRow) => r.deduction,
        cell: (_v: unknown, r: WeaverSareeRow) => <span style={mono(T.crimson, { fontWeight: 700 })}>{r.deduction != null ? `− ${inr(r.deduction)}` : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "payable", header: "Weaver Earns", type: "currency" as const, accessor: (r: WeaverSareeRow) => r.payable,
        cell: (_v: unknown, r: WeaverSareeRow) => <span style={mono(r.payable ? T.green : T.crimson, { fontWeight: 700 })}>{r.payable != null ? inr(r.payable) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
    ] : []),
    ...(showMoney ? [{
      id: "amount", header: tab === "sold" ? "Sold For" : "Sell Price", type: "currency" as const,
      accessor: (r: WeaverSareeRow) => r.stock ? (tab === "sold" ? (r.stock.sale?.amount || 0) : r.stock.finalAmount) : null,
      cell: (_v: unknown, r: WeaverSareeRow) => (
        <span style={mono(tab === "sold" ? T.green : T.royalBurgundy, { fontWeight: 700 })}>
          {r.stock ? inr(tab === "sold" ? (r.stock.sale?.amount || 0) : r.stock.finalAmount) : "—"}
        </span>
      ),
    } as ColumnDef<WeaverSareeRow>] : []),
  ];

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <DataTable columns={columns} data={pageRows} getRowId={r => r.sareeId} />
      <div style={{ padding: "0 14px" }}>
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
      </div>
    </div>
  );
}
