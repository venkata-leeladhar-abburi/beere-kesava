import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check } from "lucide-react";
import { MaterialIssueRecord } from "../../../materials/contexts/MaterialIssueContext";
import { C, F, SectionTitle } from "./theme";

interface SareeLogItem {
  batchId: string;
  sareeId: string;
  designCode: string;
  sareeTypeCode: string;
  sareeTypeName: string;
  loom: string | number;
  qcPassed: boolean | null;
}

interface WeavingBatchItem {
  batchId: string;
  status: string;
  dueDate?: string;
  rowsCount: number;
  passedCount: number;
}

interface ReferenceHistorySectionProps {
  signedRecords: MaterialIssueRecord[];
  myWeavingBatches: WeavingBatchItem[];
  mySarees: SareeLogItem[];
  isMobile: boolean;
  isTablet: boolean;
}

export function ReferenceHistorySection({
  signedRecords,
  myWeavingBatches,
  mySarees,
  isMobile,
  isTablet,
}: ReferenceHistorySectionProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"materials" | "batches" | "sarees">("materials");

  return (
    <div style={{ marginTop: 28 }}>
      <button onClick={() => setHistoryOpen(v => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionTitle title="Complete Reference History" />
        <ChevronRight size={18} color={C.muted} style={{ transform: historyOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <AnimatePresence>
        {historyOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            
            <div style={{ display: "flex", gap: 10, padding: "10px 20px 16px 20px", borderBottom: `1px solid ${C.bdr}` }}>
              {[
                { id: "materials", label: "Material Receipts" },
                { id: "batches", label: "Weaving Batches" },
                { id: "sarees", label: "Saree Work Log" }
              ].map(t => (
                <button key={t.id} onClick={() => setHistoryTab(t.id as any)} style={{
                  padding: "8px 16px", borderRadius: 999, border: `1px solid ${historyTab === t.id ? C.burg : C.bdr}`,
                  background: historyTab === t.id ? C.burg : "transparent",
                  color: historyTab === t.id ? "#FFF" : C.muted,
                  fontFamily: F.u, fontWeight: 600, fontSize: 12, cursor: "pointer"
                }}>{t.label}</button>
              ))}
            </div>

            {/* TAB 1: Material Receipts */}
            {historyTab === "materials" && (
              signedRecords.length === 0 ? (
                <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No confirmed material receipts yet.</div>
                </div>
              ) : isMobile ? (
                <div style={{ marginTop: 12 }}>
                  {signedRecords.map(r => (
                    <div key={r.id} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{r.id}</span>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>
                        {r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}
                      </div>
                      {r.signatureTimestamp && (
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                          <Check size={12} /> Confirmed by you on {new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                  <div style={{ minWidth: isTablet ? 560 : undefined }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1.2fr 1.2fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                      {["Date", "Materials", "MIR ID", "Status"].map(h => (
                        <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                      ))}
                    </div>
                    {signedRecords.map(r => (
                      <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1.2fr 1.2fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.materials.map(m => `${m.materialType} ${m.quantity}${m.unit}`).join(" · ")}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>
                          <Check size={12} /> Confirmed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* TAB 2: Weaving Batches */}
            {historyTab === "batches" && (
              myWeavingBatches.length === 0 ? (
                <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No weaving batches assigned yet.</div>
                </div>
              ) : isMobile ? (
                <div style={{ marginTop: 12 }}>
                  {myWeavingBatches.map(b => (
                    <div key={b.batchId} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: b.status === "active" ? C.green : C.gold, fontWeight: 600 }}>
                          {b.status === "active" ? "🟢 Active" : "🟡 Draft"}
                        </span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8 }}>
                        Progress: <strong>{b.passedCount}</strong> of <strong>{b.rowsCount}</strong> sarees passed QC
                      </div>
                      {b.dueDate && (
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                          Due Date: {b.dueDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                  <div style={{ minWidth: isTablet ? 560 : undefined }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.2fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                      {["Batch ID", "Status", "Progress", "Due Date"].map(h => (
                        <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                      ))}
                    </div>
                    {myWeavingBatches.map(b => (
                      <div key={b.batchId} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1.5fr 1.2fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                        <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{b.batchId}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: b.status === "active" ? C.green : C.gold, fontWeight: 600 }}>
                          {b.status === "active" ? "🟢 Active" : "🟡 Draft"}
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
                          {b.passedCount} / {b.rowsCount} wove & passed
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{b.dueDate || "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* TAB 3: Saree Work Log */}
            {historyTab === "sarees" && (
              mySarees.length === 0 ? (
                <div style={{ margin: "16px 20px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No sarees logged yet.</div>
                </div>
              ) : isMobile ? (
                <div style={{ marginTop: 12 }}>
                  {mySarees.map((s, i) => (
                    <div key={i} style={{ margin: "0 20px 12px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{s.sareeId}</span>
                        <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{s.batchId}</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 8 }}>
                        Type: {s.sareeTypeCode} · Loom {s.loom}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: s.qcPassed === true ? C.green : s.qcPassed === false ? C.crim : C.gold }}>
                          {s.qcPassed === true ? "✓ Passed QC" : s.qcPassed === false ? "❌ Defective (QC Failed)" : "⏳ In Progress"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ margin: "16px 20px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
                  <div style={{ minWidth: isTablet ? 640 : undefined }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr 1.5fr", padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.cream }}>
                      {["Saree ID", "Batch ID", "Saree Type", "Loom", "QC Status"].map(h => (
                        <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted }}>{h}</div>
                      ))}
                    </div>
                    {mySarees.map((s, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr 1fr 1.5fr", padding: "12px 16px", borderBottom: `1px solid rgba(107,26,42,0.06)`, alignItems: "center" }}>
                        <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.sareeId}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{s.batchId}</div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
                          <strong>{s.sareeTypeCode}</strong> · {s.sareeTypeName}
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Loom {s.loom}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: s.qcPassed === true ? C.green : s.qcPassed === false ? C.crim : C.gold }}>
                          {s.qcPassed === true ? "✓ Passed QC" : s.qcPassed === false ? "❌ Defective" : "⏳ In Progress"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
