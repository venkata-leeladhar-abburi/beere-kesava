// Row 2 left card: top suppliers by purchase value (horizontal bar chart).

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import type { ValueType, NameType, Payload } from "recharts/types/component/DefaultTooltipContent";
import { Trophy } from "lucide-react";
import { T, F } from "../../theme";
import { ChartFigure } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";

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
  icon: typeof Trophy;
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

export interface PerSupplierEntry {
  id: string; name: string; short: string; initials: string; specialty: string;
  terms: string; rating: number; billed: number; pieces: number; orders: number;
  paid: number; outstanding: number; avgPiece: number;
}

export function TopSuppliersCard({
  card, tip, topSuppliers, top5Share, billed,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  topSuppliers: PerSupplierEntry[];
  top5Share: number;
  billed: number;
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader
        icon={Trophy}
        title="Top Suppliers by Purchase Value"
        subtitle="Sourcing concentration across the network"
        rightElement={
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "rgba(255,253,249,0.70)" }}>TOP 5 SHARE</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>{top5Share}%</div>
          </div>
        }
      />
      <ChartFigure title="Top Suppliers by Purchase Value" summary={`Top ${topSuppliers.length} suppliers account for ${top5Share}% of ${formatMoney(rupees(billed))} billed.`}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={topSuppliers} layout="vertical" barSize={18} margin={{ left: 6, right: 76 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,155,71,0.15)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="short" width={132} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ fill: "rgba(200,155,71,0.06)" }} contentStyle={tip}
              formatter={(v: ValueType, _n: NameType, p: Payload<ValueType, NameType>) => {
                const entry = p.payload as PerSupplierEntry;
                return [`${formatMoney(rupees(v as number))} · ${entry.pieces} sarees · ${formatMoney(rupees(entry.avgPiece))}/pc`, entry.name];
              }} />
            <Bar dataKey="billed" radius={[10, 10, 10, 10]}
              label={{ position: "right", formatter: (v: number) => formatMoney(rupees(v)), fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
              {topSuppliers.map((s, i) => (
                <Cell key={s.id} fill={i === 0 ? T.royalBurgundy : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : "rgba(200,155,71,0.45)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[rgba(200,155,71,0.18)] pt-3.5 mt-3.5">
        {topSuppliers.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{toInitials(s.initials)}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe }}>{billed ? Math.round((s.billed / billed) * 100) : 0}% share</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
