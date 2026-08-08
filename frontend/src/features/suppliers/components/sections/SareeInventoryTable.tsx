// Flat saree inventory table, used inside the Overview tab and inside each
// expanded purchase row of the Order History tab.

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Image as ImageIcon } from "lucide-react";
import { T, F } from "../theme";
import { SareeTag, formatINR } from "../../contexts/SupplierContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

type SareeRow = SareeTag & { purchaseId: string; invoiceNumber: string };

export function SareeInventoryTable({ rows }: { rows: SareeRow[] }) {
  const [preview, setPreview] = useState<string | null>(null);

  if (rows.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No sarees match this filter.</div>;
  }

  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: F.mono, fontSize: 12, color, ...extra,
  });

  const columns: ColumnDef<SareeRow>[] = [
    {
      id: "photo", header: "Photo", accessor: s => s.imageUrl,
      cell: (_v, s) => s.imageUrl ? (
        <img src={s.imageUrl} alt={s.id} onClick={() => setPreview(s.imageUrl!)}
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", cursor: "pointer", border: `1px solid ${T.borderDef}` }} />
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
      cell: (_v, s) => <span style={mono(T.luxuryBrown, { fontWeight: 700 })}>{s.id.includes("-INV-") ? s.id.split("-")[1] : "—"}</span>,
    },
    {
      id: "po", header: "Purchase Order", accessor: s => s.purchaseId,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.purchaseId}</span>,
    },
    {
      id: "qty", header: "Quantity", accessor: s => s.quantity,
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{s.quantity} pcs</span>,
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
      cell: (_v, s) => <span style={mono(T.luxuryBrown)}>{formatINR(s.price)}</span>,
    },
    {
      id: "sellPct", header: "Sell %", accessor: s => s.sellPercent,
      cell: (_v, s) => <span style={mono(T.taupe)}>{s.sellPercent}%</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={mono("#8B6018", { fontWeight: 700 })}>{formatINR(s.finalAmount)}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => (s.finalAmount - s.price) * s.quantity,
      cell: (_v, s) => <span style={mono(T.green, { fontWeight: 700 })}>{formatINR((s.finalAmount - s.price) * s.quantity)}</span>,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={s => `${s.purchaseId}-${s.id}-${rows.indexOf(s)}`}
        emptyTitle="No sarees match this filter"
      />

      <AnimatePresence>
        {preview && (
          <div onClick={() => setPreview(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(20,8,14,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={preview} alt="Saree" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }} />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
