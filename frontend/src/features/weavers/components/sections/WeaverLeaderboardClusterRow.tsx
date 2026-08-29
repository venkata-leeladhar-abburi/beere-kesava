import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Medal, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { Avatar, qcColor } from "../common/primitives";
import { ChartFigure } from "../../../../shared/ui/data";
import type { ValueType, NameType, Payload } from "recharts/types/component/DefaultTooltipContent";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

function CardHeader({ icon: Icon, title, subtitle, rightElement }: { icon: React.ElementType; title: string; subtitle?: string; rightElement?: React.ReactNode }) {
  return (
    <div style={{
      background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
      padding: "16px 20px",
      margin: "-24px -24px 20px -24px",
      borderRadius: "14px 14px 0 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3, lineHeight: 1.4 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {rightElement}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `1.5px solid ${T.royalBurgundy}`,
  padding: "24px",
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid rgba(200,155,71,0.25)`, boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)" };

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
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 22, marginBottom: 22 }}>
      <div style={cardStyle}>
        <CardBloom />
        <CardHeader
          icon={Medal}
          title="Top 10 Weavers by Output"
          subtitle={`Sarees woven in ${periodLabel.toLowerCase()} · bar colour shows QC pass rate`}
          rightElement={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {[{ c: T.darkGreen, t: "≥95%" }, { c: T.antiqueGold, t: "85–94%" }, { c: T.darkRed, t: "<85%" }].map(g => (
                <div key={g.t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: g.c }} />
                  <span style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,253,249,0.80)" }}>{g.t}</span>
                </div>
              ))}
            </div>
          }
        />
        <ChartFigure title="Top 10 Weavers by Output" summary={`${totalProduced} sarees woven in ${periodLabel.toLowerCase()}, led by ${top10[0]?.name ?? "—"}.`}>
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={top10} layout="vertical" barSize={19} margin={{ left: 10, right: 62 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="short" width={120} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
                formatter={(v: number, _n: string, p: { payload: TopWeaverRow }) => [`${v} sarees · ${p.payload.periodPassRate}% pass`, p.payload.name]} />
              <Bar dataKey="produced" radius={[10, 10, 10, 10]}
                label={{ position: "right", formatter: (v: number) => `${v}`, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
                {top10.map(w => <Cell key={w.id} fill={qcColor(w.periodPassRate)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFigure>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 border-t border-[rgba(200,155,71,0.18)] pt-4 mt-1.5">
          {top10.slice(0, 3).map((w, i) => (
            <div key={w.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: i === 0 ? "rgba(110,15,45,0.05)" : "rgba(255,255,255,0.80)", border: `1px solid ${i === 0 ? "rgba(110,15,45,0.20)" : "rgba(200,155,71,0.18)"}`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: i === 0 ? `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})` : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: i === 0 ? "#FFF" : T.taupe }}>{i + 1}</div>
              <Avatar photo={w.photo} name={w.name} initials={w.initials} bg={w.bg} size={36} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{w.produced} sarees · {totalProduced ? Math.round((w.produced / totalProduced) * 100) : 0}% of output</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <CardBloom />
        <CardHeader icon={PhMapPin} title="Output by Cluster" subtitle="Which weaving villages carry production" />
        <ChartFigure title="Output by Cluster" summary={byCluster.map(c => `${c.cluster} ${c.produced} sarees`).join(", ") + "."}>
          <ResponsiveContainer width="100%" height={186}>
            <PieChart>
              <Pie data={byCluster} dataKey="produced" nameKey="cluster" cx="50%" cy="50%" innerRadius={44} outerRadius={74} paddingAngle={5} cornerRadius={8} stroke="none">
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
