import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2 } from "lucide-react";
import { MaterialIssueRecord } from "../../contexts/MaterialIssueContext";
import { resolveSignatureUrl } from "../../../../shared/api/material-issues";
import { F, T } from "./theme";
import { SectionPill } from "./primitives";
import { describeMaterial, materialIcon } from "./materialFormatters";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import { StatusPill } from "../../../../shared/ui/domain/StatusPill";
import type { StatusValueOf } from "@/lib/domain/status";
import { EntityCode } from "@/shared/ui/domain";

type MaterialLine = MaterialIssueRecord["materials"][number];

// MaterialIssueRecord["status"] ("pending-signature" | "signed" | "cancelled")
// onto the shared document taxonomy (lib/domain/status.ts) — a material issue
// slip is a document awaiting a weaver's signature.
const ISSUE_STATUS_TO_DOCUMENT: Record<MaterialIssueRecord["status"], StatusValueOf<"document">> = {
  "pending-signature": "pending",
  signed: "signed",
  cancelled: "void",
};

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
          {describeMaterial(m) || "—"}
        </span>
      ),
    },
    {
      id: "qty", header: "Qty", accessor: m => m.quantity,
      cell: (_v, m) => <span style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 13, color: T.luxuryBrown }}>{m.quantity} {m.unit}</span>,
    },
    {
      // The specific received line, with its parent receipt underneath — the
      // same pair of ids Receive Stock shows for that delivery.
      id: "grn", header: "GRN Item", accessor: m => m.grnItemCode ?? m.grnBatchId,
      cell: (_v, m) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <EntityCode type="goodsReceipt" value={m.grnItemCode ?? m.grnBatchId} size="sm" />
          {m.grnItemCode && m.grnBatchId && (
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>of {m.grnBatchId}</span>
          )}
        </div>
      ),
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
            <Dialog.Description asChild>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              {record.weaverName ?? record.factoryLoomNumber}
              {record.weaverCode ? ` · ${record.weaverCode}` : ""}
              {record.loomNumber ? ` · Loom ${record.loomNumber}` : ""}
            </div>
            </Dialog.Description>
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
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
            {[
              { label: "Issued By", val: record.issuedBy },
              { label: "Issued At", val: new Date(record.issuedAt).toLocaleString("en-IN") },
              { label: "Signature Method", val: record.signatureMethod === "here" ? "Signed on Admin device" : "Sent to weaver's phone" },
            ].map(r => (
              <div key={r.label} style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, textTransform: "capitalize" as const }}>{r.val}</div>
              </div>
            ))}
            <div style={{ background: "#FFF", borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 3 }}>Status</div>
              <StatusPill taxonomy="document" status={ISSUE_STATUS_TO_DOCUMENT[record.status]} size="sm" />
            </div>
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
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {record.materials.map((m, idx) => {
                // How much the GRN line held before this slip drew from it.
                // Only known for issuances recorded against a specific line;
                // older rows show the deduction alone.
                const received = m.grnItemReceivedQty;
                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key -- issued lines have no stable client-side id; order is fixed per record
                    key={`${m.grnItemCode ?? m.grnBatchId}-${idx}`}
                    style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "9px 12px" }}
                  >
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <CheckCircle2 size={13} color={T.green} />
                      Reduced <strong>{m.quantity} {m.unit}</strong> of {m.materialType} from
                      <EntityCode type="goodsReceipt" value={m.grnItemCode ?? m.grnBatchId} size="sm" />
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 3, paddingLeft: 19 }}>
                      {received !== undefined
                        ? <>That line was received with {received} {m.unit} · {Math.max(0, received - m.quantity)} {m.unit} left after this slip</>
                        : <>Received on {m.grnBatchId}</>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!record.signatureCaptured && record.signatureMethod === "remote" && record.status === "pending-signature" && (
            <div>
              <SectionPill label="Signature" />
              <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                  Awaiting {record.weaverName ?? "the weaver"}&apos;s signature — they can sign this from their dashboard&apos;s Confirm Materials page.
                </span>
              </div>
            </div>
          )}

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
