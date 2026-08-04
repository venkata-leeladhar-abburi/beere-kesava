import React from "react";
import { AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { C, F } from "../tokens";

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
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Camera size={13} /> Take Photo
          </button>
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <UploadCloud size={13} /> Upload from Gallery
          </button>
        </div>
        <button onClick={onCancel} style={{ width: "100%", background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", padding: 8 }}>Cancel</button>
      </div>
    </div>
  );
}
