import React, { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Calendar, Users, Download, Eye, LayoutGrid, List } from "lucide-react";
import { useRatesPricing } from "@/features/pricing";
import { T, F } from "../theme";
import type { CodeCallbacks } from "../types";
import type { HistoryBatch } from "../types";
import { useBatches } from "../../contexts/BatchContext";
import { qcApi } from "../../../../shared/api/qc";
import { FadeUp, Pip, ClickableCode, ProductionDialog } from "../common/primitives";
import { Button, SearchInput, Select, SelectItem, Checkbox, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney, addMoney, type Paise } from "@/lib/domain/money";
import { EntityCode } from "@/shared/ui/domain";

const PIP_COLORS = ["#7C3AED", T.royalBurgundy, T.taupe, "#B45309"];

function HistoryBatchSquares({ size }: { size: number }) {
  const colors = ["#7C3AED", T.royalBurgundy, T.taupe, "#B45309"];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 56 }}>
      {Array.from({ length: Math.min(size, 4) }).map((_, i) => (
        // Purely decorative filler squares generated from a count — there is no
        // underlying data item to key on, so the position is the only identity.
        // eslint-disable-next-line react/no-array-index-key
        <div key={`sq-${i}`} style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], opacity: 0.85 }} />
      ))}
    </div>
  );
}

function HistoryDropBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <Button variant="secondary" size="sm" className="w-full sm:w-auto justify-between sm:justify-start">
      <span className="flex items-center gap-1.5">{icon}{label}</span><ChevronDown size={14} style={{ color: T.taupe }} />
    </Button>
  );
}

