import React from "react";
import { motion } from "motion/react";
import { Scan, X, ShoppingBag, Users, FileText } from "lucide-react";
import { T, F, EASE, card } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";

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
          <Button variant="primary" size="sm" iconLeft={Scan} onClick={onScan} className="shrink-0">
            Scan
          </Button>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
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
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 4px 20px rgba(61,14,26,0.20)",
          }}
        >
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", flex: "1 1 200px" }}>
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
            <Button
              onClick={() => onOpenModal("shop")}
              iconLeft={ShoppingBag}
              className="bg-[var(--bk-gold-500)] text-[var(--bk-burgundy-950)] font-bold hover:bg-[var(--bk-gold-500)]/90 border-none shadow-none"
            >
              Dispatch to Shop
            </Button>
          )}
          {canDispatchWholesale && (
            <Button
              onClick={() => onOpenModal("wholesale")}
              iconLeft={Users}
              className="bg-white text-[var(--text-brand)] font-bold hover:bg-white/90 border-none shadow-none"
            >
              Dispatch to Wholesale
            </Button>
          )}
          {canRaiseQuotation && (
            <Button
              onClick={() => onOpenModal("quotation")}
              iconLeft={FileText}
              className="bg-transparent text-white font-bold border border-white/35 hover:bg-white/10 shadow-none"
            >
              Raise Quotation
            </Button>
          )}
          {selectedCount > 0 && (
            <IconButton
              icon={X}
              label="Clear selection"
              onClick={onClearSelection}
              size="sm"
              className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25"
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
