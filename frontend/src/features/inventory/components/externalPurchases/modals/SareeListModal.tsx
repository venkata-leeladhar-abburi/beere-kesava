import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, Undo2 } from "lucide-react";
import {
  Purchase, SareeTag,
  lineProfit, purchaseTotals, expandSareePieces, useSuppliers,
} from "../../../../suppliers/contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { Modal } from "../../../../../shared/ui/overlay";
import { useDocument } from "../../../../../shared/ui/document";

/** Full saree/barcode breakdown for one purchase — one row per physical piece. */
export function SareeListModal({
  purchase,
  onClose,
  onPrint,
}: {
  purchase: Purchase;
  onClose: () => void;
  onPrint: (saree: SareeTag) => void;
}) {
  const { print } = useDocument();
  const { returnSareePieces } = useSuppliers();
  // One row per physical saree — a line bought in bulk is tagged piece by piece.
  const pieces = expandSareePieces(purchase.sarees);
  type Piece = (typeof pieces)[number];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Only not-yet-returned pieces can be selected — a returned piece has
  // nothing left to act on.
  const selectablePieces = pieces.filter(s => !s.returned);
  const selectedReturnablePieces = pieces.filter(s => selectedIds.has(s.id) && !s.returned);

  const handleReturnSelected = () => {
    if (selectedReturnablePieces.length === 0) return;
    // Group by parent line — one API call per line, incrementing that
    // line's returnedQuantity by however many of its pieces were selected.
    const countByLine = new Map<string, number>();
    selectedReturnablePieces.forEach(s => {
      countByLine.set(s.lineCode, (countByLine.get(s.lineCode) ?? 0) + 1);
    });
    countByLine.forEach((count, lineCode) => returnSareePieces(purchase.id, lineCode, count));
    setSelectedIds(new Set());
  };

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
      id: "status", header: "Status", accessor: s => s.returned, type: "status",
      cell: (_v, s) => s.returned
        ? <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.08)", borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap" as const }}>Returned</span>
        : <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.green, background: "rgba(30,102,64,0.08)", borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap" as const }}>With Us</span>,
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
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>{formatMoney(rupees(s.price))}</span>,
    },
    {
      id: "sellPct", header: "Sell %", accessor: s => s.sellPercent,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>{s.sellPercent}%</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>{formatMoney(rupees(s.finalAmount))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => lineProfit(s),
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.green, whiteSpace: "nowrap" as const }}>{formatMoney(rupees(lineProfit(s)))}</span>,
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

  // A plain print table, not <DataTable> — DataTable's sort/hover chrome and
  // the per-row "Print" barcode button aren't meaningful on paper. Same data,
  // same column order minus the interactive Barcode column.
  const printTable = (
    <div style={{ padding: "16mm" }}>
      <div style={{ marginBottom: "4mm" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14pt", color: "var(--doc-burgundy)" }}>
          {purchase.id} — Saree Details
        </div>
        <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>{purchase.supplier}</div>
      </div>
      <table className="bk-doc__table">
        <thead>
          <tr>
            {["S.No", "Saree Code", "Line Serial", "Saree Type", "Colour", "Weight", "Buying Price", "Sell %", "Selling Price", "Profit", "Notes"].map(h => (
              <th key={h} style={{ textAlign: /Price|Profit|%/.test(h) ? "end" : "start" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pieces.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{s.id}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{s.lineCode} · pc {s.pieceNo}/{s.lineQuantity}</td>
              <td>{s.sareeType || "—"}</td>
              <td>{s.color || "—"}</td>
              <td>{s.weight}</td>
              <td data-num>{formatMoney(rupees(s.price))}</td>
              <td data-num>{s.sellPercent}%</td>
              <td data-num>{formatMoney(rupees(s.finalAmount))}</td>
              <td data-num>{formatMoney(rupees(lineProfit(s)))}</td>
              <td>{s.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700 }}>
            <td colSpan={6}>Totals — {totals.pieces} piece{totals.pieces !== 1 ? "s" : ""}</td>
            <td data-num>{formatMoney(rupees(totals.buying))}</td>
            <td></td>
            <td data-num>{formatMoney(rupees(totals.selling))}</td>
            <td data-num>{formatMoney(rupees(totals.profit))}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} size="xl">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "calc(100dvh - 96px)",
          background: "#FFF",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
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
              <Dialog.Title style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF", margin: 0 }}>
                {purchase.id} — Saree Details
              </Dialog.Title>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.8)" }}>
                {purchase.supplier}
              </div>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                onClick={onClose}
                size="sm"
                className="rounded-full bg-white/12 text-white hover:bg-white/20"
              />
            </Dialog.Close>
          </div>

          <div style={{ overflow: "auto", flex: 1 }}>
            <DataTable
              columns={columns}
              data={pieces}
              getRowId={s => s.id}
              selectedIds={selectedIds}
              onSelectionChange={next => setSelectedIds(new Set([...next].filter(id => selectablePieces.some(s => s.id === id))))}
            />
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
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Buying {formatMoney(rupees(totals.buying))}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, whiteSpace: "nowrap" as const }}>Selling {formatMoney(rupees(totals.selling))}</span>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" as const }}>Profit {formatMoney(rupees(totals.profit))}</span>
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
            {selectedReturnablePieces.length > 0 && (
              <Button
                variant="danger"
                iconLeft={Undo2}
                onClick={handleReturnSelected}
                fullWidth
                className="rounded-full"
              >
                Return {selectedReturnablePieces.length} Selected Saree{selectedReturnablePieces.length !== 1 ? "s" : ""}
              </Button>
            )}
            <Button
              variant="primary"
              iconLeft={Printer}
              onClick={() => print(printTable)}
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
      </div>
    </Modal>
  );
}