export function ProductionHistorySection({ onSareeTypeClick }: CodeCallbacks) {
  const { getSareeTypeByName } = useRatesPricing();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { batches } = useBatches();
  const { data: qcRecords = [], isLoading: qcLoading, isError: qcError, refetch: refetchQc } = useQuery({
    queryKey: ["qc", "all"],
    queryFn: () => qcApi.list().then(r => r.items),
  });

  // A batch's own `status` only flips to "completed" once every row across
  // every assigned weaver/loom has been finalized — but a batch is often
  // shared across several weavers, and one of them can finish their whole
  // share of it while the others are still weaving. That weaver's portion
  // is genuinely done and belongs in this history, even though the batch
  // record itself is still "active". So instead of gating on batch.status,
  // each batch is split into its weaver/factory-loom groups and a group is
  // listed here the moment every row in *that* group is produced (QC-passed
  // or finished via Raise Quotation) — same definition ActiveBatchesSection
  // uses for "produced". A batch with a single recipient still shows as one
  // row; a multi-weaver batch can show one completed row per weaver well
  // before the batch as a whole is finalized. Per-saree QC outcomes
  // (okPieces/found, making charges) come from real QC records joined by
  // batchId + recipient — there is no separate "printing"/"embossing"
  // workflow tracked by the backend, so status is simply "Printing
  // Completed" for every row here (kept for label continuity with the rest
  // of the section's styling, not a tracked backend state).
  const { HISTORY_BATCHES, totalMakingCharges } = useMemo(() => {
    const makingChargesPaise: Paise[] = [];
    const list: HistoryBatch[] = [];

    batches.forEach(b => {
      const groups = new Map<string, typeof b.rows>();
      b.rows.forEach(r => {
        const key = r.weaverId ?? r.factoryLoomId ?? null;
        if (!key) return;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      });

      groups.forEach((rows, recipientKey) => {
        const produced = rows.every(r => r.qcPassed === true || r.finished === true);
        if (!produced || rows.length === 0) return;

        const isWeaver = !!rows[0].weaverId;
        const groupQc = qcRecords.filter(r =>
          r.batchId === b.batchId && (isWeaver ? r.weaverId === recipientKey : r.factoryLoomId === recipientKey),
        );
        const okPieces = groupQc.filter(r => r.result === "PASSED" || r.result === "SEMI").length;
        const found = groupQc.filter(r => r.result === "DEFECTIVE").length;
        const makingCharges = groupQc.reduce((sum, r) => sum + Number(r.makingCharge), 0);
        const makingChargesAmount = rupees(makingCharges);
        makingChargesPaise.push(makingChargesAmount);

        const firstRow = rows.find(r => r.sareeTypeName || r.designCode) ?? rows[0];
        const weaverLabel = isWeaver && rows[0].weaverInitials
          ? [{ initials: rows[0].weaverInitials, bg: PIP_COLORS[0]! }]
          : isWeaver
            ? [{ initials: (rows[0].weaverName ?? "?").slice(0, 2).toUpperCase(), bg: PIP_COLORS[0]! }]
            : [{ initials: (rows[0].factoryLoomNumber ?? "FL").slice(0, 2).toUpperCase(), bg: PIP_COLORS[1]! }];

        const latestQcDate = groupQc.reduce<string | null>((latest, r) =>
          !latest || new Date(r.qcDate) > new Date(latest) ? r.qcDate : latest, null);

        list.push({
          id: `${b.batchId}-${recipientKey}`,
          batchId: b.batchId,
          designCode: firstRow.designCode ?? "—",
          sareeType: firstRow.sareeTypeName ?? "—",
          batchSize: rows.length,
          weavers: weaverLabel,
          completion: rows.filter(r => r.sareeId).length,
          allPieces: rows.length,
          okPieces: groupQc.length > 0 ? okPieces : null,
          found: groupQc.length > 0 ? found : null,
          status: "Printing Completed",
          makingCharges: formatMoney(makingChargesAmount),
          completedOn: new Date(latestQcDate ?? b.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          bulkOrder: rows.find(r => r.bulkOrderRef)?.bulkOrderRef ?? undefined,
        });
      });
    });

    return { HISTORY_BATCHES: list, totalMakingCharges: addMoney(...makingChargesPaise) };
  }, [batches, qcRecords]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [rPeriod, setRPeriod] = useState("This Month");
  const [rFormat, setRFormat] = useState("PDF");
  const [rWeavers, setRWeavers] = useState("All Weavers");
  const [rIncludes, setRIncludes] = useState<Record<string, boolean>>({
    "Batch Summary": true,
    "Making Charges Breakdown": true,
    "Weaver-wise Totals": true,
    "Design-wise Report": false,
    "Defect Analysis": false,
  });

  const filteredBatches = HISTORY_BATCHES.filter(b =>
    !search || b.batchId.toLowerCase().includes(search.toLowerCase()) || b.sareeType.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<HistoryBatch>[] = [
    {
      id: "batchNumber", header: "Batch Number", accessor: b => b.batchId, priority: 1,
      cell: (_v, b) => <EntityCode type="batch" value={b.batchId} size="sm" />,
    },
    {
      id: "sareeType", header: "Saree Type", accessor: b => b.sareeType,
      cell: (_v, b) => (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={T.antiqueGold} strokeWidth="1.2" fill="none" />
            <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={T.antiqueGold} strokeWidth="0.8" />
            <line x1="1" y1="8.5" x2="13" y2="8.5" stroke={T.antiqueGold} strokeWidth="0.8" />
          </svg>
          {(() => {
            const rec = getSareeTypeByName(b.sareeType);
            return (
              <ClickableCode onClick={rec && onSareeTypeClick ? () => onSareeTypeClick(rec.code) : undefined} style={{ fontSize: 12, fontWeight: 500 }}>{b.sareeType}</ClickableCode>
            );
          })()}
        </div>
      ),
    },
    {
      id: "batchSize", header: "Batch Size", accessor: b => b.batchSize, align: "center",
      cell: (_v, b) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <HistoryBatchSquares size={b.batchSize} />
        </div>
      ),
    },
    {
      id: "weavers", header: "Weavers", accessor: b => b.weavers.length,
      cell: (_v, b) => (
        <div style={{ display: "flex" }}>
          {b.weavers.map((w, wi) => (
            // Weaver pip labels (initials) can repeat across a batch, so combine
            // with position for a stable key since there's no per-pip id.
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${w.initials}-${wi}`} style={{ marginLeft: wi > 0 ? -8 : 0 }}>
              <Pip initials={w.initials} bg={w.bg} size={26} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "completion", header: "Completion", accessor: b => b.completion, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14 }}>{b.completion}</span>,
    },
    {
      id: "allPieces", header: "All Pieces", accessor: b => b.allPieces, align: "center", priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{b.allPieces}</span>,
    },
    {
      id: "makingCharges", header: "Making Charges", accessor: b => b.makingCharges, align: "end",
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13 }}>{b.makingCharges}</span>,
    },
    {
      id: "completedOn", header: "Completed On", accessor: b => b.completedOn, priority: 3,
      cell: (_v, b) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.completedOn}</span>,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: b => b.bulkOrder, align: "center", priority: 3,
      cell: (_v, b) => b.bulkOrder
        ? <EntityCode type="order" value={b.bulkOrder} size="sm" />
        : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>General Stock</span>,
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", align: "center",
      cell: () => <IconButton icon={Eye} label="View batch" variant="secondary" size="sm" />,
    },
  ];

  return (
    <div id="prod-history" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 40 }}>
      <FadeUp>
        <div className="p-4 sm:p-6 shadow-[0_6px_32px_rgba(74,6,27,0.08)] rounded-t-2xl" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
          <div className="flex items-start gap-3.5 sm:gap-4 w-full">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <rect width="34" height="34" rx="7" fill="rgba(200,155,71,0.18)" />
              <rect x="7" y="9"  width="20" height="3" rx="1.5" fill="#C89B47" />
              <rect x="7" y="22" width="20" height="3" rx="1.5" fill="#C89B47" />
              <rect x="11"  y="12" width="1.5" height="10" rx="0.75" fill="#E7C983" />
              <rect x="14.5" y="12" width="1.5" height="10" rx="0.75" fill="#E7C983" />
              <rect x="18"  y="12" width="1.5" height="10" rx="0.75" fill="#E7C983" />
              <rect x="21.5" y="12" width="1.5" height="10" rx="0.75" fill="#E7C983" />
            </svg>
            <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>COMPLETED BATCHES · RECORDS</div>
                <h2 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production History</h2>
              </div>
              <Button onClick={() => setShowReportDialog(true)} variant="secondary" size="sm" className="shrink-0">
                <Download size={14} /> Generate Production Report
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2.5 p-3.5 sm:px-6 bg-white border-x border-[rgba(110,15,45,0.10)] w-full overflow-x-auto">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." className="w-full md:w-[240px] shrink-0" />
          <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto shrink-0 w-full md:w-auto pb-1 md:pb-0">
            <HistoryDropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
            <HistoryDropBtn label="All Saree Types" />
            <HistoryDropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
            <HistoryDropBtn label="All Orders" />
          </div>
        </div>

        {/* View mode toggle buttons — placed just below search bar */}
        <div className="p-3 sm:px-6 bg-white border-x border-[rgba(110,15,45,0.10)] border-t border-t-[rgba(110,15,45,0.06)] flex items-center justify-start">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-2 px-3 text-[12px] sm:text-[13px] font-bold ${
                viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
              }`}
            >
              <LayoutGrid size={15} /> Card View
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-2 px-3 text-[12px] sm:text-[13px] font-bold ${
                viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
              }`}
            >
              <List size={15} /> Table View
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:px-6 bg-[#F7F2EA] border-x border-b border-[rgba(110,15,45,0.10)]">
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
            Showing <strong style={{ color: T.luxuryBrown }}>{HISTORY_BATCHES.length}</strong> of <strong style={{ color: T.luxuryBrown }}>{HISTORY_BATCHES.length}</strong> completed batches
          </span>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Completed:</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{HISTORY_BATCHES.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Making Charges:</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.green }}>
                {formatMoney(totalMakingCharges)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.07)", background: T.warmIvory }}>
          <DataTable
            responsive={viewMode === "card"}
            columns={columns}
            data={filteredBatches}
            getRowId={b => b.id}
            loading={qcLoading}
            error={qcError}
            onRetry={() => void refetchQc()}
            emptyTitle="No completed batches yet."
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-6 border-t border-[rgba(110,15,45,0.10)]">
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }} className="w-full sm:w-auto text-center sm:text-left">
              Showing {HISTORY_BATCHES.length} of {HISTORY_BATCHES.length} entries
            </span>
            <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
              {["Prev", "1", "2", "3", "Next"].map(p => (
                <Button key={p} onClick={() => typeof p === "string" && !isNaN(Number(p)) && setCurrentPage(Number(p))}
                  variant={p === String(currentPage) ? "primary" : "secondary"} size="sm">
                  {p}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Rows per page</span>
              <HistoryDropBtn label="10" />
            </div>
          </div>
        </div>
      </FadeUp>

      <AnimatePresence>
        {showReportDialog && (
          <ProductionDialog open title="Generate Production Report" onClose={() => setShowReportDialog(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Report Period</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Today", "This Week", "This Month", "Last 3 Months", "This Year"].map(p => (
                    <Button key={p} onClick={() => setRPeriod(p)} variant={rPeriod === p ? "primary" : "tertiary"} size="sm">
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                <Select value={rWeavers} onValueChange={setRWeavers}>
                  <SelectItem value="All Weavers">All Weavers</SelectItem>
                  <SelectItem value="Padma Veni">Padma Veni</SelectItem>
                  <SelectItem value="Ravi Kumar">Ravi Kumar</SelectItem>
                  <SelectItem value="Suresh Murti">Suresh Murti</SelectItem>
                  <SelectItem value="Anand K.">Anand K.</SelectItem>
                  <SelectItem value="Own Factory">Own Factory</SelectItem>
                </Select>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(rIncludes).map(([key, checked]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "9px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.16)" : T.borderDef}`, transition: "all 0.15s" }}>
                      <Checkbox checked={checked} onCheckedChange={() => setRIncludes(prev => ({ ...prev, [key]: !prev[key] }))} />
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                    <Button key={fmt} onClick={() => setRFormat(fmt)} variant={rFormat === fmt ? "primary" : "tertiary"} fullWidth>
                      {fmt}
                    </Button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setShowReportDialog(false)} variant="primary" size="lg" className="flex-[2]">
                  <Download size={17} /> Generate &amp; Download
                </Button>
                <Button onClick={() => setShowReportDialog(false)} variant="tertiary" size="lg" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
