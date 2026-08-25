import React, { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Eye, LayoutGrid, List, ImageOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Download as DownloadSimple, ShieldAlert as SealWarning, AlertCircle as WarningCircle,
} from "lucide-react";
import { T, F } from "../theme";
import type { CodeCallbacks } from "../types";
import { FadeUp, ProductionDialog } from "../common/primitives";
import { Button, Select, SelectItem } from "../../../../shared/ui/primitives";
import { qcApi } from "../../../../shared/api/qc";
import { weaversApi } from "../../../../shared/api/weavers";
import { useBatches } from "@/features/production";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney, addMoney, type Paise } from "@/lib/domain/money";
import { EntityCode } from "@/shared/ui/domain";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";

interface DefectiveRow {
  id: string;
  weaver: string;
  batch: string;
  sareeType: string;
  defects: string[];
  qcDate: string;
  deduction: Paise;
  /** Photo captured by Worker Staff at Receive Sarees — same source as the worker portal's Received History. */
  photoUrl: string | null;
}

function DefectivePhotoCell({ url, sareeId, onView }: { url: string | null; sareeId: string; onView: (image: ZoomImage) => void }) {
  return url ? (
    <button
      type="button"
      onClick={() => onView({ url, label: `Saree photo — ${sareeId}` })}
      title="View saree photo"
      aria-label={`View photo for ${sareeId}`}
      style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.borderDef}`, padding: 0, cursor: "pointer", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }}
    />
  ) : (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: `1px dashed ${T.borderDef}`, color: T.taupe, flexShrink: 0 }} title="No photo on file">
      <ImageOff size={13} />
    </span>
  );
}

export function DefectiveSareesSection({ superadmin = false }: { superadmin?: boolean; onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const [timeFiler, setTimeFilter] = useState("All Time");
  const [weaverFilter, setWeaverFilter] = useState("All Weavers");
  const [defectFilter, setDefectFilter] = useState("All Defect Types");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [viewDefect, setViewDefect] = useState<DefectiveRow | null>(null);
  const [dlWeaver, setDlWeaver] = useState("All Weavers");
  const [dlDefectType, setDlDefectType] = useState("All Defect Types");
  const [dlPeriod, setDlPeriod] = useState("This Month");
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);

  const { data: qcRecords = [], isLoading: qcLoading, isError: qcError } = useQuery({
    queryKey: ["qc", "all"],
    queryFn: () => qcApi.list().then(r => r.items),
  });
  const { data: weavers = [] } = useQuery({
    queryKey: ["weavers", "lookup"],
    queryFn: () => weaversApi.list().then(r => r.items),
  });
  const weaverLookup = useMemo(() => new Map(weavers.map(w => [w.id, w.name])), [weavers]);

  // The saree type and receipt photo aren't on the QC record itself — both
  // live on the batch row (BatchSareeRow.sareeTypeCode / receivedPhotoUrl),
  // captured back at Receive Sarees. Join by sareeId, same as the worker
  // portal's Received History.
  const { batches: allBatches } = useBatches();
  const rowLookup = useMemo(() => {
    const m = new Map<string, { sareeTypeCode: string | null; receivedPhotoUrl: string | null }>();
    for (const b of allBatches) for (const r of b.rows) if (r.sareeId) m.set(r.sareeId, { sareeTypeCode: r.sareeTypeCode, receivedPhotoUrl: r.receivedPhotoUrl });
    return m;
  }, [allBatches]);

  // Only DEFECTIVE-result QC records represent sarees that failed quality
  // check — SEMI/PASSED sarees aren't shown here.
  const DEFECTIVE_DATA: DefectiveRow[] = useMemo(
    () =>
      qcRecords
        .filter(r => r.result === "DEFECTIVE")
        .map(r => {
          const row = rowLookup.get(r.sareeId);
          return {
            id: r.sareeId,
            weaver: r.weaverId ? (weaverLookup.get(r.weaverId) ?? "Unknown Weaver") : "Own Factory",
            batch: r.batchId ?? "—",
            sareeType: row?.sareeTypeCode ?? "—",
            defects: r.defects,
            qcDate: new Date(r.qcDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            deduction: rupees(Math.round(Number(r.deduction))),
            photoUrl: row?.receivedPhotoUrl ?? null,
          };
        }),
    [qcRecords, weaverLookup, rowLookup],
  );

  const uniqueWeavers = useMemo(() => {
    const weavers = new Set<string>();
    DEFECTIVE_DATA.forEach(r => weavers.add(r.weaver));
    return Array.from(weavers).sort();
  }, [DEFECTIVE_DATA]);

  const uniqueDefects = useMemo(() => {
    const defects = new Set<string>();
    DEFECTIVE_DATA.forEach(r => r.defects.forEach(d => defects.add(d)));
    return Array.from(defects).sort();
  }, [DEFECTIVE_DATA]);

  const filteredData = useMemo(() => {
    return DEFECTIVE_DATA.filter(r => {
      if (weaverFilter !== "All Weavers" && r.weaver !== weaverFilter) return false;
      if (defectFilter !== "All Defect Types" && !r.defects.includes(defectFilter)) return false;
      return true;
    });
  }, [DEFECTIVE_DATA, weaverFilter, defectFilter]);

  const totalDeduction = addMoney(...filteredData.map(r => r.deduction));

  const columns: ColumnDef<DefectiveRow>[] = [
    { id: "sareeId", header: "Saree ID", accessor: r => r.id, priority: 1, cell: (_v, r) => <EntityCode type="saree" value={r.id} size="sm" /> },
    {
      id: "photo", header: "Photo", accessor: r => r.photoUrl,
      cell: (_v, r) => <DefectivePhotoCell url={r.photoUrl} sareeId={r.id} onView={setZoomImage} />,
    },
    { id: "weaver", header: "Weaver", accessor: r => r.weaver, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.weaver}</span> },
    { id: "batch", header: "Batch", accessor: r => r.batch, priority: 3, cell: (_v, r) => <EntityCode type="batch" value={r.batch} size="sm" /> },
    { id: "sareeType", header: "Saree Type", accessor: r => r.sareeType },
    {
      id: "defects", header: "Defect Type(s)", accessor: r => r.defects,
      cell: (_v, r) => (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
          {r.defects.map(d => (
            <span key={d} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 999 }}>{d}</span>
          ))}
        </div>
      ),
    },
    { id: "qcDate", header: "QC Date", accessor: r => r.qcDate, priority: 3, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.qcDate}</span> },
    {
      id: "deduction", header: "Deduction Applied", accessor: r => r.deduction,
      cell: (_v, r) => (
        <>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, display: "block" }}>{formatMoney(r.deduction)}</span>
          {superadmin && (
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, display: "block", marginTop: 3 }}>🔒 Full deduction details visible to Superadmin only</span>
          )}
        </>
      ),
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <Button onClick={() => setViewDefect(r)} variant="secondary" size="sm">
          <Eye size={13} /> View
        </Button>
      ),
    },
  ];

  return (
    <FadeUp>
      <section id="prod-defective" className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36, paddingBottom: 48 }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
          <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
            <div className="flex items-start gap-3.5 sm:gap-4 w-full">
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <SealWarning size={26} color="#FFFDF9" />
              </div>
              <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>Defective Sarees — Failed Quality Check</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>These sarees failed quality check by worker staff. They are stored separately. View only — no action can be taken from this page.</div>
                </div>
                <Button
                  onClick={() => setShowDownloadDialog(true)}
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  <DownloadSimple size={15} color={T.antiqueGold} /> Download Defective Report
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-6 md:p-7">
            <div style={{ background: "rgba(192,57,43,0.05)", border: `1px solid rgba(192,57,43,0.18)`, borderRadius: 10, padding: "10px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>This is a view-only section. Defective sarees are managed by the system automatically. Deductions have already been applied to the relevant weavers.</span>
            </div>

            {superadmin && (
              <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Shield size={14} color={T.antiqueGold} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.antiqueGold, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Superadmin Only — Not visible to Admin</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Deductions Applied This Month</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson, lineHeight: 1.1, marginBottom: 4 }}>
                      {formatMoney(totalDeduction)}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>🔒 Full deduction details visible to Superadmin only</div>
                  </div>
                  <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Defective Sarees All Time</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, marginBottom: 4 }}>
                      {filteredData.length} sarees
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>🔒 Superadmin only — not visible to Admin</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 mb-4 w-full max-w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none whitespace-nowrap shrink-0" style={{ WebkitOverflowScrolling: "touch" }}>
                  {["All Time", "This Month", "This Week", "Today"].map(f => (
                    <Button key={f} onClick={() => setTimeFilter(f)} variant={timeFiler === f ? "primary" : "secondary"} size="sm" className="shrink-0 whitespace-nowrap text-[12px]">{f}</Button>
                  ))}
                </div>
                <Select value={weaverFilter} onValueChange={setWeaverFilter} size="sm">
                  <SelectItem value="All Weavers">All Weavers</SelectItem>
                  {uniqueWeavers.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </Select>
                <Select value={defectFilter} onValueChange={setDefectFilter} size="sm">
                  <SelectItem value="All Defect Types">All Defect Types</SelectItem>
                  {uniqueDefects.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Mobile-only View Mode Toggle — compact inline w-fit, hidden on desktop */}
              <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white w-fit shrink-0">
                <Button
                  onClick={() => setViewMode("card")}
                  variant="ghost"
                  className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold w-auto ${viewMode === "card"
                      ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                      : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
                    }`}
                >
                  <LayoutGrid size={14} /> Card View
                </Button>
                <Button
                  onClick={() => setViewMode("table")}
                  variant="ghost"
                  className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold w-auto ${viewMode === "table"
                      ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                      : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
                    }`}
                >
                  <List size={14} /> Table View
                </Button>
              </div>
            </div>

            {/* Mobile View (Card View or Table View based on viewMode toggle) */}
            <div className="block md:hidden">
              {viewMode === "card" ? (
                qcLoading ? (
                  <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "32px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading defective sarees...</div>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "32px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No defective sarees recorded yet.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {filteredData.map(r => (
                      <div
                        key={r.id}
                        style={{
                          background: "#FFFFFF",
                          borderRadius: 16,
                          border: `1px solid ${T.borderDef}`,
                          boxShadow: "0 2px 12px rgba(74,6,27,0.06)",
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <DefectivePhotoCell url={r.photoUrl} sareeId={r.id} onView={setZoomImage} />
                            <EntityCode type="saree" value={r.id} size="sm" />
                          </div>
                          <Button onClick={() => setViewDefect(r)} variant="secondary" size="sm" className="h-8 px-2.5">
                            <Eye size={13} /> View
                          </Button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, fontFamily: F.ui, borderTop: `1px solid ${T.borderDef}`, paddingTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: T.taupe, fontSize: 13 }}>Weaver</span>
                            <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{r.weaver}</span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: T.taupe, fontSize: 13 }}>Saree Type</span>
                            <span style={{ color: T.luxuryBrown }}>{r.sareeType}</span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ color: T.taupe, fontSize: 13, flexShrink: 0 }}>Defect Type(s)</span>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {r.defects.map(d => (
                                <span key={d} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 999 }}>{d}</span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: T.taupe, fontSize: 13 }}>QC Date</span>
                            <span style={{ color: T.taupe, fontSize: 13 }}>{r.qcDate}</span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${T.borderDef}`, paddingTop: 10, marginTop: 2 }}>
                            <span style={{ color: T.taupe, fontSize: 13, fontWeight: 500 }}>Deduction Applied</span>
                            <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.crimson }}>{formatMoney(r.deduction)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", overflow: "hidden", marginBottom: 16 }}>
                  <div className="overflow-x-auto w-full">
                    <DataTable
                      columns={columns}
                      data={filteredData}
                      getRowId={r => r.id}
                      loading={qcLoading}
                      error={qcError}
                      emptyTitle="No defective sarees recorded yet."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View — always Table View */}
            <div className="hidden md:block" style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", overflow: "hidden", marginBottom: 16 }}>
              <div className="overflow-x-auto w-full">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  getRowId={r => r.id}
                  loading={qcLoading}
                  error={qcError}
                  emptyTitle="No defective sarees recorded yet."
                />
              </div>
            </div>

            <div style={{ background: T.warmCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 16px" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
                Total defective displayed: <strong>{filteredData.length} sarees</strong> · Total deductions applied: <strong style={{ fontFamily: F.ui, color: T.crimson }}>{formatMoney(totalDeduction)}</strong>
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showDownloadDialog && (
            <ProductionDialog open title="Download Defective Report" onClose={() => setShowDownloadDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Time Period</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Today", "This Week", "This Month", "All Time"].map(p => (
                      <Button key={p} onClick={() => setDlPeriod(p)} variant={dlPeriod === p ? "primary" : "tertiary"} size="sm">
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                  <Select value={dlWeaver} onValueChange={setDlWeaver}>
                    <SelectItem value="All Weavers">All Weavers</SelectItem>
                    {uniqueWeavers.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Defect Type</div>
                  <Select value={dlDefectType} onValueChange={setDlDefectType}>
                    <SelectItem value="All Defect Types">All Defect Types</SelectItem>
                    {uniqueDefects.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Defective Sarees</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{DEFECTIVE_DATA.length}</div>
                  </div>
                  <div style={{ background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Total Deductions</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: "#8B6018" }}>{formatMoney(addMoney(...DEFECTIVE_DATA.map(r => r.deduction)))}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button
                    onClick={() => setShowDownloadDialog(false)}
                    variant="primary"
                    size="lg"
                    className="flex-[2]"
                  >
                    <DownloadSimple size={18} /> Download PDF Report
                  </Button>
                  <Button onClick={() => setShowDownloadDialog(false)} variant="secondary" size="lg" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewDefect && (
            <ProductionDialog open title="Defective Saree — Details" onClose={() => setViewDefect(null)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {viewDefect.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setZoomImage({ url: viewDefect.photoUrl!, label: `Saree photo — ${viewDefect.id}` })}
                    title="Click to view full size"
                    style={{ display: "block", width: "100%", padding: 0, border: `1px solid ${T.borderDef}`, borderRadius: 10, cursor: "zoom-in", background: "none" }}
                  >
                    <img src={viewDefect.photoUrl} alt="Saree" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                  </button>
                ) : (
                  <div style={{ width: "100%", height: 90, borderRadius: 10, border: `1px dashed ${T.borderDef}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: T.taupe }}>
                    <ImageOff size={18} />
                    <span style={{ fontFamily: F.ui, fontSize: 11 }}>No photo on file</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewDefect.defects.map(d => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.09)", border: "1px solid rgba(192,57,43,0.22)", padding: "6px 14px", borderRadius: 99 }}>
                      <SealWarning size={14} color={T.crimson} /> {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10 }}>
                  {[
                    { label: "Saree ID", val: viewDefect.id, isCode: true, type: "saree" as const },
                    { label: "Weaver", val: viewDefect.weaver, isCode: false },
                    { label: "Batch", val: viewDefect.batch, isCode: true, type: "batch" as const },
                    { label: "Saree Type", val: viewDefect.sareeType, isCode: false },
                    { label: "QC Date", val: viewDefect.qcDate, isCode: false },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                      {r.isCode ? (
                        <EntityCode type={r.type!} value={r.val} size="sm" />
                      ) : (
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Deduction Applied to Weaver</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{formatMoney(viewDefect.deduction)}</div>
                  </div>
                  <SealWarning size={36} color={T.crimson} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
                  <WarningCircle size={16} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.5 }}>
                    This saree is stored separately in the defective stock area. Deduction has been automatically applied to the weaver's payment record.
                  </div>
                </div>
                <Button onClick={() => setViewDefect(null)} variant="primary" size="lg" fullWidth>
                  Close
                </Button>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>
      </section>
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </FadeUp>
  );
}
