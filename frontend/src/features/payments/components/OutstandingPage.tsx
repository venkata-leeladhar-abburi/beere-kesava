import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle, Factory, Layers, Truck, TrendingUp, Users, Package, ShoppingBag,
} from "lucide-react";
import { useSales, isOutstanding } from "@/features/customers";
import type { IconComponent } from "../../../lib/icon";
import { T, F } from "../theme";
import type { AgeKey } from "./outstanding/primitives";
import { FilterBar } from "./outstanding/FilterBar";
import { InHouseOutstanding } from "./outstanding/InHouseOutstanding";
import { BatchOutstanding } from "./outstanding/BatchOutstanding";
import { ExternalOutstanding } from "./outstanding/ExternalOutstanding";
import { TopSellers } from "./outstanding/TopSellers";
import { rupees, formatMoney } from "@/lib/domain/money";
import inventoryHero from "../../../assets/inline/inventoryHero.jpg";

import { LuxuryStatsCard } from "@/shared/ui/LuxuryStatsCard";

const inr = (n: number) => formatMoney(rupees(n));

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

  const stats = [
    { value: String(totals.all),        label: "TOTAL OUTSTANDING",    sub: "All unsold sarees",          highlight: false, crimson: false, goldVal: false, icon: <Package size={20} color="rgba(245,232,208,0.90)" /> },
    { value: String(totals.weaver),     label: "FROM WEAVERS",         sub: "Unsold from weavers",        highlight: false, crimson: false, goldVal: true,  icon: <Users size={20} color="rgba(245,232,208,0.90)" /> },
    { value: String(totals.loom),       label: "FROM FACTORY LOOMS",    sub: "Unsold from looms",          highlight: false, crimson: false, goldVal: false, icon: <Factory size={20} color="rgba(245,232,208,0.90)" /> },
    { value: String(totals.external),   label: "FROM EXTERNAL",        sub: "Purchase-wise + returns",    highlight: false, crimson: false, goldVal: false, icon: <ShoppingBag size={20} color="rgba(245,232,208,0.90)" /> },
    { value: inr(totals.value),         label: "STOCK VALUE",          sub: `${totals.returned} customer returns`, highlight: true,  crimson: false, goldVal: true,  icon: <TrendingUp size={20} color="rgba(231,201,131,0.95)" /> },
  ];

  return (
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: embedded ? undefined : "100dvh" }}>

      {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div className="pl-4 md:pl-7 xl:pl-14 w-full xl:w-auto xl:basis-[64%] xl:max-w-[64%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>
            SINCE 1999 · REPORTS &amp; OUTSTANDING STOCK
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Outstanding Sarees</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>Report</span>
          </div>
          <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, lineHeight: 1.6 }}>
            Every saree still not sold — retail or wholesale — split by where it came from: weavers, factory looms, and external purchases.
          </p>
        </div>
        {/* Right image with gradient */}
        <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
          <img src={inventoryHero} alt="Outstanding sarees" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-4 md:px-7 xl:px-14 -mt-8 md:-mt-12 xl:-mt-[72px]"
        style={{ position: "relative", zIndex: 20 }}
      >
        <LuxuryStatsCard stats={stats} />
      </motion.div>

      {/* ── TAB STRIP ──────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 20, padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(200,155,71,0.14)" }}>
          {OUT_TABS.map(t => {
            const active = tab === t.key;
            const count = tabCounts[t.key];
            return (
              <motion.div
                key={t.key}
                whileHover={{ scale: 1.01 }}
                onClick={() => setTab(t.key)}
                style={{
                  borderRadius: 14, cursor: "pointer", padding: "16px 18px",
                  background: active ? "linear-gradient(135deg, rgba(200,155,71,0.28), rgba(200,155,71,0.12))" : "rgba(255,253,249,0.05)",
                  border: `1.5px solid ${active ? T.antiqueGold : "rgba(255,253,249,0.08)"}`,
                  boxShadow: active ? "0 8px 24px rgba(200,155,71,0.22)" : "none",
                  display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s ease"
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? T.antiqueGold : "rgba(255,253,249,0.08)" }}>
                  <t.Icon size={22} color={active ? "#2C0913" : "rgba(255,253,249,0.70)"} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.25 }}>{t.label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: active ? "rgba(231,201,131,0.95)" : "rgba(255,253,249,0.50)", marginTop: 3 }}>{t.desc}</div>
                </div>
                {count !== null && (
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: active ? T.antiqueGold : "rgba(255,253,249,0.85)", lineHeight: 1 }}>{count}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,253,249,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 3 }}>Unsold</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AGED ALERT */}
      {totals.aged90 > 0 && (
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 12, padding: "13px 18px" }}>
            <AlertTriangle size={17} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
              <strong style={{ color: T.crimson }}>{totals.aged90} sarees</strong> have been sitting unsold for more than 90 days. Use the <strong>90+ d</strong> ageing filter to see them.
            </span>
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 24, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
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
