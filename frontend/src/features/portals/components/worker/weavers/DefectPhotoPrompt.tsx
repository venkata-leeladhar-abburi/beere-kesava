import React from "react";
import { Camera, UploadCloud } from "lucide-react";
import { C, F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";

export function DefectPhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <Modal open onOpenChange={o => !o && onCancel()} size="xs">
      <Modal.Header
        banner
        icon={Camera}
        title="Photo Required"
        subtitle="Take or upload a photo of the defect as proof"
        onClose={onCancel}
      />
      <Modal.Body>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Photo proof is required to complete defect rejection and notify the weaver.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="primary" fullWidth size="sm" iconLeft={Camera} onClick={onCapture} className="h-11 rounded-[14px] bg-[#6E0F2D] hover:bg-[#5A0C24]">
            Take Photo
          </Button>
          <Button variant="secondary" fullWidth size="sm" iconLeft={UploadCloud} onClick={onCapture} className="h-11 rounded-[14px] border-[#6E0F2D] text-[#6E0F2D] hover:bg-[#6E0F2D]/10">
            Upload from Gallery
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" fullWidth onClick={onCancel}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}
