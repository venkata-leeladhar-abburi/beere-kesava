// Row 3: suppliers-by-rating bar chart, payments-by-mode donut, and the
// settlement-health radial gauge — three small cards side by side.

import React from "react";
import { semantic } from "../../../../../design-system/tokens";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import { Star, Wallet, Clock } from "lucide-react";
import { T, F } from "../../theme";
import { Supplier } from "../../../contexts/SupplierContext";
import { PerSupplierEntry } from "./TopSuppliersCard";
import { ChartFigure } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

function CardHeader({ icon: Icon, title, subtitle }: {
  icon: typeof Star;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      margin: "-24px -28px 18px -28px", padding: "16px 20px",
      background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
      borderRadius: "14px 14px 0 0",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, minWidth: 36, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.12)",
        }}>
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RatingCard({
  card, tip, suppliers,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  suppliers: Supplier[];
}) {
  const data = Object.entries(suppliers.reduce((acc, s) => {
    // Unrated suppliers (rating 0) don't belong in any star bucket.
    const r = Math.round(s.rating);
    if (r >= 1 && r <= 5) acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>))
    .map(([k, v]) => ({ rating: `${k} Stars`, count: v }))
    .reverse();

  return (
    <div style={card}>
      <CardBloom />
      <CardHeader icon={Star} title="Suppliers by Rating" subtitle="Distribution of supplier quality" />
      <ChartFigure title="Suppliers by Rating" summary={`${suppliers.length} suppliers: ${data.map(d => `${d.rating} ${d.count}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={182}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" horizontal={false} />
            <XAxis type="number" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
            <YAxis dataKey="rating" type="category" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={50} />
            <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
              formatter={(v: number, _n: string, p: { payload: (typeof data)[number] }) => [`${v} suppliers`, p.payload.rating]} />
            <Bar dataKey="count" fill={semantic.chart.series[1]} radius={[10, 10, 10, 10]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        <span>Total Suppliers {suppliers.length}</span>
      </div>
    </div>
  );
}

export function PaymentModeCard({
  card, tip, byMode, settled,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  byMode: { mode: string; amount: number; fill: string }[];
  settled: number;
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader icon={Wallet} title="Payments by Mode" subtitle={`Settled: ${formatMoney(rupees(settled))}`} />
      {byMode.length === 0 ? (
        <div style={{ padding: "56px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
      ) : (
        <>
          <ChartFigure title="Payments by Mode" summary={`${formatMoney(rupees(settled))} settled: ${byMode.map(d => `${d.mode} ${formatMoney(rupees(d.amount))}`).join(", ")}.`}>
            <ResponsiveContainer width="100%" height={168}>
              <PieChart>
                <defs>
                  <linearGradient id="paymentModeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={T.royalBurgundy} />
                    <stop offset="70%" stopColor={T.royalBurgundy} />
                    <stop offset="100%" stopColor={T.antiqueGold} />
                  </linearGradient>
                </defs>
                <Pie data={byMode} dataKey="amount" nameKey="mode" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={byMode.length > 1 ? 5 : 0} cornerRadius={byMode.length > 1 ? 8 : 14} stroke="none">
                  {byMode.map((d) => (
                    <Cell key={d.mode} fill={byMode.length === 1 ? "url(#paymentModeGrad)" : d.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={tip} formatter={(v: number, _n: string, p: { payload: (typeof byMode)[number] }) => [formatMoney(rupees(v)), p.payload.mode]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFigure>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {byMode.map((d) => (
              <div key={d.mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: byMode.length === 1 ? `linear-gradient(135deg, ${T.royalBurgundy}, ${T.antiqueGold})` : d.fill }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.mode}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
                  {settled ? Math.round((d.amount / settled) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SettlementHealthCard({
  card, settlementRate, pieces, billed, buysCount, perSuppliers,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  settlementRate: number;
  pieces: number;
  billed: number;
  buysCount: number;
  perSuppliers: PerSupplierEntry[];
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader icon={Clock} title="Settlement Health" subtitle="Sourcing efficiency snapshot" />
      <ChartFigure title="Settlement Health" summary={`${settlementRate}% of bills settled across ${buysCount} invoices and ${perSuppliers.length} active suppliers.`}>
        <ResponsiveContainer width="100%" height={175}>
          <RadialBarChart innerRadius="68%" outerRadius="100%" startAngle={210} endAngle={-30}
            data={[{ name: "Settled", value: settlementRate, fill: T.royalBurgundy }]}>
            <RadialBar dataKey="value" background={{ fill: "rgba(110,15,45,0.06)" }} cornerRadius={14} />
            <text x="50%" y="58%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.royalBurgundy }}>{settlementRate}%</text>
            <text x="50%" y="78%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, fill: T.taupe, letterSpacing: "1px" }}>BILLS SETTLED</text>
          </RadialBarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
        {[
          { label: "Avg Cost / Saree", value: pieces ? formatMoney(rupees(billed / pieces)) : "—" },
          { label: "Invoices", value: String(buysCount) },
          { label: "Active Suppliers", value: String(perSuppliers.length) },
          { label: "Avg Rating", value: perSuppliers.length ? `${(perSuppliers.reduce((a, s) => a + s.rating, 0) / perSuppliers.length).toFixed(1)} / 5` : "—" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
