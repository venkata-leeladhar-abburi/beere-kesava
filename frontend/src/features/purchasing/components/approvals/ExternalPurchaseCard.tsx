/* eslint-disable no-restricted-syntax */
import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, X, Package } from "lucide-react";
import {
  PurchaseRequest,
  purchaseTotals, expandSareePieces, lineProfit,
} from "@/features/suppliers";
import { T, F } from "./tokens";
import { GreenBtn, CrimsonBtn } from "./SharedUI";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { formatMoney, rupees } from "@/lib/domain/money";

// ─── External purchase request card ───────────────────────────────────────────
// Shows the whole purchase the admin filled in — supplier, invoice, and every
// saree line with its codes and pricing — so the superadmin approves the exact
// entry that will be created.
export function ExternalPurchaseCard({
  req,
  onApprove,
  onReject,
}: {
  req: PurchaseRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const sarees = req.sarees ?? [];
  const totals = purchaseTotals(sarees);
  const pieces = expandSareePieces(sarees);
  const urgent = req.urgency === "Urgent";

  const pieceColumns: ColumnDef<(typeof pieces)[number]>[] = [
    {
      id: "sno", header: "S.No", accessor: (_s) => pieces.indexOf(_s) + 1, priority: 3,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{pieces.indexOf(s) + 1}</span>,
    },
    {
      id: "id", header: "Saree Code", accessor: s => s.id, priority: 1,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, whiteSpace: "nowrap" }}>{s.id}</span>,
    },
    {
      id: "lineCode", header: "Line Serial", accessor: s => s.lineCode, priority: 3,
      cell: (_v, s) => (
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
          {s.lineCode} <span style={{ fontSize: 12 }}>pc {s.pieceNo}/{s.lineQuantity}</span>
        </span>
      ),
    },
    {
      id: "sareeType", header: "Type", accessor: s => s.sareeType,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{s.sareeType || "—"}</span>,
    },
    {
      id: "color", header: "Colour", accessor: s => s.color,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.color || "—"}</span>,
    },
    {
      id: "weight", header: "Weight", accessor: s => s.weight, priority: 3,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.weight || "—"}</span>,
    },
    {
      id: "price", header: "Buying Price", accessor: s => s.price,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{formatMoney(rupees(s.price))}</span>,
    },
    {
      id: "sellPercent", header: "Sell %", accessor: s => s.sellPercent, priority: 3,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{s.sellPercent}%</span>,
    },
    {
      id: "finalAmount", header: "Selling Price", accessor: s => s.finalAmount,
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{formatMoney(rupees(s.finalAmount))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: s => lineProfit(s),
      cell: (_v, s) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green }}>{formatMoney(rupees(lineProfit(s)))}</span>,
    },
  ];

  const meta: { label: string; value: string }[] = [
    { label: "Supplier ID", value: req.supplierId || "—" },
    { label: "Location", value: req.location || "—" },
    { label: "GST Number", value: req.gstNumber || "—" },
    { label: "Invoice Number", value: req.invoiceNumber || "—" },
    { label: "Purchase Date", value: req.purchaseDate || req.requestedDate },
    { label: "Bill Amount", value: req.billAmount || "—" },
    { label: "Raised By", value: req.requestedBy },
    { label: "Raised On", value: req.requestedDate },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: `4px solid ${urgent ? T.crimson : T.antiqueGold}`,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", borderRadius: 6, padding: "3px 9px" }}>
              {req.id}
            </span>
            {urgent && (
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFF", background: T.crimson, borderRadius: 6, padding: "3px 8px" }}>
                URGENT
              </span>
            )}
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, background: T.cream, borderRadius: 6, padding: "3px 8px" }}>
              External Purchase
            </span>
          </div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 7 }}>
            <Package size={15} color={T.antiqueGold} /> {req.supplierName}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
            {req.location || "—"} · {totals.pieces} saree{totals.pieces !== 1 ? "s" : ""} · {sarees.length} line{sarees.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: 1.2, marginBottom: 4 }}>ESTIMATED VALUE</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>
            {formatMoney(rupees(req.estimatedAmount))}
          </div>
        </div>
      </div>

      {/* Money summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          { label: "Pieces", text: String(totals.pieces), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
          { label: "Buying Price", text: formatMoney(rupees(totals.buying)), color: T.luxuryBrown, bg: T.silkCream, border: T.borderDef },
          { label: "Selling Price", text: formatMoney(rupees(totals.selling)), color: T.antiqueGold, bg: "rgba(200,155,71,0.10)", border: T.borderGold },
          { label: "Profit", text: formatMoney(rupees(totals.profit)), color: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.20)" },
        ].map(({ label, text, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: 0.6, marginBottom: 4 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color }}>{text}</div>
          </div>
        ))}
      </div>

      {/* Purchase meta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px" }}>
        {meta.map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: 0.8, marginBottom: 3 }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, wordBreak: "break-word" }}>{value}</div>
          </div>
        ))}
      </div>

      {req.reason && (
        <div style={{ background: T.cream, borderRadius: 10, padding: "10px 14px" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe }}>REASON · </span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{req.reason}</span>
        </div>
      )}
      {req.notes && (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          <strong style={{ color: T.luxuryBrown }}>Notes:</strong> {req.notes}
        </div>
      )}

      {/* Saree lines */}
      {sarees.length > 0 && (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 10, overflow: "hidden" }}>
          <Button
            onClick={() => setOpen(o => !o)}
            variant="tertiary" size="md" fullWidth
            className="justify-between rounded-none"
          >
            <span>Saree details — {totals.pieces} saree{totals.pieces !== 1 ? "s" : ""} to be tagged</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.royalBurgundy }}>
              {open ? "Hide" : "View all"}
            </span>
          </Button>
          {open && (
            <div style={{ overflowX: "auto" }}>
              <DataTable responsive columns={pieceColumns} data={pieces} getRowId={s => s.id} pagination />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: T.silkCream, padding: "9px 12px", minWidth: 760 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>
                  Totals — {totals.pieces} piece{totals.pieces !== 1 ? "s" : ""}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{formatMoney(rupees(totals.buying))}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>{formatMoney(rupees(totals.selling))}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green }}>{formatMoney(rupees(totals.profit))}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 w-full flex-nowrap min-w-0">
        <GreenBtn className="flex-[1.4] min-w-0 px-2 text-[12px] whitespace-nowrap justify-center" onClick={() => onApprove(req.id)}>
          <Check size={14} /> Approve
        </GreenBtn>
        <CrimsonBtn className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center" onClick={() => onReject(req.id)}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}
