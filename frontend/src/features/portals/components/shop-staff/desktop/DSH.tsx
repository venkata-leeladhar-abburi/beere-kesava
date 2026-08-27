import React from "react";
import { FileText } from "lucide-react";
import { C, F } from "../theme";
import { Button } from "../../../../../shared/ui/primitives";

/** Section heading with an optional right-aligned link button, used throughout the desktop layout. */
export function DSH({ label, link, onLink }: { label: string; link?: string; onLink?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
      </div>
      {link && (
        <Button onClick={onLink} variant="primary" size="sm" iconLeft={FileText} className="rounded-[14px] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] shadow-[0_2px_10px_rgba(110,15,45,0.28)]">
          {link}
        </Button>
      )}
    </div>
  );
}
