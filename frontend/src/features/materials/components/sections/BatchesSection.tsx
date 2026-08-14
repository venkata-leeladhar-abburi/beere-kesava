import React, { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag, Layers, FileText, Boxes, Calendar, Package, ArrowRight, CheckCircle2,
  Filter, ChevronDown, ChevronUp, Check, LayoutList, LayoutGrid, QrCode,
} from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { T, F, MobileCtx } from "../theme";
import { STATUS_CFG, MAT_TAG, MAT_FILTERS, STATUS_FILTERS, STATUS_FILTER_MAP } from "../materialConfig";
import type { BatchRow, StatusType } from "../types";
import { SectionCard, FadeUp } from "../common/primitives";
import { BatchViewDetailsModal, PrintBarcodeModal } from "../modals/StockModals";
import { Button, SearchInput } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { EntityCode } from "@/shared/ui/domain";

export function BatchTableView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const columns: ColumnDef<BatchRow>[] = [
    {
      id: "id", header: "Batch ID", accessor: r => r.id, priority: 1,
      cell: (_v, r) => <EntityCode type="batch" value={r.id} size="sm" />,
    },
    {
      id: "material", header: "Material", accessor: r => r.type,
      cell: (_v, r) => {
        const mt = MAT_TAG[r.type];
        return <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: mt.col, background: mt.bg, padding: "5px 11px", borderRadius: 20, letterSpacing: "0.3px" }}>{r.type}</span>;
      },
    },
    {
      id: "details", header: "Description", accessor: r => r.details, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.details}</span>,
    },
    {
      id: "vendor", header: "Vendor", accessor: r => r.vendor, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.vendor}</span>,
    },
    {
      id: "date", header: "Received On", accessor: r => r.date, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.date}</span>,
    },
    {
      id: "received", header: "Received", accessor: r => r.received, type: "number", sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
          {r.received} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400, color: T.taupe }}>{r.type === "Jari" ? `Buns (${r.received * 4} Reels)` : "kg"}</span>
        </span>
      ),
    },
    {
      id: "given", header: "Given", accessor: r => r.given, type: "number", sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.taupe }}>
          {r.given} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.given * 4} Reels)` : "kg"}</span>
        </span>
      ),
    },
    {
      id: "remaining", header: "Remaining", accessor: r => r.remaining, type: "number", sortable: true,
      cell: (_v, r) => {
        const sc = STATUS_CFG[r.statusType];
        const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
        return (
          <div>
            <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: sc.color }}>
              {r.remaining} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.remaining * 4} Reels)` : "kg"}</span>
            </span>
            <div style={{ width: 64, height: 4, background: "rgba(110,15,45,0.08)", borderRadius: 2, marginTop: 5 }}>
              <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 2 }} />
            </div>
          </div>
        );
      },
    },
    {
      id: "status", header: "Status", accessor: r => r.statusType, type: "status",
      cell: (_v, r) => {
        const sc = STATUS_CFG[r.statusType];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
            {sc.icon} {sc.text}
          </span>
        );
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Button onClick={() => onViewDetails(r)} variant="secondary" size="sm" iconLeft={FileText}>
            View Details
          </Button>
          <Button onClick={() => onPrintBarcode(r)} variant="primary" size="sm" iconLeft={QrCode}>
            Print Barcode
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.05)", overflowX: "auto" }}>
      <DataTable responsive columns={columns} data={rows} getRowId={r => r.rowKey} />
    </div>
  );
}

export function BatchCardView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const { isMobile } = useContext(MobileCtx);
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 14 : 20, alignItems: "stretch" }}>
      {rows.map((r, i) => {
        const sc = STATUS_CFG[r.statusType];
        const mt = MAT_TAG[r.type];
        const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
        const matIcon = r.type === "Warp" ? <Layers size={22} color={mt.col} /> : r.type === "Resham" ? <Tag size={22} color={mt.col} /> : <Boxes size={22} color={mt.col} />;
        return (
          <FadeUp key={r.rowKey} delay={i * 0.05} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ background: mt.bg, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                    {matIcon}
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: mt.col }}>{r.type}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{r.details}</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20 }}>
                  {sc.icon} {sc.text}
                </span>
              </div>
              <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ marginBottom: 8 }}><EntityCode type="batch" value={r.id} size="sm" /></div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.vendor}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Calendar size={12} color={T.taupe} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Received {r.date}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[
                    { icon: <Package size={13} color={T.taupe} />, label: "Received", val: r.received, color: T.luxuryBrown },
                    { icon: <ArrowRight size={13} color={T.taupe} />, label: "Given", val: r.given, color: T.taupe },
                    { icon: <CheckCircle2 size={13} color={sc.color} />, label: "Remaining", val: r.remaining, color: sc.color },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 10px 8px", textAlign: "center" as const }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontFamily: F.display, fontSize: r.type === "Jari" ? 14 : 18, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                        {r.type === "Jari" ? (
                          <>
                            <div>{s.val} Buns</div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: T.taupe, marginTop: 2 }}>{s.val * 4} Reels</div>
                          </>
                        ) : (
                          s.val
                        )}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                        {s.label} {r.type === "Jari" ? "" : "kg"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 16, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Stock remaining</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: sc.color }}>{remPct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 3 }}>
                    <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => onViewDetails(r)} variant="secondary" size="sm" iconLeft={FileText} className="flex-1">
                    View Details
                  </Button>
                  <Button onClick={() => onPrintBarcode(r)} variant="primary" size="sm" iconLeft={QrCode} className="flex-1">
                    Print Barcode
                  </Button>
                </div>
              </div>
            </div>
          </FadeUp>
        );
      })}
    </div>
  );
}

