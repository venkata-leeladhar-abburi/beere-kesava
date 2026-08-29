// Row 1 right card: purchase mix by saree type (donut chart).

import React from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
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

function CardHeader({ icon: Icon, title, subtitle }: {
  icon: typeof Layers;
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

export interface ByTypeEntry {
  type: string; cost: number; retail: number; qty: number;
  markup: number; avgCost: number; fill: string;
}

export function TypeMixCard({
  card, tip, byType,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  byType: ByTypeEntry[];
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader icon={Layers} title="Purchase Mix by Saree Type" subtitle="Where the sourcing budget goes" />
      <ChartFigure title="Purchase Mix by Saree Type" summary={`${byType.length} saree types: ${byType.map(d => `${d.type} ${d.qty} pcs`).join(", ")}.`}>
        <div style={{ position: "relative", marginTop: 6 }}>
          <ResponsiveContainer width="100%" height={168}>
            <PieChart>
              <Pie data={byType} dataKey="cost" nameKey="type" cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={6} cornerRadius={14} stroke="none">
                {byType.map((d) => <Cell key={d.type} fill={d.fill} />)}
              </Pie>
              <RechartsTooltip contentStyle={tip} formatter={(v: number | string, _n: string, p: { payload: ByTypeEntry }) => [`${formatMoney(rupees(Number(v)))} · ${p.payload.qty} pcs`, p.payload.type]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{byType.length}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>types</div>
          </div>
        </div>
      </ChartFigure>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {byType.map(d => (
          <div key={d.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.type}</span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown, flexShrink: 0 }}>{d.qty} pcs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
