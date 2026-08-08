import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Factory, Truck, Users } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, SellerRank, rankSellers } from "../../../customers/contexts/SalesContext";
import { Card, ExportBtn, SectionTitle, exportCsv, inr } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

// ── Who is selling more ──────────────────────────────────────────────────────
const RANK_PAGE = 5;

function RankTable({ title, sub, ranks, unitLabel }: { title: string; sub: string; ranks: SellerRank[]; unitLabel: string }) {
  const max = Math.max(1, ...ranks.map(r => r.sold));
  const [shown, setShown] = useState(RANK_PAGE);
  const visible = ranks.slice(0, shown);
  const remaining = ranks.length - visible.length;

  const columns: ColumnDef<SellerRank>[] = [
    {
      id: "rank", header: "#", width: 44,
      accessor: () => 0,
      cell: (_v, r) => {
        const i = visible.indexOf(r);
        return <span style={{ fontFamily: F.display, fontWeight: 700, color: i < 3 ? T.antiqueGold : T.taupe }}>{i + 1}</span>;
      },
    },
    {
      id: "name", header: unitLabel, accessor: r => r.name,
      cell: (_v, r) => (
        <>
          <div style={{ fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.sub}</div>
        </>
      ),
    },
    {
      id: "sold", header: "Sold", accessor: r => r.sold, width: 150,
      cell: (_v, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ flex: 1, height: 7, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden", minWidth: 70 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(r.sold / max) * 100}%` }} transition={{ duration: 0.6 }}
              style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.royalBurgundy}, ${T.antiqueGold})` }} />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, minWidth: 22 }}>{r.sold}</span>
        </div>
      ),
    },
    { id: "produced", header: "Produced", accessor: r => r.produced, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{r.produced}</span> },
    { id: "retail", header: "Retail", accessor: r => r.retail, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: "#4A7FB5" }}>{r.retail}</span> },
    { id: "wholesale", header: "Wholesale", accessor: r => r.wholesale, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: "#9B4DCA" }}>{r.wholesale}</span> },
    { id: "returned", header: "Returned", accessor: r => r.returned, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: r.returned ? T.crimson : T.taupe }}>{r.returned}</span> },
    { id: "outstanding", header: "Outstanding", accessor: r => r.outstanding, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.orange }}>{r.outstanding}</span> },
    { id: "sellThrough", header: "Sell-through", accessor: r => r.sellThroughPct, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: r.sellThroughPct >= 60 ? T.green : r.sellThroughPct >= 35 ? T.antiqueGold : T.crimson }}>{r.sellThroughPct}%</span> },
    { id: "revenue", header: "Net Revenue", accessor: r => r.revenue, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{inr(r.revenue)}</span> },
  ];

  return (
    <Card>
      <SectionTitle title={title} sub={sub}
        right={<ExportBtn onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z]+/g, "-")}.csv`,
          [[unitLabel, "Reference", "Produced", "Sold", "Retail", "Wholesale", "Returned", "Outstanding", "Sell-through %", "Net Revenue"],
           ...ranks.map(r => [r.name, r.sub, r.produced, r.sold, r.retail, r.wholesale, r.returned, r.outstanding, r.sellThroughPct, r.revenue])])} />}
      />
      <DataTable
        columns={columns}
        data={visible}
        getRowId={r => r.key}
        caption={`${title} table`}
        emptyTitle={`No ${unitLabel.toLowerCase()} data yet`}
      />

      {/* Load more / show less */}
      {ranks.length > RANK_PAGE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 16 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            Showing {visible.length} of {ranks.length}
          </span>
          {remaining > 0 ? (
            <Button variant="secondary" size="sm" iconLeft={ChevronDown} onClick={() => setShown(s => s + RANK_PAGE)}
              className="rounded-[10px] border-[1.5px] border-[rgba(110,15,45,0.20)] bg-[rgba(110,15,45,0.06)] text-[#6E0F2D]">
              Load more ({Math.min(RANK_PAGE, remaining)} more)
            </Button>
          ) : (
            <Button variant="tertiary" size="sm" iconLeft={ChevronUp} onClick={() => setShown(RANK_PAGE)}
              className="rounded-[10px] border-[1.5px] border-[rgba(110,15,45,0.16)] bg-transparent text-[var(--text-tertiary)]">
              Show less
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export function TopSellers({ sarees }: { sarees: UnifiedSaree[] }) {
  const weavers = useMemo(() => rankSellers(sarees, "weaver"), [sarees]);
  const looms   = useMemo(() => rankSellers(sarees, "factoryLoom"), [sarees]);
  const suppliers = useMemo(() => rankSellers(sarees, "external"), [sarees]);

  const best = [
    { l: "Top Weaver",         r: weavers[0],   icon: <Users size={16} color={T.antiqueGold} /> },
    { l: "Top Factory Loom",   r: looms[0],     icon: <Factory size={16} color={T.antiqueGold} /> },
    { l: "Top Supplier",       r: suppliers[0], icon: <Truck size={16} color={T.antiqueGold} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {best.map(b => (
          <Card key={b.l} pad={18}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {b.icon}
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{b.l}</span>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{b.r?.name || "—"}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 10 }}>{b.r?.sub || ""}</div>
            <div style={{ display: "flex", gap: 18 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>Sold</div>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.royalBurgundy }}>{b.r?.sold ?? 0}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>Net Revenue</div>
                <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.green }}>{inr(b.r?.revenue ?? 0)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <RankTable title="Weavers — Selling Performance"       sub="Which weaver's sarees are actually moving out of stock." ranks={weavers}   unitLabel="Weaver" />
      <RankTable title="Factory Looms — Selling Performance"  sub="Which in-house loom's output sells fastest."             ranks={looms}     unitLabel="Factory Loom" />
      <RankTable title="Suppliers — Selling Performance"      sub="Which external supplier's sarees sell best. Net revenue is after deducting customer refunds." ranks={suppliers} unitLabel="Supplier" />
    </div>
  );
}
