// Row 3: suppliers-by-rating bar chart, payments-by-mode donut, and the
// settlement-health radial gauge — three small cards side by side.

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import { Star, Wallet, Clock } from "lucide-react";
import { T, F } from "../../theme";
import { Supplier, formatINR } from "../../../contexts/SupplierContext";
import { PerSupplierEntry } from "./TopSuppliersCard";

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
      <ResponsiveContainer width="100%" height={182}>
        <BarChart data={data} layout="vertical" margin={{ top: 16, left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
          <YAxis dataKey="rating" type="category" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={50} />
          <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
            formatter={(v: any, _n: any, p: any) => [`${v} suppliers`, p.payload.rating]} />
          <Bar dataKey="count" fill={T.antiqueGold} radius={[0, 5, 5, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
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
      <div style={cardSub}>How suppliers were settled · {formatINR(settled)}</div>
      {byMode.length === 0 ? (
        <div style={{ padding: "56px 0", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={168}>
            <PieChart>
              <Pie data={byMode} dataKey="amount" nameKey="mode" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} stroke="none">
                {byMode.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [formatINR(v), p.payload.mode]} />
            </PieChart>
          </ResponsiveContainer>
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
      <ResponsiveContainer width="100%" height={140}>
        <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
          data={[{ name: "Settled", value: settlementRate, fill: settlementRate >= 90 ? T.greenMid : settlementRate >= 70 ? T.antiqueGold : T.crimson }]}>
          <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
          <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{settlementRate}%</text>
          <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }}>BILLS SETTLED</text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
        {[
          { label: "Avg Cost / Saree", value: pieces ? `₹${Math.round(billed / pieces).toLocaleString("en-IN")}` : "—" },
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
