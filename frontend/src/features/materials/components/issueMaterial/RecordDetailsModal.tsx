import React from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { MaterialIssueRecord } from "../../contexts/MaterialIssueContext";
import { resolveSignatureUrl } from "../../../../shared/api/material-issues";
import { EASE, F, T } from "./theme";
import { SectionPill } from "./primitives";
import { materialIcon } from "./materialFormatters";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

type MaterialLine = MaterialIssueRecord["materials"][number];

// ── View Details Modal ────────────────────────────────────────────────────────
export function RecordDetailsModal({ record, onClose }: { record: MaterialIssueRecord; onClose: () => void }) {
  const materialColumns: ColumnDef<MaterialLine>[] = [
    {
      id: "type", header: "Type", accessor: m => m.materialType,
      cell: (_v, m) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 7 }}>{materialIcon(m.materialType)} {m.materialType}</span>,
    },
    {
      id: "details", header: "Details", accessor: m => m.description,
      cell: (_v, m) => (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          {m.materialType === "Warp" ? m.warpSubtype : m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || m.jariColor || "—")}
        </span>
      ),
    },
    {
      id: "qty", header: "Qty", accessor: m => m.quantity,
      cell: (_v, m) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{m.quantity} {m.unit}</span>,
    },
    {
      id: "grn", header: "GRN Batch", accessor: m => m.grnBatchId,
      cell: (_v, m) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{m.grnBatchId}</span>,
    },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed" as const, inset: 0, zIndex: "var(--z-modal)", background: "rgba(30,10,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: EASE }}
        style={{ background: T.warmIvory, borderRadius: 20, width: 620, maxWidth: "calc(100vw - 48px)", maxHeight: "88vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ background: T.darkBurgundy, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 16, color: T.goldLight, fontWeight: 700, marginBottom: 4 }}>{record.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{record.weaverName} · {record.weaverId}{record.loomNumber ? ` · Loom ${record.loomNumber}` : ""}</div>
          </div>
          <IconButton
            icon="close"
            label="Close"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
          />
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
              <DataTable
                columns={materialColumns}
                data={record.materials}
                getRowId={m => `${m.grnBatchId}-${m.materialType}-${record.materials.indexOf(m)}`}
              />
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
            <div>
              <SectionPill label="Signature" />
              <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: record.signatureUrl ? 10 : 0 }}>
                <CheckCircle2 size={14} color={T.green} />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green }}>Signed on {new Date(record.signatureTimestamp).toLocaleString("en-IN")}</span>
              </div>
              {record.signatureUrl && (
                <img
                  src={resolveSignatureUrl(record.signatureUrl) ?? undefined}
                  alt={`${record.weaverName ?? "Weaver"}'s signature`}
                  style={{ maxHeight: 100, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 8 }}
                />
              )}
            </div>
          )}

          <Button variant="primary" size="lg" onClick={onClose} className="w-full">Close</Button>
        </div>
      </motion.div>
    </div>
  );
}
