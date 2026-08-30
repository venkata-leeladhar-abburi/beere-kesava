import React, { useState } from "react";
import { AlertTriangle, Camera } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { Modal } from "../../../../shared/ui/overlay/Modal";
import { Button } from "../../../../shared/ui/primitives";
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
        <Row label="Deduction" value={<span style={{ color: T.crim }}>{item.deduction}</span>} />
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
