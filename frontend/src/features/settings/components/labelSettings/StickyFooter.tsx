import React from "react";
import { RotateCcw, Save } from "lucide-react";
import { F, T } from "./primitives";

export function StickyFooter() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "white",
        borderTop: "1px solid rgba(110,15,45,0.10)",
        boxShadow: "0 -4px 20px rgba(44,24,16,0.07)",
        padding: "14px 56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Last saved: Today at 2:34 PM
      </span>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          style={{
            background: "transparent",
            border: "none",
            color: T.taupe,
            fontFamily: F.ui,
            fontWeight: 500,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={13} />
          Reset to Default
        </button>
        <button
          style={{
            background: "#6E0F2D",
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "9px 24px",
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <Save size={14} />
          Save Settings
        </button>
      </div>
    </div>
  );
}
