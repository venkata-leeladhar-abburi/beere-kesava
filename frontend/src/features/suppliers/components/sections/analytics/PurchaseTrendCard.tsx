// Row 1 left card: purchase value & volume trend (bar + line combo chart).

import React from "react";
import { semantic } from "../../../../../design-system/tokens";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { T, F } from "../../theme";
import { formatMoney, rupees } from "@/lib/domain/money";
import { ChartFigure } from "../../../../../shared/ui/data";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

function CardHeader({ icon: Icon, title, subtitle, rightElement }: {
  icon: typeof TrendingUp;
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
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
      {rightElement}
    </div>
  );
}

export function PurchaseTrendCard({
  card, tip, billed, buysCount, pieces, monthly, trendDelta,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  billed: number;
  buysCount: number;
  pieces: number;
  monthly: { month: string; spend: number; pieces: number; orders: number }[];
  trendDelta: number | null;
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader
        icon={TrendingUp}
        title="Purchase Value & Volume"
        subtitle="Billed amount against sarees received"
        rightElement={
          trendDelta !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20 }}>
              <TrendingUp size={13} color="#FFFDF9" style={{ transform: trendDelta >= 0 ? "none" : "scaleY(-1)" }} />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9" }}>{trendDelta >= 0 ? "+" : ""}{trendDelta}% vs prev</span>
            </div>
          ) : undefined
        }
      />
      <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "4px 0 2px" }}>{formatMoney(rupees(billed))}</div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{buysCount} invoices · {pieces} sarees</div>
      <ChartFigure title="Purchase Value & Volume" summary={`${formatMoney(rupees(billed))} billed across ${buysCount} invoices, ${pieces} sarees received.`}>
        <ResponsiveContainer width="100%" height={205}>
          <ComposedChart data={monthly} barSize={26}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" hide />
            <YAxis yAxisId="r" orientation="right" hide />
            <RechartsTooltip contentStyle={tip}
              formatter={(v: number, n: string) => n === "Purchased" ? [formatMoney(rupees(v)), n] : [`${v} sarees`, n]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
            <Bar yAxisId="l" name="Purchased" dataKey="spend" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} />
            <Line yAxisId="r" name="Sarees" dataKey="pieces" stroke={semantic.chart.series[1]} strokeWidth={2.5} dot={{ r: 4, fill: semantic.chart.series[1], strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFigure>
    </div>
  );
}
