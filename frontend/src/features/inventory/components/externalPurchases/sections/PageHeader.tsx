import React from "react";
import { Download, Plus } from "lucide-react";
import { T, F } from "../theme";

/** Hero banner + Export/Add action buttons for the External Purchases page. */
export function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        background: T.darkBurgundy,
        padding: "44px 56px 90px",
        position: "relative",
        overflow: "hidden",
        minHeight: 180,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            color: T.antiqueGold,
            opacity: 0.5,
            letterSpacing: 2,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          SINCE 1999 · EXTERNAL PURCHASES
        </div>
        <h1
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 42,
            color: "white",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          External Purchases
        </h1>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 28,
            color: T.antiqueGold,
            marginTop: 2,
            marginBottom: 14,
          }}
        >
          &amp; Branch Inventory Oversight
        </div>
        <p
          style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: "rgba(255,255,255,0.60)",
            maxWidth: 480,
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          Track every saree purchased from external suppliers — with GST,
          invoice details, and an auto-generated printable barcode for each
          saree. Visible across all branches.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          zIndex: 10,
          alignSelf: "center",
          flexShrink: 0,
        }}
      >
        <button
          style={{
            border: "1px solid rgba(255,255,255,0.25)",
            background: "transparent",
            color: "white",
            borderRadius: 8,
            padding: "8px 14px",
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <Download size={13} />
          Export
        </button>
        <button
          onClick={onAdd}
          style={{
            background: T.antiqueGold,
            color: "#3B2314",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <Plus size={13} />
          Add External Purchase
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: -60,
          right: 40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "2px solid rgba(200,155,71,0.13)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -20,
          right: 100,
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "2px solid rgba(200,155,71,0.09)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
