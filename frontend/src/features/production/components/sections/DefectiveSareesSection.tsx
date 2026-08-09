import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye } from "lucide-react";
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
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

interface DefectiveRow {
  id: string;
  weaver: string;
  batch: string;
  sareeType: string;
  defects: string[];
  qcDate: string;
  deduction: string;
}

export function DefectiveSareesSection({ superadmin = false }: { superadmin?: boolean; onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const [timeFiler, setTimeFilter] = useState("All Time");
  const [weaverFilter, setWeaverFilter] = useState("All Weavers");
  const [defectFilter, setDefectFilter] = useState("All Defect Types");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [viewDefect, setViewDefect] = useState<DefectiveRow | null>(null);
  const [dlWeaver, setDlWeaver] = useState("All Weavers");
  const [dlDefectType, setDlDefectType] = useState("All Defect Types");
  const [dlPeriod, setDlPeriod] = useState("This Month");

  const { data: qcRecords = [], isLoading: qcLoading, isError: qcError } = useQuery({
    queryKey: ["qc", "all"],
    queryFn: () => qcApi.list().then(r => r.items),
  });
  const { data: weavers = [] } = useQuery({
    queryKey: ["weavers", "lookup"],
    queryFn: () => weaversApi.list().then(r => r.items),
  });
  const weaverLookup = useMemo(() => new Map(weavers.map(w => [w.id, w.name])), [weavers]);

  // Only DEFECTIVE-result QC records represent sarees that failed quality
  // check — SEMI/PASSED sarees aren't shown here.
  const DEFECTIVE_DATA: DefectiveRow[] = useMemo(
    () =>
      qcRecords
        .filter(r => r.result === "DEFECTIVE")
        .map(r => ({
          id: r.sareeId,
          weaver: r.weaverId ? (weaverLookup.get(r.weaverId) ?? "Unknown Weaver") : "Own Factory",
          batch: r.batchId ?? "—",
          // NOTE(backend gap): BackendQcRecord doesn't include the saree type
          // — the QC list endpoint doesn't join batchSareeRow.sareeType, so
          // this column can't be populated without fabricating data.
          sareeType: "—",
          defects: r.defects,
          qcDate: new Date(r.qcDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          deduction: `₹${Math.round(Number(r.deduction)).toLocaleString("en-IN")}`,
        })),
    [qcRecords, weaverLookup],
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

  const totalDeduction = filteredData.reduce((sum, r) => sum + parseInt(r.deduction.replace(/[₹,]/g, "")), 0);

  const columns: ColumnDef<DefectiveRow>[] = [
    { id: "sareeId", header: "Saree ID", accessor: r => r.id, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{r.id}</span> },
    { id: "weaver", header: "Weaver", accessor: r => r.weaver, cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.weaver}</span> },
    { id: "batch", header: "Batch", accessor: r => r.batch, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.batch}</span> },
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
    { id: "qcDate", header: "QC Date", accessor: r => r.qcDate, cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.qcDate}</span> },
    {
      id: "deduction", header: "Deduction Applied", accessor: r => r.deduction,
      cell: (_v, r) => (
        <>
          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.crimson, display: "block" }}>{r.deduction}</span>
          {superadmin && (
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, display: "block", marginTop: 3 }}>🔒 Full deduction details visible to Superadmin only</span>
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
      <section id="prod-defective" style={{ padding: "36px 48px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 4, background: T.crimson, borderRadius: 2, alignSelf: "stretch" }} />
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: "0 0 4px 0", fontWeight: 600 }}>Defective Sarees — Failed Quality Check</h2>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>These sarees failed quality check by worker staff. They are stored separately. View only — no action can be taken from this page.</p>
            </div>
          </div>
          <Button
            onClick={() => setShowDownloadDialog(true)}
            variant="secondary"
          >
            <DownloadSimple size={16} color={T.antiqueGold} /> Download Defective Report
          </Button>
        </div>

        <div style={{ background: "rgba(192,57,43,0.05)", border: `1px solid rgba(192,57,43,0.18)`, borderRadius: 10, padding: "10px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>This is a view-only section. Defective sarees are managed by the system automatically. Deductions have already been applied to the relevant weavers.</span>
        </div>

        {superadmin && (
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Shield size={14} color={T.antiqueGold} />
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.antiqueGold, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Superadmin Only — Not visible to Admin</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Deductions Applied This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson, lineHeight: 1.1, marginBottom: 4 }}>
                  ₹{totalDeduction.toLocaleString("en-IN")}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>🔒 Full deduction details visible to Superadmin only</div>
              </div>
              <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Defective Sarees All Time</div>
                <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, marginBottom: 4 }}>
                  {filteredData.length} sarees
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>🔒 Superadmin only — not visible to Admin</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All Time", "This Month", "This Week", "Today"].map(f => (
              <Button key={f} onClick={() => setTimeFilter(f)} variant={timeFiler === f ? "primary" : "secondary"} size="sm">{f}</Button>
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

        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto", minWidth: 1100 }}>
            <DataTable
              columns={columns}
              data={filteredData}
              getRowId={r => r.id}
              loading={qcLoading}
              error={qcError}
              emptyTitle="No defective sarees recorded yet."
            />
          </div>
          <div style={{ background: T.warmCream, borderTop: `1px solid ${T.borderDef}`, padding: "12px 16px" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
              Total defective displayed: <strong>{filteredData.length} sarees</strong> · Total deductions applied: <strong style={{ fontFamily: F.mono, color: T.crimson }}>₹{totalDeduction.toLocaleString("en-IN")}</strong>
            </span>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Defective Sarees</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{DEFECTIVE_DATA.length}</div>
                  </div>
                  <div style={{ background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Total Deductions</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: "#8B6018" }}>₹{DEFECTIVE_DATA.reduce((s, r) => s + parseInt(r.deduction.replace(/[₹,]/g, "")), 0).toLocaleString("en-IN")}</div>
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
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewDefect.defects.map(d => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.09)", border: "1px solid rgba(192,57,43,0.22)", padding: "6px 14px", borderRadius: 99 }}>
                      <SealWarning size={14} color={T.crimson} /> {d}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Saree ID",    val: viewDefect.id,       mono: true  },
                    { label: "Weaver",      val: viewDefect.weaver,   mono: false },
                    { label: "Batch",       val: viewDefect.batch,    mono: true  },
                    { label: "Saree Type",  val: viewDefect.sareeType, mono: false },
                    { label: "QC Date",     val: viewDefect.qcDate,   mono: false },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Deduction Applied to Weaver</div>
                    <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson }}>{viewDefect.deduction}</div>
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
    </FadeUp>
  );
}
