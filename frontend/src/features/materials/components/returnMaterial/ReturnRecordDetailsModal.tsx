import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { MaterialReturnRecord } from "../../contexts/MaterialReturnContext";
import { resolveSignatureUrl } from "../../../../shared/api/material-issues";
import { F, T } from "../issueMaterial/theme";
import { SectionPill } from "../issueMaterial/primitives";
import { materialIcon } from "../issueMaterial/materialFormatters";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill } from "../../../../shared/ui/domain/StatusPill";
import type { StatusValueOf } from "@/lib/domain/status";
import { rupees } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";

type MaterialLine = MaterialReturnRecord["materials"][number];

const RETURN_STATUS_TO_DOCUMENT: Record<MaterialReturnRecord["status"], StatusValueOf<"document">> = {
  "pending-signature": "pending",
  approved: "approved",
  cancelled: "void",
};

// Return-materials counterpart to issueMaterial/RecordDetailsModal.tsx —
// same layout, minus GRN-batch column (returns aren't drawn from a GRN),
// plus a Deduction section when the return didn't match what was outstanding.
export function ReturnRecordDetailsModal({ record, onClose }: { record: MaterialReturnRecord | null; onClose: () => void }) {
  if (!record) return null;

  const materialColumns: ColumnDef<MaterialLine>[] = [
    {
      id: "type", header: "Material", accessor: m => m.materialType,
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
      cell: (_v, m) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{m.quantity} {m.unit}</span>,
    },
  ];

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="lg">
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: T.warmIvory, borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ background: T.darkBurgundy, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Dialog.Title style={{ marginBottom: 4 }}>
              <EntityCode type="goodsReceipt" value={record.id} size="md" />
            </Dialog.Title>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{record.weaverName ?? record.factoryLoomNumber}{record.weaverId ? ` · ${record.weaverId}` : ""}{record.loomNumber ? ` · Loom ${record.loomNumber}` : ""}</div>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon="close"
              label="Close"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
            />
          </Dialog.Close>
        </div>
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column" as const, gap: 18, overflowY: "auto" as const }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Received By", val: record.receivedBy },
              { label: "Received At", val: new Date(record.receivedAt).toLocaleString("en-IN") },
              { label: "Signature Method", val: record.signatureMethod === "here" ? "Signed on Admin device" : "Sent to weaver's phone" },
            ].map(r => (
              <div key={r.label} style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, textTransform: "capitalize" as const }}>{r.val}</div>
              </div>
            ))}
            <div style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>Status</div>
              <StatusPill taxonomy="document" status={RETURN_STATUS_TO_DOCUMENT[record.status]} size="sm" />
            </div>
          </div>

          <div>
            <SectionPill label="Material Breakdown" />
            <div style={{ background: "#FFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <DataTable
                columns={materialColumns}
                data={record.materials}
                getRowId={m => `${m.materialType}-${record.materials.indexOf(m)}`}
              />
            </div>
          </div>

          {record.deductionAmount ? (
            <div>
              <SectionPill label="Deduction" />
              <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${T.antiqueGold}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color="#8B6018" />
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018" }}>
                  <Money value={rupees(record.deductionAmount)} />{record.deductionReason ? ` — ${record.deductionReason}` : ""}
                </div>
              </div>
            </div>
          ) : null}

          {record.notes && (
            <div>
              <SectionPill label="Notes" />
              <div style={{ background: "#FFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{record.notes}</div>
            </div>
          )}

          <div>
            <SectionPill label="Stock Impact" />
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              {record.materials.map((m) => (
                // Material line items have no unique id/sku field; composite key combines the item's own fields.
                <div key={`${m.materialType}-${m.quantity}-${m.unit}`} style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={13} color={T.green} /> Restored {m.quantity} {m.unit} of {m.materialType} back into raw material stock
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
      </div>
    </Modal>
  );
}
