import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Factory, Truck, Users } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree, SellerRank, rankSellers } from "../../../customers/contexts/SalesContext";
import { Card, ExportBtn, ScrollTable, SectionTitle, exportCsv, inr, td, tdMono, th } from "./primitives";

// ── Who is selling more ──────────────────────────────────────────────────────
const RANK_PAGE = 5;

function RankTable({ title, sub, ranks, unitLabel }: { title: string; sub: string; ranks: SellerRank[]; unitLabel: string }) {
  const max = Math.max(1, ...ranks.map(r => r.sold));
  const [shown, setShown] = useState(RANK_PAGE);
  const visible = ranks.slice(0, shown);
  const remaining = ranks.length - visible.length;
  return (
    <Card>
      <SectionTitle title={title} sub={sub}
        right={<ExportBtn onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z]+/g, "-")}.csv`,
          [[unitLabel, "Reference", "Produced", "Sold", "Retail", "Wholesale", "Returned", "Outstanding", "Sell-through %", "Net Revenue"],
           ...ranks.map(r => [r.name, r.sub, r.produced, r.sold, r.retail, r.wholesale, r.returned, r.outstanding, r.sellThroughPct, r.revenue])])} />}
      />
      <ScrollTable>
        <thead>
          <tr>
            <th style={{ ...th, width: 44 }}>#</th>
            <th style={th}>{unitLabel}</th>
            <th style={th}>Sold</th>
            <th style={{ ...th, textAlign: "right" }}>Produced</th>
            <th style={{ ...th, textAlign: "right" }}>Retail</th>
            <th style={{ ...th, textAlign: "right" }}>Wholesale</th>
            <th style={{ ...th, textAlign: "right" }}>Returned</th>
            <th style={{ ...th, textAlign: "right" }}>Outstanding</th>
            <th style={{ ...th, textAlign: "right" }}>Sell-through</th>
            <th style={{ ...th, textAlign: "right" }}>Net Revenue</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r, i) => (
            <tr key={r.key}>
              <td style={{ ...td, fontFamily: F.display, fontWeight: 700, color: i < 3 ? T.antiqueGold : T.taupe }}>{i + 1}</td>
              <td style={td}>
                <div style={{ fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{r.sub}</div>
              </td>
              <td style={{ ...td, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ flex: 1, height: 7, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden", minWidth: 70 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(r.sold / max) * 100}%` }} transition={{ duration: 0.6 }}
                      style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.royalBurgundy}, ${T.antiqueGold})` }} />
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, minWidth: 22 }}>{r.sold}</span>
                </div>
              </td>
              <td style={{ ...tdMono, textAlign: "right", color: T.luxuryBrown }}>{r.produced}</td>
              <td style={{ ...tdMono, textAlign: "right", color: "#4A7FB5" }}>{r.retail}</td>
              <td style={{ ...tdMono, textAlign: "right", color: "#9B4DCA" }}>{r.wholesale}</td>
              <td style={{ ...tdMono, textAlign: "right", color: r.returned ? T.crimson : T.taupe }}>{r.returned}</td>
              <td style={{ ...tdMono, textAlign: "right", color: T.orange }}>{r.outstanding}</td>
              <td style={{ ...tdMono, textAlign: "right", color: r.sellThroughPct >= 60 ? T.green : r.sellThroughPct >= 35 ? T.antiqueGold : T.crimson }}>{r.sellThroughPct}%</td>
              <td style={{ ...tdMono, textAlign: "right", fontWeight: 700 }}>{inr(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>

      {/* Load more / show less */}
      {ranks.length > RANK_PAGE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 16 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
            Showing {visible.length} of {ranks.length}
          </span>
          {remaining > 0 ? (
            <motion.button onClick={() => setShown(s => s + RANK_PAGE)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.20)`, borderRadius: 10, padding: "10px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <ChevronDown size={15} /> Load more ({Math.min(RANK_PAGE, remaining)} more)
            </motion.button>
          ) : (
            <motion.button onClick={() => setShown(RANK_PAGE)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", color: T.taupe, border: `1.5px solid rgba(110,15,45,0.16)`, borderRadius: 10, padding: "10px 20px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <ChevronUp size={15} /> Show less
            </motion.button>
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
