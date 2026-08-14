import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Medal, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { Avatar, qcColor } from "../common/primitives";
import { ChartFigure } from "../../../../shared/ui/data";
import type { ValueType, NameType, Payload } from "recharts/types/component/DefaultTooltipContent";

const card: React.CSSProperties = {
  background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
  boxShadow: "0 6px 32px rgba(74,6,27,0.07)", padding: "24px 28px",
};
const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown };
const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 };
const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

// Shapes mirror the `top10` / `byCluster` memos built in WeaverAnalytics.tsx
// (perWeaver rows sorted/mapped for the chart, and per-cluster aggregates).
interface TopWeaverRow {
  id: string;
  name: string;
  short: string;
  photo: string | undefined;
  initials: string;
  bg: string;
  produced: number;
  periodPassRate: number;
}

interface ClusterRow {
  cluster: string;
  produced: number;
  weavers: number;
  fill: string;
}

interface WeaverLeaderboardClusterRowProps {
  top10: TopWeaverRow[];
  periodLabel: string;
  totalProduced: number;
  byCluster: ClusterRow[];
}

export function WeaverLeaderboardClusterRow({
  top10,
  periodLabel,
  totalProduced,
  byCluster,
}: WeaverLeaderboardClusterRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 24, marginBottom: 24 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Medal size={20} color={T.antiqueGold} />
            </div>
            <div>
              <div style={cardTitle}>Top 10 Weavers by Output</div>
              <div style={cardSub}>Sarees woven in {periodLabel.toLowerCase()} · bar colour shows QC pass rate</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {[{ c: T.green, t: "≥95%" }, { c: "#8B6018", t: "85–94%" }, { c: T.crimson, t: "<85%" }].map(g => (
              <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: g.c }} />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{g.t}</span>
              </div>
            ))}
          </div>
        </div>
        <ChartFigure title="Top 10 Weavers by Output" summary={`${totalProduced} sarees woven in ${periodLabel.toLowerCase()}, led by ${top10[0]?.name ?? "—"}.`}>
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={top10} layout="vertical" barSize={19} margin={{ left: 4, right: 62 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="short" width={116} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                formatter={(v: number, _n: string, p: { payload: TopWeaverRow }) => [`${v} sarees · ${p.payload.periodPassRate}% pass`, p.payload.name]} />
              <Bar dataKey="produced" radius={[0, 6, 6, 0]}
                label={{ position: "right", formatter: (v: number) => `${v}`, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                {top10.map(w => <Cell key={w.id} fill={qcColor(w.periodPassRate)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFigure>
        <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, marginTop: 6 }}>
          {top10.slice(0, 3).map((w, i) => (
            <div key={w.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "rgba(200,155,71,0.08)" : T.silkCream, border: `1px solid ${i === 0 ? T.borderGold : T.borderDef}`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: i === 0 ? "linear-gradient(135deg,#C89B47,#E7C983)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: i === 0 ? "#FFF" : T.taupe }}>{i + 1}</div>
              <Avatar photo={w.photo} initials={w.initials} bg={w.bg} size={36} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{w.produced} sarees · {totalProduced ? Math.round((w.produced / totalProduced) * 100) : 0}% of output</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PhMapPin size={18} color={T.royalBurgundy} />
          <div style={cardTitle}>Output by Cluster</div>
        </div>
        <div style={cardSub}>Which weaving villages carry production</div>
        <ChartFigure title="Output by Cluster" summary={byCluster.map(c => `${c.cluster} ${c.produced} sarees`).join(", ") + "."}>
          <ResponsiveContainer width="100%" height={186}>
            <PieChart>
              <Pie data={byCluster} dataKey="produced" nameKey="cluster" cx="50%" cy="50%" innerRadius={44} outerRadius={74} paddingAngle={3} stroke="none">
                {byCluster.map((d) => <Cell key={d.cluster} fill={d.fill} />)}
              </Pie>
              <RechartsTooltip contentStyle={tip} formatter={(v: ValueType, _n: NameType, p: Payload<ValueType, NameType>) => {
                const entry = p.payload as ClusterRow;
                return [`${v} sarees · ${entry.weavers} weavers`, entry.cluster];
              }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFigure>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 8 }}>
          {byCluster.map(c => (
            <div key={c.cluster}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.fill, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.cluster}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown, flexShrink: 0 }}>{totalProduced ? Math.round((c.produced / totalProduced) * 100) : 0}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${totalProduced ? (c.produced / totalProduced) * 100 : 0}%`, height: "100%", background: c.fill, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
