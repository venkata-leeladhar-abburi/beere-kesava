// Supplier analytics — every chart reads the real purchase / saree-line /
// payment records, scoped by one shared timeline control. The individual
// chart cards live under analytics/, composed here.

import React, { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { MONTH_ABBR, TYPE_FILLS, MODE_FILLS } from "../data";
import { useSuppliers, parseINR } from "../../contexts/SupplierContext";
import { FadeUp } from "../common/primitives";
import { PurchaseTrendCard } from "./analytics/PurchaseTrendCard";
import { TypeMixCard } from "./analytics/TypeMixCard";
import { TopSuppliersCard } from "./analytics/TopSuppliersCard";
import { OutstandingCard, BillStatusEntry } from "./analytics/OutstandingCard";
import { RatingCard, PaymentModeCard, SettlementHealthCard } from "./analytics/RatingAndModeCards";

export function SupplierAnalytics() {
  const { suppliers, purchases, payments, isError } = useSuppliers();
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const buys = useMemo(() => purchases.filter(p => matchesDateFilter(p.date, filter)), [purchases, filter]);
  const pays = useMemo(() => payments.filter(p => matchesDateFilter(p.date, filter)), [payments, filter]);

  const periodLabel = useMemo(() => {
    if (filter.mode === "day" && filter.day) return new Date(filter.day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (filter.mode === "range") return `${filter.from || "start"} → ${filter.to || "today"}`;
    if (filter.mode === "month" && filter.month) { const [y, m] = filter.month.split("-"); return `${MONTH_ABBR[+m - 1]} ${y}`; }
    if (filter.mode === "year" && filter.year) return filter.year;
    return "All time";
  }, [filter]);

  const billed = buys.reduce((a, p) => a + parseINR(p.billAmount), 0);
  const settled = pays.reduce((a, p) => a + p.amount, 0);
  const pieces = buys.reduce((a, p) => a + (p.sarees.length ? p.sarees.reduce((s, x) => s + (Number(x.quantity) || 1), 0) : p.sareeCount), 0);
  const settlementRate = billed ? Math.min(100, Math.round((settled / billed) * 100)) : 0;

  // Cost vs expected retail across every saree line — the real margin picture.
  const margin = useMemo(() => {
    let cost = 0, retail = 0;
    buys.forEach(p => p.sarees.forEach(s => {
      const qty = Number(s.quantity) || 1;
      cost += s.price * qty;
      retail += s.finalAmount;
    }));
    return { cost, retail, gross: retail - cost, pct: cost ? ((retail - cost) / cost) * 100 : 0 };
  }, [buys]);

  const monthly = useMemo(() => {
    const m = new Map<string, { spend: number; pieces: number; orders: number }>();
    buys.forEach(p => {
      const d = new Date(p.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const e = m.get(key) || { spend: 0, pieces: 0, orders: 0 };
      e.spend += parseINR(p.billAmount);
      e.pieces += p.sarees.length ? p.sarees.reduce((s, x) => s + (Number(x.quantity) || 1), 0) : p.sareeCount;
      e.orders += 1;
      m.set(key, e);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({ month: `${MONTH_ABBR[+key.slice(5) - 1]} ${key.slice(2, 4)}`, ...v }));
  }, [buys]);

  const trendDelta = useMemo(() => {
    if (monthly.length < 2) return null;
    const a = monthly[monthly.length - 1].spend, b = monthly[monthly.length - 2].spend;
    return b ? Math.round(((a - b) / b) * 100) : null;
  }, [monthly]);

  // Purchase value + margin per saree type, from the individual saree lines.
  const byType = useMemo(() => {
    const m = new Map<string, { cost: number; retail: number; qty: number }>();
    buys.forEach(p => p.sarees.forEach(s => {
      const qty = Number(s.quantity) || 1;
      const e = m.get(s.sareeType) || { cost: 0, retail: 0, qty: 0 };
      e.cost += s.price * qty; e.retail += s.finalAmount; e.qty += qty;
      m.set(s.sareeType, e);
    }));
    return [...m.entries()]
      .map(([type, v], i) => ({
        type, ...v,
        markup: v.cost ? Math.round(((v.retail - v.cost) / v.cost) * 100) : 0,
        avgCost: v.qty ? Math.round(v.cost / v.qty) : 0,
        fill: TYPE_FILLS[i % TYPE_FILLS.length],
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [buys]);

  const perSupplier = useMemo(() => {
    const m = new Map<string, { billed: number; pieces: number; orders: number; paid: number }>();
    const touch = (id: string) => {
      if (!m.has(id)) m.set(id, { billed: 0, pieces: 0, orders: 0, paid: 0 });
      return m.get(id)!;
    };
    buys.forEach(p => {
      const id = p.supplierId ?? suppliers.find(s => s.name === p.supplier)?.id;
      if (!id) return;
      const e = touch(id);
      e.billed += parseINR(p.billAmount);
      e.pieces += p.sarees.length ? p.sarees.reduce((s, x) => s + (Number(x.quantity) || 1), 0) : p.sareeCount;
      e.orders += 1;
    });
    pays.forEach(p => { if (m.has(p.supplierId)) touch(p.supplierId).paid += p.amount; });
    return [...m.entries()].map(([id, v]) => {
      const s = suppliers.find(x => x.id === id);
      return {
        id,
        name: s?.name ?? id,
        short: (s?.name ?? id).length > 17 ? (s!.name).slice(0, 16) + "…" : (s?.name ?? id),
        initials: s?.initials ?? "??",
        specialty: s?.specialty ?? "—",
        terms: s?.terms ?? "—",
        rating: s?.rating ?? 0,
        ...v,
        outstanding: Math.max(0, v.billed - v.paid),
        avgPiece: v.pieces ? Math.round(v.billed / v.pieces) : 0,
      };
    }).sort((a, b) => b.billed - a.billed);
  }, [buys, pays, suppliers]);

  const topSuppliers = perSupplier.slice(0, 5);
  const top5Share = billed ? Math.round((topSuppliers.reduce((a, s) => a + s.billed, 0) / billed) * 100) : 0;
  const dueList = perSupplier.filter(s => s.outstanding > 0);
  const totalDue = dueList.reduce((a, s) => a + s.outstanding, 0);

  const billStatus: BillStatusEntry[] = useMemo(() => ["Paid", "Partial", "Pending"]
    .map(st => ({
      status: st,
      count: buys.filter(p => p.status === st).length,
      value: buys.filter(p => p.status === st).reduce((a, p) => a + parseINR(p.billAmount), 0),
    }))
    .filter(d => d.count > 0), [buys]);

  const byMode = useMemo(() => {
    const m = new Map<string, number>();
    pays.forEach(p => m.set(p.mode, (m.get(p.mode) || 0) + p.amount));
    return [...m.entries()]
      .map(([mode, amount]) => ({ mode, amount, fill: MODE_FILLS[mode] ?? T.taupe }))
      .sort((a, b) => b.amount - a.amount);
  }, [pays]);

  const L = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
  const card: React.CSSProperties = {
    background: "#FFF", borderRadius: 20, border: `1.5px solid ${T.borderDef}`,
    padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
  };
  const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown };
  const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
  const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

  return (
    <div style={{ padding: "48px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Supplier Analytics</h2>
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "4px 10px", borderRadius: 20, textTransform: "uppercase" }}>{periodLabel}</span>
        </div>

        {/* Timeline scope — drives every chart in this section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "PURCHASED", value: L(billed), color: T.royalBurgundy },
              { label: "SAREES IN", value: String(pieces), color: T.luxuryBrown },
              { label: "EXPECTED MARGIN", value: `${margin.pct.toFixed(0)}%`, color: T.greenMid },
            ].map(k => (
              <div key={k.label}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>

      {isError ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <Building2 size={40} color={T.crimson} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.crimson }}>Failed to load supplier analytics.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Please retry or check your connection.</div>
        </div>
      ) : buys.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
          <Building2 size={40} color={T.taupe} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No supplier purchases recorded in this period.</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>Widen the date range to see analytics.</div>
        </div>
      ) : (
        <>
          {/* ── Row 1: purchase trend + saree type mix ── */}
          <FadeUp delay={0.04}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <PurchaseTrendCard card={card} cardTitle={cardTitle} cardSub={cardSub} tip={tip}
                billed={billed} buysCount={buys.length} pieces={pieces} monthly={monthly} trendDelta={trendDelta} />
              <TypeMixCard card={card} cardTitle={cardTitle} cardSub={cardSub} tip={tip} byType={byType} />
            </div>
          </FadeUp>

          {/* ── Row 2: top suppliers + outstanding ── */}
          <FadeUp delay={0.08}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
              <TopSuppliersCard card={card} cardTitle={cardTitle} cardSub={cardSub} tip={tip}
                topSuppliers={topSuppliers} top5Share={top5Share} billed={billed} />
              <OutstandingCard card={card} cardTitle={cardTitle} cardSub={cardSub}
                dueList={dueList} totalDue={totalDue} perSupplierCount={perSupplier.length} billStatus={billStatus} />
            </div>
          </FadeUp>

          {/* ── Row 3: margin, payment modes, settlement health ── */}
          <FadeUp delay={0.12}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              <RatingCard card={card} cardTitle={cardTitle} cardSub={cardSub} tip={tip} suppliers={suppliers} />
              <PaymentModeCard card={card} cardTitle={cardTitle} cardSub={cardSub} tip={tip} byMode={byMode} settled={settled} />
              <SettlementHealthCard card={card} cardTitle={cardTitle} cardSub={cardSub}
                settlementRate={settlementRate} pieces={pieces} billed={billed} buysCount={buys.length} perSuppliers={perSupplier} />
            </div>
          </FadeUp>
        </>
      )}
    </div>
  );
}
