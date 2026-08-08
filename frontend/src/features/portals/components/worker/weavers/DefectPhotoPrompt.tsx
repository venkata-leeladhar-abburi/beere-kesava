import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { C, F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";

export function DefectPhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <Modal open onOpenChange={o => !o && onCancel()} size="xs">
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={18} color={C.crim} />
          <Dialog.Title asChild>
            <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text }}>Photo Required</span>
          </Dialog.Title>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Take a photo of the defect as proof. This is required to complete the rejection.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Button variant="primary" fullWidth size="sm" iconLeft={Camera} onClick={onCapture} className="h-11 rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A]">
            Take Photo
          </Button>
          <Button variant="secondary" fullWidth size="sm" iconLeft={UploadCloud} onClick={onCapture} className="h-11 rounded-full border-[#6B1A2A] text-[#6B1A2A]">
            Upload from Gallery
          </Button>
        </div>
        <Button variant="link" fullWidth onClick={onCancel} className="text-xs text-[#69635E] p-2">Cancel</Button>
      </div>
    </Modal>
  );
}
