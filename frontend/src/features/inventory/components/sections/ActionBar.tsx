import React from "react";
import { motion } from "motion/react";
import { Scan, X, ShoppingBag, Users, FileText } from "lucide-react";
import { T, F, EASE, card } from "../theme";

interface ActionBarProps {
  hasAnyDispatchAction: boolean;
  selectedCount: number;
  dispatchableSelectedCount: number;
  scanMsg: string;
  onScan: () => void;
  canDispatchShop: boolean;
  canDispatchWholesale: boolean;
  canRaiseQuotation: boolean;
  onOpenModal: (modalType: "shop" | "wholesale" | "quotation") => void;
  onClearSelection: () => void;
}

export function ActionBar({
  hasAnyDispatchAction,
  selectedCount,
  dispatchableSelectedCount,
  scanMsg,
  onScan,
  canDispatchShop,
  canDispatchWholesale,
  canRaiseQuotation,
  onOpenModal,
  onClearSelection,
}: ActionBarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toolbar */}
      <div style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          {/* Scan */}
          <button
            onClick={onScan}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 14px",
              height: 38,
              background: T.deepWine,
              border: "none",
              borderRadius: 10,
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 13,
              color: "#FFF",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap" as const,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = T.royalBurgundy;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = T.deepWine;
            }}
          >
            <Scan size={14} color="#FFF" /> Scan
          </button>
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
            Scans a random unselected saree from the table below and selects it.
          </span>
        </div>

        {/* Scan feedback */}
        {scanMsg && (
          <div
            style={{
              marginTop: 2,
              background: "rgba(110,15,45,0.05)",
              border: `1px solid rgba(110,15,45,0.12)`,
              borderRadius: 8,
              padding: "7px 12px",
              fontFamily: F.mono,
              fontSize: 12,
              color: T.royalBurgundy,
            }}
          >
            {scanMsg}
          </div>
        )}
      </div>

      {/* Action bar — always visible so the dispatch routes are discoverable
          before any saree is picked. The modals themselves gate on selection.
          Folds away entirely once every dispatch route is closed off. */}
      {hasAnyDispatchAction && (
        <motion.div
          layout
          transition={{ duration: 0.2, ease: EASE }}
          style={{
            background: T.deepWine,
            borderRadius: 14,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 4px 20px rgba(61,14,26,0.20)",
          }}
        >
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", flex: 1 }}>
            {selectedCount > 0 ? (
              <>
                <strong style={{ color: "#FFF" }}>{selectedCount}</strong> selected
                {dispatchableSelectedCount !== selectedCount && ` (${dispatchableSelectedCount} ready for dispatch)`}
              </>
            ) : (
              <>
                No sarees selected —{" "}
                <span style={{ color: "rgba(255,255,255,0.62)" }}>
                  pick sarees from the table below, or open an action to start
                </span>
              </>
            )}
          </span>
          {canDispatchShop && (
            <button
              onClick={() => onOpenModal("shop")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "0 18px",
                height: 40,
                background: T.antiqueGold,
                border: "none",
                borderRadius: 10,
                fontFamily: F.ui,
                fontWeight: 700,
                fontSize: 13,
                color: T.deepWine,
                cursor: "pointer",
              }}
            >
              <ShoppingBag size={15} /> Dispatch to Shop
            </button>
          )}
          {canDispatchWholesale && (
            <button
              onClick={() => onOpenModal("wholesale")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "0 18px",
                height: 40,
                background: "#FFF",
                border: "none",
                borderRadius: 10,
                fontFamily: F.ui,
                fontWeight: 700,
                fontSize: 13,
                color: T.royalBurgundy,
                cursor: "pointer",
              }}
            >
              <Users size={15} /> Dispatch to Wholesale
            </button>
          )}
          {canRaiseQuotation && (
            <button
              onClick={() => onOpenModal("quotation")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "0 18px",
                height: 40,
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.35)`,
                borderRadius: 10,
                fontFamily: F.ui,
                fontWeight: 700,
                fontSize: 13,
                color: "#FFF",
                cursor: "pointer",
              }}
            >
              <FileText size={15} /> Raise Quotation
            </button>
          )}
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              title="Clear selection"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} color="#FFF" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
