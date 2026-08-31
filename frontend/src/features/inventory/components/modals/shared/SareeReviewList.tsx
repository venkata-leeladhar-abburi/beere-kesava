import { Package } from "lucide-react";
import { FinishingReturn } from "@/features/finishing";
import { useBatches } from "@/features/production";
import { T, F } from "../../theme";
import { StatusBadge } from "../../common/primitives";
import { toPaise, fromPaise } from "../../../../../lib/gst";
import { rupees } from "@/lib/domain/money";
import { Money, EntityCode } from "@/shared/ui/domain";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

// ── Saree review list (shared by the quotation / invoice review steps) ────────
export function SareeReviewList({ sarees, prices, applyGst, gstPct, docLabel }: {
  sarees: FinishingReturn[];
  prices: Record<string, string>;
  applyGst: boolean;
  gstPct: string;
  docLabel: string;
}) {
  const { batches } = useBatches();
  // Part A.4/I.5 — sum in integer paise, not floats (see the identical fix
  // and comment in InvoiceGenerator.tsx, which this list is reviewed after).
  const subtotalPaise = sarees.reduce((sum, s) => sum + toPaise(Number(prices[s.sareeId || s.id]) || 0), 0);
  const gstPaise = applyGst ? Math.round(subtotalPaise * (Number(gstPct) || 0) / 100) : 0;
  const subtotal = fromPaise(subtotalPaise);
  const gstAmount = fromPaise(gstPaise);

  interface ReviewRow {
    sId: string;
    bId: string | undefined;
    p: number;
    s: FinishingReturn;
  }
  const rows: ReviewRow[] = sarees.map(s => {
    const sId = s.sareeId || s.id;
    const bId = batches.find(b => b.rows.some(r => r.sareeId === sId))?.batchId;
    const p = fromPaise(toPaise(Number(prices[sId]) || 0));
    return { sId, bId, p, s };
  });

  const columns: ColumnDef<ReviewRow>[] = [
    {
      id: "saree", header: "Saree", accessor: r => r.sId, priority: 1,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" as const }}>
              <EntityCode type="saree" value={r.sId} />
              {r.bId && <EntityCode type="batch" value={r.bId} />}
              <StatusBadge status={r.s.inventoryStatus} />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
              {r.s.sareeTypeCode || r.s.designCode} · {r.s.sareeType} · Weaver: {r.s.weaverName}
            </div>
          </div>
        </div>
      ),
    },
    {
      // eslint-disable-next-line no-restricted-syntax -- column header label (unit annotation), not a rendered money value; the amount itself renders via <Money> below
      id: "amount", header: "Amount (₹)", accessor: r => r.p, type: "number", align: "end", width: 130,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: r.p ? T.luxuryBrown : T.crimson }}>
          {r.p ? <Money value={rupees(r.p)} /> : "not priced"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>
        {sarees.length} saree{sarees.length === 1 ? "" : "s"} on this {docLabel.toLowerCase()}, with the amounts entered.
      </div>
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <DataTable responsive columns={columns} data={rows} getRowId={r => r.sId} emptyTitle="No sarees on this document" />
      </div>
      <div style={{ marginTop: 14, background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Subtotal ({sarees.length} sarees)</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(subtotal)} /></span>
        </div>
        {applyGst && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>GST ({gstPct}%)</span>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(gstAmount)} /></span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderGold}`, paddingTop: 8, marginTop: 2 }}>
          <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
          <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(subtotal + gstAmount)} /></span>
        </div>
      </div>
    </div>
  );
}
