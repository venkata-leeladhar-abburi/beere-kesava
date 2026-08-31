import React from "react";
import { semantic } from "../../../../design-system/tokens";
import { Factory, TrendingUp, Layers, Package, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { FactoryLoom } from "../../data/factoryLooms";
import { T, F } from "./theme";
import { ChartFigure } from "../../../../shared/ui/data";

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
  icon: typeof Factory;
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      margin: "-24px -24px 18px -24px", padding: "16px 20px",
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

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${T.royalBurgundy}`,
  padding: "24px", boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
};
const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid rgba(200,155,71,0.25)`, boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)" };

interface MonthlyThroughputDatum {
  month: string;
  produced: number;
  passed: number;
  rate: number;
}

interface UtilisationDatum {
  name: string;
  value: number;
  color: string;
}

interface PerLoomDatum {
  wip: number;
  [key: string]: unknown;
}

interface LoomThroughputAndAvailabilityProps {
  produced: number;
  passRate: number;
  failed: number;
  pipeline: number;
  monthly: MonthlyThroughputDatum[];
  utilisation: UtilisationDatum[];
  utilRate: number;
  perLoom: PerLoomDatum[];
}

export function LoomThroughputAndAvailability({
  produced,
  passRate,
  failed,
  pipeline,
  monthly,
  utilisation,
  utilRate,
  perLoom,
}: LoomThroughputAndAvailabilityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 22, marginBottom: 22 }}>
      <div style={cardStyle}>
        <CardBloom />
        <CardHeader
          icon={Factory}
          title="Factory Throughput"
          subtitle="Sarees completed against quality-check outcomes"
          rightElement={
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20 }}>
              <TrendingUp size={13} color="#FFFDF9" />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9" }}>{failed} rejected</span>
            </div>
          }
        />
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "4px 0 2px" }}>{produced}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{pipeline} sarees still in the pipeline across active batches</div>
        {monthly.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No sarees completed in this period.</div>
        ) : (
          <ChartFigure title="Factory Throughput" summary={`${produced} sarees completed, ${passRate}% pass rate, ${failed} rejected.`}>
            <ResponsiveContainer width="100%" height={208}>
              <ComposedChart data={monthly} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} hide />
                <RechartsTooltip contentStyle={tip} formatter={(v: number | string, n: string) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, paddingTop: 8 }} />
                <Bar name="Completed" dataKey="produced" fill={T.royalBurgundy} radius={[10, 10, 10, 10]} />
                <Bar name="Passed QC" dataKey="passed" fill={semantic.chart.series[1]} radius={[10, 10, 10, 10]} />
                <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.royalBurgundy} strokeWidth={2.5} dot={{ r: 3.5, fill: T.royalBurgundy, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartFigure>
        )}
      </div>

      <div style={cardStyle}>
        <CardBloom />
        <CardHeader icon={Factory} title="Loom Availability" subtitle="Current floor state · idle looms are lost capacity" />
        <ChartFigure title="Loom Availability" summary={`${utilRate}% running: ${utilisation.map(d => `${d.name} ${d.value}`).join(", ")}.`}>
          <div style={{ position: "relative" as const, marginTop: 6 }}>
            <ResponsiveContainer width="100%" height={172}>
              <PieChart>
                <Pie data={utilisation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={5} cornerRadius={8} stroke="none">
                  {utilisation.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={tip} formatter={(v: number | string, _n: string, p: { payload: UtilisationDatum }) => [`${v} looms`, p.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const }}>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{utilRate}%</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>running</div>
            </div>
          </div>
        </ChartFigure>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {utilisation.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          <span>Sarees in progress</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{perLoom.reduce((a, l) => a + l.wip, 0)}</span>
        </div>
      </div>
    </div>
  );
}

interface MaterialConsumptionDatum {
  label: string;
  qty: number;
  unit: string;
  type: string;
  fill: string;
}

interface DesignOutputDatum {
  short: string;
  produced: number;
  type: string;
  fill: string;
}

interface LoomMaterialDesignRowProps {
  byMaterial: MaterialConsumptionDatum[];
  warpKg: number;
  produced: number;
  byDesign: DesignOutputDatum[];
  passRate: number;
  failed: number;
  activeLooms: number;
  pipeline: number;
  looms: FactoryLoom[];
}

export function LoomMaterialDesignRow({
  byMaterial,
  warpKg,
  produced,
  byDesign,
  passRate,
  failed,
  activeLooms,
  pipeline,
  looms,
}: LoomMaterialDesignRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 22, paddingBottom: 8 }}>
      <div style={cardStyle}>
        <CardBloom />
        <CardHeader icon={Layers} title="Material Consumption" subtitle="Issued to looms · units kept separate" />
        {byMaterial.length === 0 ? (
          <div style={{ padding: "62px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No material issued in this period.</div>
        ) : (
          <>
            <ChartFigure title="Material Consumption" summary={`Warp drawn ${warpKg.toFixed(1)} kg across ${byMaterial.length} material types.`}>
              <ResponsiveContainer width="100%" height={215}>
                <BarChart data={byMaterial} barSize={26} margin={{ top: 16, left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={48} />
                  <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
                    formatter={(v: number | string, _n: string, p: { payload: MaterialConsumptionDatum }) => [`${v} ${p.payload.unit}`, p.payload.type]} />
                  <Bar dataKey="qty" radius={[10, 10, 10, 10]}>
                    {byMaterial.map(d => <Cell key={d.label} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFigure>
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>WARP DRAWN</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{warpKg.toFixed(1)} kg</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>AVG / SAREE</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{produced ? `${(warpKg / produced).toFixed(2)} kg` : "—"}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={cardStyle}>
        <CardBloom />
        <CardHeader icon={Package} title="Output by Design" subtitle="Top producing saree types" />
        <ChartFigure title="Output by Design" summary={`${byDesign.length} designs; top design is ${byDesign[0]?.type ?? "—"}.`}>
          <ResponsiveContainer width="100%" height={215}>
            <BarChart data={byDesign} barSize={30} margin={{ top: 16, left: 10, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" vertical={false} />
              <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
              <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
                formatter={(v: number | string, _n: string, p: { payload: DesignOutputDatum }) => [`${v} sarees`, p.payload.type]} />
              <Bar dataKey="produced" radius={[10, 10, 10, 10]}>
                {byDesign.map(d => <Cell key={d.type} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFigure>
        <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>TOP DESIGN</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{byDesign[0]?.type ?? "—"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>DESIGNS ACTIVE</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{byDesign.length}</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <CardBloom />
        <CardHeader icon={Percent} title="Factory Health" subtitle="Quality and capacity snapshot" />
        <ChartFigure title="Factory Health" summary={`${passRate}% QC pass rate, ${failed} rejected, ${pipeline} sarees in open pipeline.`}>
          <ResponsiveContainer width="100%" height={175}>
            <RadialBarChart innerRadius="68%" outerRadius="100%" startAngle={210} endAngle={-30}
              data={[{ name: "Pass", value: passRate, fill: T.royalBurgundy }]}>
              <RadialBar dataKey="value" background={{ fill: "rgba(110,15,45,0.06)" }} cornerRadius={14} />
              <text x="50%" y="58%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, fill: T.royalBurgundy }}>{passRate}%</text>
              <text x="50%" y="78%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, fill: T.taupe, letterSpacing: "1px" }}>QC PASS RATE</text>
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartFigure>
        <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
          {[
            { label: "Rejected", value: `${failed} pcs` },
            { label: "Avg / Loom", value: `${activeLooms ? Math.round(produced / activeLooms) : 0} pcs` },
            { label: "Open Pipeline", value: `${pipeline} pcs` },
            { label: "Looms Down", value: String(looms.filter(l => l.status === "maintenance").length) },
          ].map(k => (
            <div key={k.label} style={{ background: "rgba(255,255,255,0.80)", borderRadius: 12, padding: "10px 12px", border: `1px solid rgba(200,155,71,0.18)` }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{k.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
