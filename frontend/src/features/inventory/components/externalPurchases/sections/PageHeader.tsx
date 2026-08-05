import React from "react";
import { Download, Plus } from "lucide-react";
import { T, F } from "../theme";
import { Button } from "../../../../../shared/ui/primitives";

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
            fontSize: 12,
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
            fontSize: 30,
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
        <Button
          variant="secondary"
          size="sm"
          iconLeft={Download}
          className="bg-transparent text-white border border-white/25 hover:bg-white/10 shadow-none"
        >
          Export
        </Button>
        <Button
          onClick={onAdd}
          size="sm"
          iconLeft={Plus}
          className="bg-[var(--bk-gold-500)] text-[#3B2314] font-semibold hover:bg-[var(--bk-gold-500)]/90 border-none shadow-none"
        >
          Add External Purchase
        </Button>
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
