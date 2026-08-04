// Row 1 right card: purchase mix by saree type (donut chart).

import React from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
import { T, F } from "../../theme";
import { formatINR } from "../../../contexts/SupplierContext";

export interface ByTypeEntry {
  type: string; cost: number; retail: number; qty: number;
  markup: number; avgCost: number; fill: string;
}

export function TypeMixCard({
  card, cardTitle, cardSub, tip, byType,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  tip: React.CSSProperties;
  byType: ByTypeEntry[];
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Layers size={16} color={T.royalBurgundy} />
        <div style={cardTitle}>Purchase Mix by Saree Type</div>
      </div>
      <div style={cardSub}>Where the sourcing budget goes</div>
      <div style={{ position: "relative", marginTop: 10 }}>
        <ResponsiveContainer width="100%" height={168}>
          <PieChart>
            <Pie data={byType} dataKey="cost" nameKey="type" cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={3} stroke="none">
              {byType.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${formatINR(v)} · ${p.payload.qty} pcs`, p.payload.type]} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{byType.length}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>types</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
        {byType.map(d => (
          <div key={d.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.type}</span>
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, flexShrink: 0 }}>{d.qty} pcs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