export function BatchesSection({ onAddNewStock }: { onAddNewStock: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [view, setView] = useState<"table" | "card">(isMobile ? "card" : "table");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [matFilter, setMatFilter] = useState("All Materials");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [barcodeBatch, setBarcodeBatch] = useState<BatchRow | null>(null);

  const { data: grnRes } = useQuery({
    queryKey: ["raw-material-grns-list"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const grnItems = grnRes?.items ?? [];

  const liveBatchRows: BatchRow[] = grnItems.flatMap(grn =>
    grn.items.map(item => {
      const remaining = item.quantity - (item.rejectedQuantity ?? 0);
      const statusType: StatusType = remaining > 10 ? "good" : remaining > 0 ? "warning" : "empty";
      return {
        id: grn.id,
        rowKey: `${grn.id}-${item.id}`,
        type: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
        details: `${item.name}${item.grade ? ` (${item.grade})` : ""}`,
        vendor: grn.supplierName,
        date: grn.receivedDate ? new Date(grn.receivedDate).toLocaleDateString("en-IN") : "—",
        received: item.quantity,
        given: item.rejectedQuantity ?? 0,
        remaining,
        statusType,
      };
    })
  );

  const batchSource = liveBatchRows;

  const filtered = batchSource.filter(b => {
    const matchMat = matFilter === "All Materials" || b.type === matFilter.replace(" Only", "");
    const matchStatus = statusFilter === "All Status" || b.statusType === STATUS_FILTER_MAP[statusFilter];
    const matchSearch = search === "" || b.id.toLowerCase().includes(search.toLowerCase()) || b.vendor.toLowerCase().includes(search.toLowerCase());
    return matchMat && matchStatus && matchSearch;
  });

  return (
    <section style={{ padding: `44px ${px}px 0` }}>
    <SectionCard
      icon={Boxes}
      title="All Material Batches in Stock"
      subtitle="Each batch is one delivery of material received from a vendor. Every batch has its own unique barcode for tracking."
      actions={
        <Button onClick={onAddNewStock} variant="secondary" size="sm" iconLeft={Package}>
          Receive Materials
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MAT_FILTERS.map(f => (
            <Button
              key={f}
              onClick={() => setMatFilter(f)}
              variant={matFilter === f ? "primary" : "secondary"}
              size="sm"
              className="rounded-full"
            >
              {f}
            </Button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: isMobile ? 1 : "none", width: isMobile ? "100%" : 240 }}>
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={setSearch}
              placeholder={isMobile ? "Search batch / vendor..." : "Search by batch number or vendor name..."}
            />
          </div>

          <DropdownMenu open={statusDropOpen} onOpenChange={setStatusDropOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={statusFilter !== "All Status" ? "primary" : "secondary"}
                size="sm"
                iconLeft={Filter}
                iconRight={statusDropOpen ? ChevronUp : ChevronDown}
              >
                {statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[160px] !p-0 !rounded-xl !overflow-hidden" style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}` }}>
              {STATUS_FILTERS.map(f => {
                const colors: Record<string, string> = { "In Stock": T.green, "Running Low": "#7A5E1C", "Very Low": T.crimson, "All Used Up": T.taupe, "All Status": T.luxuryBrown };
                return (
                  <DropdownMenuItem
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`!rounded-none ${statusFilter === f ? "!font-bold" : "!font-medium"}`}
                  >
                    {f !== "All Status" && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[f], flexShrink: 0 }} />
                    )}
                    <span style={{ color: statusFilter === f ? colors[f] : T.luxuryBrown }}>{f}</span>
                    {statusFilter === f && <Check size={13} color={colors[f]} style={{ marginLeft: "auto" }} />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div style={{ display: "flex", gap: 6 }}>
            {([["table", LayoutList, "Table"], ["card", LayoutGrid, "Card"]] as const).map(([v, Icon, label]) => (
              <Button
                key={v}
                onClick={() => setView(v as "table" | "card")}
                variant={view === v ? "primary" : "secondary"}
                size="sm"
                iconLeft={Icon}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {(statusFilter !== "All Status" || matFilter !== "All Materials" || search) && (
        <div style={{ marginBottom: 12, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          Showing <strong style={{ color: T.luxuryBrown }}>{filtered.length}</strong> of {batchSource.length} batches
          {statusFilter !== "All Status" && <> · Status: <strong style={{ color: T.royalBurgundy }}>{statusFilter}</strong></>}
        </div>
      )}

      <FadeUp>
        {view === "table"
          ? <BatchTableView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
          : <BatchCardView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
        }
      </FadeUp>
    </SectionCard>

      <BatchViewDetailsModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      <PrintBarcodeModal batch={barcodeBatch} onClose={() => setBarcodeBatch(null)} />
    </section>
  );
}
