import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer } from "lucide-react";
import {
  Purchase, SareeTag,
  formatINR, lineProfit, purchaseTotals, expandSareePieces,
} from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

/** Full saree/barcode breakdown for one purchase — one row per physical piece. */
export function SareeListModal({
  purchase,
  onClose,
  onPrint,
  onPrintAll,
}: {
  purchase: Purchase;
  onClose: () => void;
  onPrint: (saree: SareeTag) => void;
  onPrintAll: () => void;
}) {
  // One row per physical saree — a line bought in bulk is tagged piece by piece.
  const pieces = expandSareePieces(purchase.sarees);
  type Piece = (typeof pieces)[number];

  const columns: ColumnDef<Piece>[] = [
    {
      id: "sno", header: "S.No", accessor: (_s) => pieces.indexOf(_s) + 1,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{pieces.indexOf(s) + 1}</span>,
    },
    {
      id: "sareeCode", header: "Saree Code", accessor: s => s.id,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>{s.id}</span>,
    },
    {
      id: "lineSerial", header: "Line Serial", accessor: s => s.lineCode,
      cell: (_v, s) => (
        <span style={{ whiteSpace: "nowrap" as const }}>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.lineCode}</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginLeft: 6 }}>pc {s.pieceNo}/{s.lineQuantity}</span>
        </span>
      ),
    },
    {
      id: "sareeType", header: "Saree Type", accessor: s => s.sareeType,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{s.sareeType || "—"}</span>,
    },
    {
      id: "colour", header: "Colour", accessor: s => s.color,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{s.color || "—"}</span>,
    },
    {
      id: "weight", header: "Weight", accessor: s => s.weight,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{s.weight}</span>,
    },
    {
      id: "buying", header: "Buying Price", accessor: s => s.price,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{formatINR(s.price)}</span>,
    },
    {
      id: "sellPct", header: "Sell %", accessor: s => s.sellPercent,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>{s.sellPercent}%</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>{formatINR(s.finalAmount)}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => lineProfit(s),
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.green, whiteSpace: "nowrap" as const }}>{formatINR(lineProfit(s))}</span>,
    },
    {
      id: "notes", header: "Notes", accessor: s => s.notes,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, maxWidth: 200 }}>{s.notes || "—"}</span>,
    },
    {
      id: "barcode", header: "Barcode", accessor: () => null, type: "actions",
      cell: (_v, s) => (
        <Button variant="primary" size="sm" iconLeft={Printer} onClick={() => onPrint(s)} className="whitespace-nowrap">
          Print
        </Button>
      ),
    },
  ];

  const totals = purchaseTotals(purchase.sarees);

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(27,12,8,0.55)" }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(94vw, 1040px)",
            maxHeight: "82vh",
            background: "#FFF",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              background: T.darkBurgundy,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF" }}>
                {purchase.id} — Saree Details
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.8)" }}>
                {purchase.supplier}
              </div>
            </div>
            <IconButton
              icon={X}
              label="Close"
              onClick={onClose}
              size="sm"
              className="rounded-full bg-white/12 text-white hover:bg-white/20"
            />
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            <DataTable columns={columns} data={pieces} getRowId={s => s.id} />
            {/* DataTable has no tfoot support — totals row rendered as a matching footer bar. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: T.silkCream,
                borderTop: `1px solid ${T.borderDef}`,
                padding: "10px 14px",
                flexWrap: "wrap" as const,
              }}
            >
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                Totals — {totals.pieces} piece{totals.pieces !== 1 ? "s" : ""}
              </span>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Buying {formatINR(totals.buying)}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>Selling {formatINR(totals.selling)}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" as const }}>Profit {formatINR(totals.profit)}</span>
            </div>
          </div>

          <div
            style={{
              padding: "14px 24px",
              borderTop: `1px solid ${T.borderDef}`,
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Button
              variant="primary"
              iconLeft={Printer}
              onClick={onPrintAll}
              fullWidth
              className="rounded-full"
            >
              Print All Barcodes
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-none rounded-full"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
