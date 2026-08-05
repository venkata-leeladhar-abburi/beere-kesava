import React from "react";
import { RotateCcw, Save } from "lucide-react";
import { F, T } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";

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
        <Button variant="tertiary" size="sm" iconLeft={RotateCcw}>
          Reset to Default
        </Button>
        <Button variant="primary" size="md" iconLeft={Save}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
