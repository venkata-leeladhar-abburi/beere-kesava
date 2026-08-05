import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle, Factory, Layers, Truck, TrendingUp, Users,
} from "lucide-react";
import { useSales, isOutstanding } from "../../customers/contexts/SalesContext";
import type { IconComponent } from "../../../lib/icon";
import { T, F } from "../theme";
import { StatChip } from "./outstanding/primitives";
import type { AgeKey } from "./outstanding/primitives";
import { FilterBar } from "./outstanding/FilterBar";
import { InHouseOutstanding } from "./outstanding/InHouseOutstanding";
import { BatchOutstanding } from "./outstanding/BatchOutstanding";
import { ExternalOutstanding } from "./outstanding/ExternalOutstanding";
import { TopSellers } from "./outstanding/TopSellers";

const G = { card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)" };
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

// ── Main page ────────────────────────────────────────────────────────────────
type OutTab = "weaver" | "factoryLoom" | "external" | "batch" | "ranking";

const OUT_TABS: { key: OutTab; label: string; desc: string; Icon: IconComponent }[] = [
  { key: "weaver",      label: "In-House · Weavers",       desc: "Unsold from our weavers",  Icon: Users },
  { key: "factoryLoom", label: "In-House · Factory Looms", desc: "Unsold from our looms",    Icon: Factory },
  { key: "external",    label: "External Purchases",       desc: "Purchase-wise + returns",  Icon: Truck },
  { key: "batch",       label: "By Batches",               desc: "Unsold per batch",         Icon: Layers },
  { key: "ranking",     label: "Who Is Selling More",      desc: "Weaver / loom / supplier", Icon: TrendingUp },
];

export function OutstandingPage({ embedded = false }: { embedded?: boolean }) {
  const { sarees } = useSales();
  const [tab, setTab] = useState<OutTab>("weaver");
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeKey>("all");

  const totals = useMemo(() => {
    const out = sarees.filter(isOutstanding);
    return {
      all: out.length,
      weaver: out.filter(s => s.origin === "weaver").length,
      loom: out.filter(s => s.origin === "factoryLoom").length,
      external: out.filter(s => s.origin === "external").length,
      batched: out.filter(s => !!s.batchId).length,
      returned: sarees.filter(s => s.status === "returned").length,
      value: out.reduce((a, s) => a + s.finalAmount, 0),
      aged90: out.filter(s => s.ageDays > 90).length,
    };
  }, [sarees]);

  /** Unsold count shown on each tab card. Ranking tab shows no count. */
  const tabCounts: Record<OutTab, number | null> = {
    weaver: totals.weaver,
    factoryLoom: totals.loom,
    external: totals.external,
    batch: totals.batched,
    ranking: null,
  };
  const tabCount = tabCounts[tab] ?? totals.all;

  return (
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: embedded ? undefined : "100dvh" }}>

      {/* HERO */}
      <section style={{ background: G.card, padding: "44px 40px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
            REPORTS · OUTSTANDING STOCK
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: "#FFFDF9", margin: 0, lineHeight: 1.12 }}>
            Outstanding Sarees Report
          </h1>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 720 }}>
            Every saree still not sold — retail or wholesale — split by where it came from: our own weavers,
            our factory looms, and external purchases. External purchases are shown purchase-wise with bill dues
            and customer returns.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "26px 0 32px" }}>
            <StatChip label="Total Outstanding" value={String(totals.all)} />
            <StatChip label="From Weavers" value={String(totals.weaver)} tone="gold" />
            <StatChip label="From Factory Looms" value={String(totals.loom)} tone="gold" />
            <StatChip label="From External" value={String(totals.external)} tone="gold" />
            <StatChip label="Customer Returns" value={String(totals.returned)} tone="red" />
            <StatChip label="Stock Value" value={inr(totals.value)} tone="green" />
          </div>
        </div>
      </section>

      {/* TAB STRIP */}
      {/* Not sticky when embedded in ReportsPage — that page already has a sticky tab bar. */}
      <div style={{ position: embedded ? "relative" : "sticky", top: 0, zIndex: 30, background: "linear-gradient(180deg, #3D0E1A, #2C0913)", boxShadow: "0 6px 24px rgba(0,0,0,0.20)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, padding: "18px 40px 20px" }}>
          {OUT_TABS.map(t => {
            const active = tab === t.key;
            const count = tabCounts[t.key];
            return (
              <motion.button key={t.key} onClick={() => setTab(t.key)}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer",
                  padding: "18px 20px", borderRadius: 16, minWidth: 0,
                  background: active ? "linear-gradient(135deg, rgba(200,155,71,0.26), rgba(200,155,71,0.12))" : "rgba(255,253,249,0.06)",
                  border: `2px solid ${active ? T.antiqueGold : "rgba(255,253,249,0.12)"}`,
                  boxShadow: active ? "0 8px 26px rgba(200,155,71,0.22)" : "none",
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? T.antiqueGold : "rgba(255,253,249,0.10)" }}>
                  <t.Icon size={24} color={active ? "#2C0913" : "rgba(255,253,249,0.70)"} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.25 }}>{t.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: active ? "rgba(231,201,131,0.95)" : "rgba(255,253,249,0.45)", marginTop: 3 }}>{t.desc}</div>
                </div>
                {count !== null && (
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: active ? T.antiqueGold : "rgba(255,253,249,0.80)", lineHeight: 1 }}>{count}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.40)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 4 }}>Unsold</div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AGED ALERT */}
      {totals.aged90 > 0 && (
        <div style={{ padding: "22px 40px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "13px 18px" }}>
            <AlertTriangle size={17} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
              <strong style={{ color: T.crimson }}>{totals.aged90} sarees</strong> have been sitting unsold for more than 90 days. Use the <strong>90+ d</strong> ageing filter to see them.
            </span>
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={{ padding: "22px 40px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {tab !== "ranking" && (
          <FilterBar
            search={search} setSearch={setSearch}
            ageFilter={ageFilter} setAgeFilter={setAgeFilter}
            count={tabCount}
          />
        )}

        {tab === "weaver" && (
          <InHouseOutstanding origin="weaver" sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "factoryLoom" && (
          <InHouseOutstanding origin="factoryLoom" sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "external" && (
          <ExternalOutstanding sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "batch" && (
          <BatchOutstanding sarees={sarees} search={search} ageFilter={ageFilter} />
        )}
        {tab === "ranking" && <TopSellers sarees={sarees} />}
      </div>
    </div>
  );
}
