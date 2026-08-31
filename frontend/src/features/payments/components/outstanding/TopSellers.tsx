import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Factory, Truck, Users, LayoutGrid, List, type LucideIcon } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, SellerRank, rankSellers } from "@/features/customers";
import { Card, ExportBtn, SectionCard, exportCsv, inr } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

// ── Who is selling more ──────────────────────────────────────────────────────
const RANK_PAGE = 5;

function RankTable({ title, sub, ranks, unitLabel, icon }: { title: string; sub: string; ranks: SellerRank[]; unitLabel: string; icon: LucideIcon }) {
  const max = Math.max(1, ...ranks.map(r => r.sold));
  const [shown, setShown] = useState(RANK_PAGE);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

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
      id: "name", header: unitLabel, priority: 1, accessor: r => r.name,
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
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, minWidth: 22 }}>{r.sold}</span>
        </div>
      ),
    },
    { id: "produced", header: "Produced", priority: 3, accessor: r => r.produced, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{r.produced}</span> },
    { id: "retail", header: "Retail", priority: 3, accessor: r => r.retail, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: "#4A7FB5" }}>{r.retail}</span> },
    { id: "wholesale", header: "Wholesale", priority: 3, accessor: r => r.wholesale, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: "#9B4DCA" }}>{r.wholesale}</span> },
    { id: "returned", header: "Returned", priority: 3, accessor: r => r.returned, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: r.returned ? T.crimson : T.taupe }}>{r.returned}</span> },
    { id: "outstanding", header: "Outstanding", accessor: r => r.outstanding, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.orange }}>{r.outstanding}</span> },
    { id: "sellThrough", header: "Sell-through", priority: 3, accessor: r => r.sellThroughPct, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: r.sellThroughPct >= 60 ? T.green : r.sellThroughPct >= 35 ? T.antiqueGold : T.crimson }}>{r.sellThroughPct}%</span> },
    { id: "revenue", header: "Net Revenue", accessor: r => r.revenue, align: "end", cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{inr(r.revenue)}</span> },
  ];

  return (
    <SectionCard
      icon={icon}
      title={title}
      subtitle={sub}
      actions={
        <ExportBtn onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z]+/g, "-")}.csv`,
          [[unitLabel, "Reference", "Produced", "Sold", "Retail", "Wholesale", "Returned", "Outstanding", "Sell-through %", "Net Revenue"],
           ...ranks.map(r => [r.name, r.sub, r.produced, r.sold, r.retail, r.wholesale, r.returned, r.outstanding, r.sellThroughPct, r.revenue])])} />
      }
    >
      {/* Mobile View Toggle (placed just below the header section) */}
      <div className="flex md:hidden justify-end mb-3">
        <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
          <Button
            onClick={() => setViewMode("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setViewMode("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <List size={14} /> Table View
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={`grid grid-cols-1 gap-3.5 ${viewMode === "card" ? "block md:hidden" : "hidden"}`}>
        {visible.map((r, idx) => (
          <div key={r.key} style={{ background: "#FFFFFF", border: "1px solid rgba(110,15,45,0.12)", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            {/* Header: Rank + Name + Reference */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: idx < 3 ? "rgba(200,155,71,0.15)" : "rgba(110,15,45,0.06)",
                color: idx < 3 ? T.antiqueGold : T.taupe,
                fontFamily: F.display, fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                #{idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.sub}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase" }}>Net Revenue</div>
                <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>{inr(r.revenue)}</div>
              </div>
            </div>

            {/* Sold Progress Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", width: 36 }}>Sold</span>
              <div style={{ flex: 1, height: 7, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(r.sold / max) * 100}%` }} transition={{ duration: 0.6 }}
                  style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.royalBurgundy}, ${T.antiqueGold})` }} />
              </div>
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, minWidth: 22 }}>{r.sold}</span>
            </div>

            <div style={{ width: "100%", height: 1, background: "rgba(110,15,45,0.08)" }} />

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div style={{ background: "#F6F4EF", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.taupe, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>PRODUCED</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{r.produced}</div>
              </div>
              <div style={{ background: "rgba(30,102,64,0.08)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>SOLD</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.green }}>{r.sold}</div>
              </div>
              <div style={{ background: "rgba(192,57,43,0.06)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.crimson, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>OUTSTANDING</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.orange }}>{r.outstanding}</div>
              </div>
              <div style={{ background: "rgba(110,15,45,0.06)", borderRadius: 12, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: T.royalBurgundy, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 2 }}>SELL-THROUGH</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: r.sellThroughPct >= 60 ? T.green : r.sellThroughPct >= 35 ? T.antiqueGold : T.crimson }}>{r.sellThroughPct}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View & Mobile Table Mode */}
      <div className={`w-full overflow-x-auto section-nav-scroll border border-[#E8DCC4] rounded-xl bg-white p-2 ${viewMode === "table" ? "block" : "hidden md:block"}`}>
        <div className="min-w-[750px]">
          <DataTable
            responsive={false}
            columns={columns}
            data={visible}
            getRowId={r => r.key}
            caption={`${title} table`}
            emptyTitle={`No ${unitLabel.toLowerCase()} data yet`}
            pagination
          />
        </div>
      </div>

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
    </SectionCard>
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

      <RankTable title="Weavers — Selling Performance"       sub="Which weaver's sarees are actually moving out of stock." ranks={weavers}   unitLabel="Weaver" icon={Users} />
      <RankTable title="Factory Looms — Selling Performance"  sub="Which in-house loom's output sells fastest."             ranks={looms}     unitLabel="Factory Loom" icon={Factory} />
      <RankTable title="Suppliers — Selling Performance"      sub="Which external supplier's sarees sell best. Net revenue is after deducting customer refunds." ranks={suppliers} unitLabel="Supplier" icon={Truck} />
    </div>
  );
}
