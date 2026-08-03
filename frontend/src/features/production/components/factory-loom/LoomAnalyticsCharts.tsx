import React from "react";
import { Factory, TrendingUp, Layers, Package, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { FactoryLoom } from "../../data/factoryLooms";
import { T, F } from "./theme";
import { MAT_TAG } from "./types";

const FLOOR_FILLS = [T.royalBurgundy, T.antiqueGold, T.green, "#5A3E6B", "#2D6B6B"];
const laQcColor = (r: number) => (r >= 95 ? T.green : r >= 85 ? "#8B6018" : T.crimson);

const card: React.CSSProperties = {
  background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`,
  padding: "24px 28px", boxShadow: "0 2px 12px rgba(74,6,27,0.05)",
};
const cardTitle: React.CSSProperties = { fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown };
const cardSub: React.CSSProperties = { fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 };
const tip = { fontFamily: F.ui, fontSize: 12, borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 24px rgba(74,6,27,0.12)" };

interface LoomThroughputAndAvailabilityProps {
  produced: number;
  passRate: number;
  failed: number;
  pipeline: number;
  monthly: any[];
  utilisation: any[];
  utilRate: number;
  perLoom: any[];
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
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22, marginBottom: 22 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={cardTitle}>Factory Throughput</div>
            <div style={cardSub}>Sarees completed against quality-check outcomes</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: passRate >= 90 ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", padding: "4px 10px", borderRadius: 20 }}>
            <TrendingUp size={13} color={passRate >= 90 ? T.green : T.crimson} />
            <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: passRate >= 90 ? T.green : T.crimson }}>{failed} rejected</span>
          </div>
        </div>
        <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, margin: "10px 0 2px" }}>{produced}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{pipeline} sarees still in the pipeline across active batches</div>
        {monthly.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>No sarees completed in this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <ComposedChart data={monthly} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} hide />
              <RechartsTooltip contentStyle={tip} formatter={(v: any, n: any) => n === "Pass Rate" ? [`${v}%`, n] : [`${v} sarees`, n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, paddingTop: 8 }} />
              <Bar name="Completed" dataKey="produced" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} />
              <Bar name="Passed QC" dataKey="passed" fill={T.goldLight} radius={[5, 5, 0, 0]} />
              <Line yAxisId="r" name="Pass Rate" dataKey="rate" stroke={T.green} strokeWidth={2.5} dot={{ r: 3.5, fill: T.green, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Factory size={16} color={T.royalBurgundy} />
          <div style={cardTitle}>Loom Availability</div>
        </div>
        <div style={cardSub}>Current floor state · idle looms are lost capacity</div>
        <div style={{ position: "relative" as const, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height={172}>
            <PieChart>
              <Pie data={utilisation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} stroke="none">
                {utilisation.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <RechartsTooltip contentStyle={tip} formatter={(v: any, _n: any, p: any) => [`${v} looms`, p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute" as const, inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const }}>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{utilRate}%</div>
            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>running</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {utilisation.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{d.name}</span>
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown }}>{d.value}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          <span>Sarees in progress</span>
          <span style={{ fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>{perLoom.reduce((a, l) => a + l.wip, 0)}</span>
        </div>
      </div>
    </div>
  );
}

interface LoomMaterialDesignRowProps {
  byMaterial: any[];
  warpKg: number;
  produced: number;
  byDesign: any[];
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, paddingBottom: 8 }}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Layers size={16} color={T.royalBurgundy} />
          <div style={cardTitle}>Material Consumption</div>
        </div>
        <div style={cardSub}>Issued to looms · units kept separate</div>
        {byMaterial.length === 0 ? (
          <div style={{ padding: "62px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No material issued in this period.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={186}>
              <BarChart data={byMaterial} barSize={26} margin={{ top: 16, left: -20, right: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontFamily: F.ui, fontSize: 9.5, fill: T.taupe }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={38} />
                <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
                  formatter={(v: any, _n: any, p: any) => [`${v} ${p.payload.unit}`, p.payload.type]} />
                <Bar dataKey="qty" radius={[5, 5, 0, 0]}>
                  {byMaterial.map(d => <Cell key={d.label} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
              <span>Warp drawn {warpKg.toFixed(1)} kg</span>
              <span style={{ color: T.luxuryBrown, fontWeight: 700 }}>
                {produced ? `${(warpKg / produced).toFixed(2)} kg/saree` : "—"}
              </span>
            </div>
          </>
        )}
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Package size={16} color={T.royalBurgundy} />
          <div style={cardTitle}>Output by Design</div>
        </div>
        <div style={cardSub}>Top producing saree types</div>
        <ResponsiveContainer width="100%" height={186}>
          <BarChart data={byDesign} barSize={30} margin={{ top: 16, left: -20, right: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" vertical={false} />
            <XAxis dataKey="short" tick={{ fontFamily: F.ui, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }} axisLine={false} tickLine={false} width={34} allowDecimals={false} />
            <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
              formatter={(v: any, _n: any, p: any) => [`${v} sarees`, p.payload.type]} />
            <Bar dataKey="produced" radius={[5, 5, 0, 0]}>
              {byDesign.map(d => <Cell key={d.type} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
          <span>{byDesign.length} designs</span>
          <span style={{ color: T.luxuryBrown, fontWeight: 600 }}>Top: {byDesign[0]?.type ?? "—"}</span>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Percent size={16} color={T.royalBurgundy} />
          <div style={cardTitle}>Factory Health</div>
        </div>
        <div style={cardSub}>Quality and capacity snapshot</div>
        <ResponsiveContainer width="100%" height={142}>
          <RadialBarChart innerRadius="62%" outerRadius="100%" startAngle={210} endAngle={-30}
            data={[{ name: "Pass", value: passRate, fill: laQcColor(passRate) }]}>
            <RadialBar dataKey="value" background={{ fill: T.silkCream }} cornerRadius={10} />
            <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, fill: T.luxuryBrown }}>{passRate}%</text>
            <text x="50%" y="80%" textAnchor="middle" style={{ fontFamily: F.ui, fontSize: 10.5, fill: T.taupe }}>QC PASS RATE</text>
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
          {[
            { label: "Rejected", value: `${failed} pcs` },
            { label: "Avg / Loom", value: `${activeLooms ? Math.round(produced / activeLooms) : 0} pcs` },
            { label: "Open Pipeline", value: `${pipeline} pcs` },
            { label: "Looms Down", value: String(looms.filter(l => l.status === "maintenance").length) },
          ].map(k => (
            <div key={k.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.5px", color: T.taupe, marginBottom: 4, textTransform: "uppercase" as const }}>{k.label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
