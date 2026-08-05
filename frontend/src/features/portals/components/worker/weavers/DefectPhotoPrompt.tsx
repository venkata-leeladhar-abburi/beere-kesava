import React from "react";
import { AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { C, F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";

export function DefectPhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(27,12,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, padding: 20, width: "min(92vw, 340px)", boxShadow: "0 24px 60px rgba(27,12,8,0.30)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={18} color={C.crim} />
          <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text }}>Photo Required</span>
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
    </div>
  );
}
