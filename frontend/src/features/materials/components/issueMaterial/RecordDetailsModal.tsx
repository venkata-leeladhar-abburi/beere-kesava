import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import { MaterialIssueRecord } from "../../contexts/MaterialIssueContext";
import { EASE, F, T } from "./theme";
import { SectionPill } from "./primitives";
import { materialIcon } from "./materialFormatters";

// ── View Details Modal ────────────────────────────────────────────────────────
export function RecordDetailsModal({ record, onClose }: { record: MaterialIssueRecord; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed" as const, inset: 0, zIndex: 1000, background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: EASE }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 620, maxWidth: "calc(100vw - 48px)", maxHeight: "88vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ background: T.darkBurgundy, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 16, color: T.goldLight, fontWeight: 700, marginBottom: 4 }}>{record.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{record.weaverName} · {record.weaverId}{record.loomNumber ? ` · Loom ${record.loomNumber}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#FFF" /></button>
        </div>
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column" as const, gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Issued By", val: record.issuedBy },
              { label: "Issued At", val: new Date(record.issuedAt).toLocaleString("en-IN") },
              { label: "Signature Method", val: record.signatureMethod === "here" ? "Signed on Admin device" : "Sent to weaver's phone" },
              { label: "Status", val: record.status.replace("-", " ") },
            ].map(r => (
              <div key={r.label} style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, textTransform: "capitalize" as const }}>{r.val}</div>
              </div>
            ))}
          </div>

          <div>
            <SectionPill label="Material Breakdown" />
            <div style={{ background: "#FFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead style={{ background: T.warmCream }}>
                  <tr>
                    {["Type", "Details", "Qty", "GRN Batch"].map(h => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left" as const, fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {record.materials.map((m, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.borderDef}` }}>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 7 }}>{materialIcon(m.materialType)} {m.materialType}</td>
                      <td style={{ padding: "10px 14px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        {m.materialType === "Warp" ? m.warpSubtype : m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || m.jariColor || "—")}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{m.quantity} {m.unit}</td>
                      <td style={{ padding: "10px 14px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{m.grnBatchId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {record.notes && (
            <div>
              <SectionPill label="Notes" />
              <div style={{ background: "#FFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{record.notes}</div>
            </div>
          )}

          <div>
            <SectionPill label="Stock Impact" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {record.materials.map((m, i) => (
                <div key={i} style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={13} color={T.green} /> Reduced {m.quantity} {m.unit} from <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{m.grnBatchId}</span>
                </div>
              ))}
            </div>
          </div>

          {record.signatureCaptured && record.signatureTimestamp && (
            <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} color={T.green} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green }}>Signed on {new Date(record.signatureTimestamp).toLocaleString("en-IN")}</span>
            </div>
          )}

          <button onClick={onClose} style={{ height: 46, borderRadius: 12, border: "none", background: T.royalBurgundy, color: "#FFF", fontFamily: F.ui, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}
