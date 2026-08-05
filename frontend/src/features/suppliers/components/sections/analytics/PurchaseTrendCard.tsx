// Row 1 left card: purchase value & volume trend (bar + line combo chart).

import React from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { T, F } from "../../theme";
import { formatINR } from "../../../contexts/SupplierContext";

export function PurchaseTrendCard({
  card, cardTitle, cardSub, tip, billed, buysCount, pieces, monthly, trendDelta,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  tip: React.CSSProperties;
  billed: number;
  buysCount: number;
  pieces: number;
  monthly: { month: string; spend: number; pieces: number; orders: number }[];
  trendDelta: number | null;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={cardTitle}>Purchase Value &amp; Volume</div>
          <div style={cardSub}>Billed amount against sarees received</div>
        </div>
        {trendDelta !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: trendDelta >= 0 ? T.greenBg : T.crimsonBg, padding: "4px 10px", borderRadius: 20 }}>
            <TrendingUp size={13} color={trendDelta >= 0 ? T.greenMid : T.crimson} style={{ transform: trendDelta >= 0 ? "none" : "scaleY(-1)" }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: trendDelta >= 0 ? T.greenMid : T.crimson }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev month</span>
          </div>
        )}
      </div>
      <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "8px 0 2px" }}>{formatINR(billed)}</div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{buysCount} invoices · {pieces} sarees</div>
      <ResponsiveContainer width="100%" height={205}>
        <ComposedChart data={monthly} barSize={26}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" hide />
          <YAxis yAxisId="r" orientation="right" hide />
          <RechartsTooltip contentStyle={tip}
            formatter={(v: any, n: any) => n === "Purchased" ? [formatINR(v), n] : [`${v} sarees`, n]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
          <Bar yAxisId="l" name="Purchased" dataKey="spend" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
          <Line yAxisId="r" name="Sarees" dataKey="pieces" stroke={T.antiqueGold} strokeWidth={2.5} dot={{ r: 4, fill: T.antiqueGold, strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
