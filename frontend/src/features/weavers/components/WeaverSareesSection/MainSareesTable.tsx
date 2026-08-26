import React, { useState } from "react";
import { Printer, ImageOff } from "lucide-react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { ageBucket } from "@/features/customers";
import { T, F } from "./theme";
import { WeaverSareeRow, TabKey, tabDate } from "./types";
import { inr, fmtDate, isSareePickable, pickBlockedReason, AGE_COLOR, QC_CFG, FIN_CFG, DISPATCH_CFG } from "./utils";
import { Checkbox, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";

function PhotoThumb({ url, sareeId, onView }: { url: string | null; sareeId: string; onView: (image: ZoomImage) => void }) {
  return url ? (
    <button
      type="button"
      onClick={() => onView({ url, label: `Saree photo — ${sareeId}` })}
      title="View saree photo"
      aria-label={`View photo for ${sareeId}`}
      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.borderDef}`, padding: 0, cursor: "pointer", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }}
    />
  ) : (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: `1px dashed ${T.borderDef}`, color: "rgba(139,112,96,0.55)", flexShrink: 0 }} title="No photo on file">
      <ImageOff size={13} />
    </span>
  );
}

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
  responsive?: boolean;
  /** Prints a physical tag for this one row — available regardless of QC,
   *  finishing or dispatch status (a dispatched saree can still be re-tagged
   *  even though it can no longer be picked for a new quotation/dispatch). */
  onPrintTag?: (r: WeaverSareeRow) => void;
}

function MainSareeCard({
  r,
  selectable,
  selectedIds,
  onToggleRow,
  isAll,
  isLoom,
  tab,
  dateHeader,
  showQcMoney,
  showMoney,
  onPrintTag,
  onViewPhoto,
}: {
  r: WeaverSareeRow;
  selectable: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (sareeId: string) => void;
  isAll: boolean;
  isLoom: boolean;
  tab: TabKey;
  dateHeader: string;
  showQcMoney: boolean;
  showMoney: boolean;
  onPrintTag?: (r: WeaverSareeRow) => void;
  onViewPhoto: (image: ZoomImage) => void;
}) {
  const isPickable = isSareePickable(r);
  const qc = QC_CFG[r.qcStatus];
  const fin = FIN_CFG[r.finishingStatus];

  return (
    <div className="bg-white rounded-2xl border border-[#EBE3D5] shadow-[0_4px_20px_rgba(74,6,27,0.06)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(74,6,27,0.12)]">
      <div className="h-1" style={{ background: qc.color }} />

      <div className="p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {selectable && (
                <Checkbox
                  checked={!!selectedIds?.has(r.sareeId)}
                  onCheckedChange={() => isPickable && onToggleRow?.(r.sareeId)}
                  disabled={!isPickable}
                  title={pickBlockedReason(r)}
                />
              )}
              <PhotoThumb url={r.receivedPhotoUrl} sareeId={r.sareeId} onView={onViewPhoto} />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: T.royalBurgundy, wordBreak: "break-word" }}>
                  {r.sareeId}
                </div>
                {r.batchId && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 1 }}>
                    Batch: {r.batchId}
                  </div>
                )}
              </div>
            </div>

            {onPrintTag && (
              <IconButton icon={Printer} label={`Print tag for ${r.sareeId}`} variant="ghost" size="sm" onClick={() => onPrintTag(r)} className="shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <Chip label={qc.label} color={qc.color} />
            {r.finishingStatus !== "none" && <Chip label={fin.label} color={fin.color} />}
            <Chip label={DISPATCH_CFG[r.dispatched ? "dispatched" : "inStock"].label} color={DISPATCH_CFG[r.dispatched ? "dispatched" : "inStock"].color} />
          </div>
        </div>

        <div className="h-px bg-[rgba(110,15,45,0.07)]" />

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          {isAll && r.ownerLabel && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
                Weaver / Loom
              </div>
              <div className="font-semibold text-[#6E0F2D]">
                {r.ownerLabel}
              </div>
            </div>
          )}

          {!isLoom && r.loomNumber != null && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
                Loom
              </div>
              <div className="font-semibold text-[#C89B47]">
                Loom {r.loomNumber}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
              Saree Type
            </div>
            <div className="font-semibold text-[#3B2314]">
              {r.sareeTypeCode ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}` : "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
              Colour
            </div>
            <div className="font-semibold text-[#3B2314]">
              {r.color || "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
              Bulk Order
            </div>
            <div className="font-semibold text-[#6E0F2D]">
              {r.bulkOrderLabel || "General Stock"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
              {dateHeader}
            </div>
            <div className="font-semibold text-[#3B2314]">
              {fmtDate(tabDate(r, tab))}
            </div>
          </div>

          {showQcMoney && r.payable != null && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
                Weaver Earns
              </div>
              <div className="font-bold text-[#1E6640] font-mono">
                {inr(r.payable)}
              </div>
            </div>
          )}

          {showMoney && r.stock && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#69635E] mb-0.5">
                {tab === "sold" ? "Sold For" : "Sell Price"}
              </div>
              <div className="font-bold text-[#6E0F2D] font-mono">
                {inr(tab === "sold" ? (r.stock.sale?.amount || 0) : r.stock.finalAmount)}
              </div>
            </div>
          )}
        </div>

        {r.defects && r.defects.length > 0 && (
          <div className="mt-1 pt-2 border-t border-dashed border-red-200 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Defects:</span>
            {r.defects.map(d => (
              <span key={d} className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MainSareesTable({
  pageRows, visible, selectable, selectedIds, onToggleAll, onToggleRow,
  isAll, isLoom, tab, dateHeader, showQcMoney, showMoney, pag, responsive = false, onPrintTag,
}: MainSareesTableProps) {
  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: "var(--font-mono)", fontSize: 12, color, ...extra });
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);

  const columns: ColumnDef<WeaverSareeRow>[] = [
    ...(selectable ? [{
      id: "select",
      header: (() => {
        const dispatchableVisible = visible.filter(isSareePickable).map(r => r.sareeId);
        return (
          <Checkbox
            checked={dispatchableVisible.length > 0 && dispatchableVisible.every(id => selectedIds?.has(id))}
            onCheckedChange={() => onToggleAll?.(dispatchableVisible)}
          />
        );
      })(),
      accessor: () => null,
      cell: (_v: unknown, r: WeaverSareeRow) => {
        const dispatchable = isSareePickable(r);
        return (
          <Checkbox
            checked={!!selectedIds?.has(r.sareeId)}
            onCheckedChange={() => dispatchable && onToggleRow?.(r.sareeId)}
            disabled={!dispatchable}
            title={pickBlockedReason(r)}
          />
        );
      },
    } as ColumnDef<WeaverSareeRow>] : []),
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, priority: 1,
      cell: (_v, r) => <span style={mono(T.royalBurgundy)}>{r.sareeId}</span>,
    },
    {
      id: "photo", header: "Photo", accessor: r => r.receivedPhotoUrl,
      cell: (_v, r) => <PhotoThumb url={r.receivedPhotoUrl} sareeId={r.sareeId} onView={setZoomImage} />,
    },
    {
      id: "batch", header: "Batch", accessor: r => r.batchId, priority: 3,
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
      id: "finishingCompleted", header: "Finishing Completed", accessor: r => r.finishingCompletedDate, priority: 3,
      cell: (_v, r) => <span>{fmtDate(r.finishingCompletedDate)}</span>,
    },
    {
      id: "dispatch", header: "Dispatch", accessor: r => r.dispatched,
      cell: (_v, r) => {
        const cfg = DISPATCH_CFG[r.dispatched ? "dispatched" : "inStock"];
        return <Chip label={cfg.label} color={cfg.color} />;
      },
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
    ...(onPrintTag ? [{
      id: "printTag", header: "Tag", accessor: () => null, type: "actions" as const,
      cell: (_v: unknown, r: WeaverSareeRow) => (
        <IconButton icon={Printer} label={`Print tag for ${r.sareeId}`} variant="ghost" size="sm" onClick={() => onPrintTag(r)} />
      ),
    } as ColumnDef<WeaverSareeRow>] : []),
  ];

  return (
    <>
      {/* Desktop view (md and up): ALWAYS show full table */}
      <div className="hidden md:block" style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
        <div className="w-full overflow-x-auto section-nav-scroll p-2">
          <div className="min-w-[850px]">
            <DataTable columns={columns} data={pageRows} getRowId={r => r.sareeId} />
          </div>
        </div>
        <div style={{ padding: "0 14px" }}>
          <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
            onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
        </div>
      </div>

      {/* Mobile view (< md): Card View when responsive is true, scrollable table when false */}
      <div className="block md:hidden">
        {responsive ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {pageRows.map(r => (
                <MainSareeCard
                  key={r.sareeId}
                  r={r}
                  selectable={selectable}
                  selectedIds={selectedIds}
                  onToggleRow={onToggleRow}
                  isAll={isAll}
                  isLoom={isLoom}
                  tab={tab}
                  dateHeader={dateHeader}
                  showQcMoney={showQcMoney}
                  showMoney={showMoney}
                  onPrintTag={onPrintTag}
                  onViewPhoto={setZoomImage}
                />
              ))}
            </div>
            <div style={{ padding: "0 14px" }}>
              <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
                onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
            </div>
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
            <div className="w-full overflow-x-auto section-nav-scroll p-2">
              <div className="min-w-[850px]">
                <DataTable columns={columns} data={pageRows} getRowId={r => r.sareeId} />
              </div>
            </div>
            <div style={{ padding: "0 14px" }}>
              <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
                onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
            </div>
          </div>
        )}
      </div>
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </>
  );
}
