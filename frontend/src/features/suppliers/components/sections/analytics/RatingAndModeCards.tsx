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

export function RatingCard({
  card, cardTitle, cardSub, tip, suppliers,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  tip: React.CSSProperties;
  suppliers: Supplier[];
}) {
  const data = Object.entries(suppliers.reduce((acc, s) => {
    const r = Math.round(s.rating || 3);
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>))
    .map(([k, v]) => ({ rating: `${k} Stars`, count: v }))
    .reverse();

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Star size={16} color={T.royalBurgundy} />
        <div style={cardTitle}>Suppliers by Rating</div>
      </div>
      <div style={cardSub}>Distribution of supplier quality</div>
      <ChartFigure title="Suppliers by Rating" summary={`${suppliers.length} suppliers: ${data.map(d => `${d.rating} ${d.count}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height={182}>
          <BarChart data={data} layout="vertical" margin={{ top: 16, left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
            <YAxis dataKey="rating" type="category" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={50} />
            <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
              formatter={(v: any, _n: any, p: any) => [`${v} suppliers`, p.payload.rating]} />
            <Bar dataKey="count" fill={semantic.chart.series[1]} radius={[0, 5, 5, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        <span>Total Suppliers {suppliers.length}</span>
      </div>
    </div>
  );
}

export function PaymentModeCard({
  card, cardTitle, cardSub, tip, byMode, settled,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  tip: React.CSSProperties;
  byMode: { mode: string; amount: number; fill: string }[];
  settled: number;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Wallet size={16} color={T.royalBurgundy} />
        <div style={cardTitle}>Payments by Mode</div>
      </div>
      <div style={cardSub}>How suppliers were settled · {formatMoney(rupees(settled))}</div>
      {byMode.length === 0 ? (
        <div style={{ padding: "56px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
      ) : (
        <>
          <ChartFigure title="Payments by Mode" summary={`${formatMoney(rupees(settled))} settled: ${byMode.map(d => `${d.mode} ${formatMoney(rupees(d.amount))}`).join(", ")}.`}>
            <ResponsiveContainer width="100%" height={168}>
              <PieChart>
                <Pie data={byMode} dataKey="amount" nameKey="mode" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} stroke="none">
                  {byMode.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [formatMoney(rupees(v)), p.payload.mode]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartFigure>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
            {byMode.map(d => (
              <div key={d.mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.mode}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>
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
  card, cardTitle, cardSub, settlementRate, pieces, billed, buysCount, perSuppliers,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  settlementRate: number;
  pieces: number;
  billed: number;
  buysCount: number;
  perSuppliers: PerSupplierEntry[];
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Clock size={16} color={T.royalBurgundy} />
        <div style={cardTitle}>Settlement Health</div>
      </div>
      <div style={cardSub}>Sourcing efficiency snapshot</div>
      <ChartFigure title="Settlement Health" summary={`${settlementRate}% of bills settled across ${buysCount} invoices and ${perSuppliers.length} active suppliers.`}>
        <ResponsiveContainer width="100%" height={140}>
          <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
            data={[{ name: "Settled", value: settlementRate, fill: settlementRate >= 90 ? T.greenMid : settlementRate >= 70 ? T.antiqueGold : T.crimson }]}>
            <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
            <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{settlementRate}%</text>
            <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }}>BILLS SETTLED</text>
          </RadialBarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10, marginTop: 6 }}>
        {[
          { label: "Avg Cost / Saree", value: pieces ? formatMoney(rupees(billed / pieces)) : "—" },
          { label: "Invoices", value: String(buysCount) },
          { label: "Active Suppliers", value: String(perSuppliers.length) },
          { label: "Avg Rating", value: perSuppliers.length ? `${(perSuppliers.reduce((a, s) => a + s.rating, 0) / perSuppliers.length).toFixed(1)} / 5` : "—" },
        ].map(k => (
          <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
