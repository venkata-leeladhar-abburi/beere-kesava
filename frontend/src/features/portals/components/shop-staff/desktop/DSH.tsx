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
        <Button onClick={onLink} variant="primary" size="sm" iconLeft={FileText} className="rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A] shadow-[0_2px_10px_rgba(107,26,42,0.28)]">
          {link}
        </Button>
      )}
    </div>
  );
}
