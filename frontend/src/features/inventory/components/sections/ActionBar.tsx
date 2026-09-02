import { useState } from "react";
import { motion } from "motion/react";
import { Scan, X, ShoppingBag, Users, FileText } from "lucide-react";
import { T, F, EASE, card } from "../theme";
import { Button, IconButton, Input } from "../../../../shared/ui/primitives";
import { CameraScannerModal } from "../../../../shared/ui/CameraScannerModal";
import { WeaverSareeRow, externalSerialOf } from "@/features/weavers";
import { formatMoney, rupees } from "@/lib/domain/money";

interface ActionBarProps {
  hasAnyDispatchAction: boolean;
  selectedCount: number;
  dispatchableSelectedCount: number;
  scanMsg: string;
  /** The saree a scan just matched — shown as a non-blocking detail card so
   *  scanning several sarees in a row (a normal bulk-dispatch workflow)
   *  never gets interrupted by a modal. Cleared by the next scan attempt. */
  scanDetail?: WeaverSareeRow | null;
  onScan: (sareeId: string) => void;
  canDispatchShop: boolean;
  canDispatchWholesale: boolean;
  canRaiseQuotation: boolean;
  onOpenModal: (modalType: "shop" | "wholesale" | "quotation") => void;
  onClearSelection: () => void;
}

/** All the fields printed on that saree's tag — supplier short name,
 *  invoice, serial, saree type, weight/colour, cost + selling price for an
 *  external-purchase piece; weaver/loom/weight/date for a woven one. */
function ScanDetailCard({ r }: { r: WeaverSareeRow }) {
  const isExternal = r.stock?.origin === "external";
  const inr = (n: number) => formatMoney(rupees(n));

  const fields: { label: string; value: string }[] = isExternal
    ? [
        { label: "Supplier", value: r.stock?.supplier || "—" },
        { label: "Invoice No.", value: r.stock?.invoiceNumber || "—" },
        { label: "Serial No.", value: externalSerialOf(r.sareeId) || "—" },
        { label: "Saree Type", value: r.sareeTypeName || "—" },
        { label: "Colour", value: r.color || "—" },
        { label: "Weight", value: r.stock?.weight || "—" },
        { label: "Cost Price", value: r.stock?.costPrice != null ? inr(r.stock.costPrice) : "—" },
        { label: "Selling Price", value: r.stock?.finalAmount != null ? inr(r.stock.finalAmount) : "—" },
      ]
    : [
        { label: "Weaver / Loom", value: [r.ownerLabel, r.loomNumber != null ? `Loom ${r.loomNumber}` : null].filter(Boolean).join(" · ") || "—" },
        { label: "Saree Type", value: r.sareeTypeName || "—" },
        { label: "Colour", value: r.color || "—" },
        { label: "Weight", value: r.weight != null ? `${r.weight}g` : "—" },
        { label: "Batch", value: r.batchId || "—" },
        { label: "Date", value: r.qcDate || r.receivedDate || r.assignedDate || "—" },
      ];

  return (
    <div
      style={{
        marginTop: 2,
        background: "#FFF",
        border: `1px solid ${T.borderDef}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: T.royalBurgundy }}>{r.sareeId}</span>
        {isExternal && (
          <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.antiqueGold, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
            External Purchase
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10 }}>
        {fields.map(f => (
          <div key={f.label}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.4px", marginBottom: 2 }}>
              {f.label}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, wordBreak: "break-word" as const }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActionBar({
  hasAnyDispatchAction,
  selectedCount,
  dispatchableSelectedCount,
  scanMsg,
  scanDetail,
  onScan,
  canDispatchShop,
  canDispatchWholesale,
  canRaiseQuotation,
  onOpenModal,
  onClearSelection,
}: ActionBarProps) {
  const [scanValue, setScanValue] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleDetected = (text: string) => {
    setCameraOpen(false);
    onScan(text);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toolbar */}
      <div style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Barcode scanners type the code and press Enter, so the same input
            serves both a physical scanner and manual entry. One Scan button
            covers both routes: with an ID in the field it looks that up, and
            with the field empty it opens the camera for devices that have no
            hardware scanner attached. */}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!scanValue.trim()) { setCameraOpen(true); return; }
            onScan(scanValue);
            setScanValue("");
          }}
          style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}
        >
          <Input
            value={scanValue}
            onChange={e => setScanValue(e.target.value)}
            placeholder="Scan barcode or type saree ID"
            aria-label="Saree ID to scan"
            className="w-[260px] font-mono"
          />
          <Button type="submit" variant="primary" size="sm" iconLeft={Scan} className="shrink-0">
            Scan
          </Button>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            Selects the scanned saree in the table below — press Scan with the box empty to use the camera.
          </span>
        </form>
        <CameraScannerModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onDetected={handleDetected}
          title="Scan Saree Barcode"
          hint="Point the camera at the barcode tag on the saree label."
        />

        {/* Scan feedback */}
        {scanMsg && (
          <div
            style={{
              marginTop: 2,
              background: "rgba(110,15,45,0.05)",
              border: `1px solid rgba(110,15,45,0.12)`,
              borderRadius: 8,
              padding: "7px 12px",
              fontFamily: F.ui,
              fontSize: 12,
              color: T.royalBurgundy,
            }}
          >
            {scanMsg}
          </div>
        )}

        {scanDetail && <ScanDetailCard r={scanDetail} />}
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
