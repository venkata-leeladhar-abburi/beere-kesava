import React, { useState } from "react";
import { AlertTriangle, Camera } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { Modal } from "../../../../shared/ui/overlay/Modal";
import { Button, NumberInput } from "../../../../shared/ui/primitives";
import { useQc } from "@/features/qc";
import { rupees, formatMoney } from "@/lib/domain/money";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";

interface WorkerQCDefectiveDetailModalProps {
  item: DefectiveLogItem;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${T.bdr}` }}>
      <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function WorkerQCDefectiveDetailModal({ item, onClose }: WorkerQCDefectiveDetailModalProps) {
  const isSemi = item.result === "semi";
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  // Deduction is optional at inspection time — whether a defect costs the
  // weaver anything is often settled after talking to them — so it is added
  // or revised here instead.
  const { updateDeduction } = useQc();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | "">(item.deductionValue ?? "");
  const [saving, setSaving] = useState(false);
  const maxDeduction = item.makingChargeValue;

  const overCharge = maxDeduction != null && Number(draft || 0) > maxDeduction;

  const saveDeduction = async () => {
    if (draft === "" || overCharge) return;
    setSaving(true);
    try {
      await updateDeduction(item.recordId, Number(draft));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  // ImageZoomModal must be a sibling of <Modal>, not a child — Radix
  // Dialog.Content is translated (transform: translate(-50%,-50%)), and a
  // `position: fixed` descendant of a transformed ancestor is positioned
  // relative to that ancestor instead of the viewport, which would clip the
  // full-screen zoom overlay to the small dialog box instead of covering
  // the screen.
  return (
    <>
    <Modal open onOpenChange={o => !o && onClose()} size="sm">
      <Modal.Header
        banner
        icon={AlertTriangle}
        title={item.id}
        subtitle={isSemi ? "Semi-Approved — sent back for rework" : "Defective — rejected"}
        onClose={onClose}
      />
      <Modal.Body>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: isSemi ? T.bgGold : T.bgCrim, border: `1px solid ${isSemi ? "rgba(200,155,71,0.25)" : "rgba(192,57,43,0.20)"}` }}>
          <AlertTriangle size={16} color={isSemi ? T.gold : T.crim} />
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: isSemi ? T.gold : T.crim }}>
            {isSemi ? "Deduction withheld, saree returned to weaver for rework." : "Weaver is not paid for this saree."}
          </span>
        </div>

        {item.photoUrl ? (
          <button
            type="button"
            onClick={() => setZoomImage({ url: item.photoUrl!, label: `Defect photo — ${item.id}` })}
            title="Click to view full size"
            style={{ display: "block", width: "100%", padding: 0, border: `1px solid ${T.bdr}`, borderRadius: 8, marginBottom: 14, cursor: "zoom-in", background: "none" }}
          >
            <img src={item.photoUrl} alt="Defect proof" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
          </button>
        ) : (
          <div style={{ width: "100%", height: 100, borderRadius: 8, marginBottom: 14, border: `1px dashed ${T.bdrMed}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: T.muted }}>
            <Camera size={18} />
            <span style={{ fontFamily: F.u, fontSize: 11 }}>No defect photo on file</span>
          </div>
        )}

        <Row label="Weaver" value={item.weaver} />
        <Row label="Saree Type" value={item.sareeType || "—"} />
        <Row label="Batch" value={item.batchId ?? "—"} />
        <Row label="Received" value={item.receivedDate} />
        <Row label="QC Date" value={item.date} />
        <Row label="Inspected By" value={item.inspectedBy ?? "—"} />

        <div style={{ margin: "12px 0 4px", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: T.brown }}>Defects Found</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {item.defects.length === 0 ? (
            <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted }}>None recorded</span>
          ) : item.defects.map(df => (
            <span key={df} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: T.crim, background: T.bgCrim, border: "1px solid rgba(192,57,43,0.15)", padding: "3px 9px", borderRadius: 999 }}>{df}</span>
          ))}
        </div>

        {item.notes && (
          <>
            <div style={{ margin: "12px 0 4px", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: T.brown }}>Notes</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 12 }}>{item.notes}</div>
          </>
        )}

        <Row label="Making Charge" value={item.makingCharge} />
        <Row
          label="Deduction"
          value={
            editing ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <NumberInput
                  value={draft}
                  onValueChange={v => setDraft(v)}
                  step={0.01}
                  placeholder="0"
                  className="w-[130px] font-mono"
                />
                <Button size="sm" variant="primary" onClick={() => void saveDeduction()} disabled={draft === "" || overCharge || saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setDraft(item.deductionValue ?? ""); setEditing(false); }} disabled={saving}>
                  Cancel
                </Button>
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: T.crim }}>{item.deduction}</span>
                <Button size="sm" variant="link" onClick={() => setEditing(true)} className="p-0 h-auto">
                  {item.deductionValue ? "Edit" : "Add"}
                </Button>
              </span>
            )
          }
        />
        {editing && overCharge && (
          <div style={{ fontFamily: F.u, fontSize: 12, color: T.crim, textAlign: "right", padding: "4px 0" }}>
            Cannot exceed the {formatMoney(rupees(maxDeduction ?? 0))} making charge.
          </div>
        )}
        <Row label="Payable to Weaver" value={<span style={{ color: T.green }}>{item.payable}</span>} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
    <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </>
  );
}
