import React from "react";
import { FileText } from "lucide-react";
import { C, F } from "../theme";

/** Section heading with an optional right-aligned link button, used throughout the desktop layout. */
export function DSH({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
      </div>
      {link && (
        <button onClick={onLink} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
          <FileText size={14} color="#FFF" /> {link}
        </button>
      )}
    </div>
  );
}
