// Flat saree inventory table, used inside the Overview tab and inside each
// expanded purchase row of the Order History tab. Each row is one purchase
// line (one serial number, possibly covering several physical pieces) and
// can be expanded to list every physical saree under that serial with a
// barcode "Print" action per piece, plus a "Print All" for the whole line.

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "motion/react";
import { ChevronRight, ChevronDown, Image as ImageIcon, Printer } from "lucide-react";
import { T, F } from "../theme";
import { SareeTag, expandSareePieces } from "../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Modal } from "../../../../shared/ui/overlay";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { SariTagPrintModal } from "@/features/production";
import { useDocument } from "../../../../shared/ui/document";

type SareeRow = SareeTag & { purchaseId: string; invoiceNumber: string; supplier: string };

export function SareeInventoryTable({ rows }: { rows: SareeRow[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [printSaree, setPrintSaree] = useState<{ row: SareeRow; pieceId: string } | null>(null);
  const { print } = useDocument();

  if (rows.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No sarees match this filter.</div>;
  }

  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "var(--font-mono)", fontSize: 12, color, ...extra,
  });

  const rowId = (s: SareeRow) => `${s.purchaseId}-${s.id}`;

  const toggle = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const printAllForRow = (s: SareeRow) => {
    const pieces = expandSareePieces([s]);
    const printTable = (
      <div style={{ padding: "16mm" }}>
        <div style={{ marginBottom: "4mm" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14pt", color: "var(--doc-burgundy)" }}>
            {s.id} — Saree Barcodes
          </div>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)" }}>{s.supplier}</div>
        </div>
        {/* eslint-disable-next-line no-restricted-syntax -- printable document template */}
        <table className="bk-doc__table">
          <thead>
            <tr>
              {/* eslint-disable-next-line no-restricted-syntax -- printable document template */}
              {["Saree Code", "Type", "Colour", "Weight"].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {pieces.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: "var(--font-code)" }}>{p.id}</td>
                <td>{p.sareeType || "—"}</td>
                <td>{p.color || "—"}</td>
                <td>{p.weight || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    print(printTable);
  };

  const columns: ColumnDef<SareeRow>[] = [
    {
      id: "expand", header: "", accessor: () => null,
      cell: (_v, s) => (
        <IconButton
          icon={expandedIds.has(rowId(s)) ? ChevronDown : ChevronRight}
          label={expandedIds.has(rowId(s)) ? "Collapse sarees" : "Expand sarees"}
          variant="ghost" size="sm"
          onClick={() => toggle(rowId(s))}
        />
      ),
    },
    {
      id: "photo", header: "Photo", accessor: s => s.imageUrl,
      cell: (_v, s) => s.imageUrl ? (
        <button type="button" onClick={() => setPreview(s.imageUrl!)} className="p-0 border-0 bg-transparent cursor-pointer">
          <img src={s.imageUrl} alt={s.id}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.borderDef}` }} />
        </button>
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={14} color={T.taupe} />
        </div>
      ),
    },
    {
      id: "sareeId", header: "Saree ID", accessor: s => s.id,
      cell: (_v, s) => <span style={mono(T.royalBurgundy, { fontWeight: 600 })}>{s.id}</span>,
    },
    {
      id: "serial", header: "Serial No.", accessor: s => s.id,
      cell: (_v, s) => <span style={mono(T.luxuryBrown, { fontWeight: 700 })}>{s.id.split("-").pop() || "—"}</span>,
    },
    {
      id: "po", header: "Purchase Order", accessor: s => s.purchaseId,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.purchaseId}</span>,
    },
    {
      id: "qty", header: "Quantity", accessor: s => s.quantity,
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{s.quantity ?? 1} pcs</span>,
    },
    {
      id: "type", header: "Type", accessor: s => s.sareeType,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.sareeType || "—"}</span>,
    },
    {
      id: "colour", header: "Colour", accessor: s => s.color,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.color || "—"}</span>,
    },
    {
      id: "weight", header: "Weight", accessor: s => s.weight,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.weight || "—"}</span>,
    },
    {
      id: "date", header: "Purchase Date", accessor: s => s.date,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.date}</span>,
    },
    {
      id: "buying", header: "Buying Price", accessor: s => s.price,
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{formatMoney(rupees(s.price))}</span>,
    },
    {
      id: "sellPct", header: "Sell %", accessor: s => s.sellPercent,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.sellPercent}%</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={mono("#8B6018", { fontWeight: 700 })}>{formatMoney(rupees(s.finalAmount))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => (s.finalAmount - s.price) * (s.quantity ?? 1),
      cell: (_v, s) => <span style={mono(T.green, { fontWeight: 700 })}>{formatMoney(rupees((s.finalAmount - s.price) * (s.quantity ?? 1)))}</span>,
    },
    {
      id: "barcodes", header: "Barcodes", accessor: () => null, type: "actions",
      cell: (_v, s) => (
        <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => printAllForRow(s)} className="whitespace-nowrap">
          Print All
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={rowId}
        emptyTitle="No sarees match this filter"
        expandedIds={expandedIds}
        renderExpandedRow={s => {
          const pieces = expandSareePieces([s]);
          return (
            <div style={{ padding: "10px 16px 16px 56px", background: "rgba(247,242,234,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                  {pieces.length} saree{pieces.length !== 1 ? "s" : ""} under serial {s.id.split("-").pop()}
                </div>
                <Button variant="primary" size="sm" iconLeft={Printer} onClick={() => printAllForRow(s)}>
                  Print All Barcodes
                </Button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pieces.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={mono(T.royalBurgundy, { fontWeight: 700 })}>{p.id}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>pc {p.pieceNo}/{p.lineQuantity}</span>
                    </div>
                    <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => setPrintSaree({ row: s, pieceId: p.id })}>
                      Print
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        }}
      />

      <Modal open={!!preview} onOpenChange={o => { if (!o) setPreview(null); }} size="xl">
        <Dialog.Title className="sr-only">Saree photo preview</Dialog.Title>
        <Dialog.Description className="sr-only">Full-size saree photo</Dialog.Description>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {preview && (
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={preview} alt="Saree" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          )}
        </div>
      </Modal>

      {printSaree && (
        <SariTagPrintModal
          saree={{
            id: printSaree.pieceId,
            weaver: null,
            design: printSaree.pieceId,
            sareeType: printSaree.row.sareeType,
            weight: printSaree.row.weight,
            qcDate: printSaree.row.date,
            source: "external",
            loom: 0,
            supplier: printSaree.row.supplier,
          }}
          onClose={() => setPrintSaree(null)}
        />
      )}
    </>
  );
}
