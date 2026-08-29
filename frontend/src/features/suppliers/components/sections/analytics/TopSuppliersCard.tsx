// Row 2 left card: top suppliers by purchase value (horizontal bar chart).

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import type { ValueType, NameType, Payload } from "recharts/types/component/DefaultTooltipContent";
import { Trophy } from "lucide-react";
import { T, F } from "../../theme";
import { semantic } from "../../../../../design-system/tokens";
import { ChartFigure } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";

export interface PerSupplierEntry {
  id: string; name: string; short: string; initials: string; specialty: string;
  terms: string; rating: number; billed: number; pieces: number; orders: number;
  paid: number; outstanding: number; avgPiece: number;
}

export function TopSuppliersCard({
  card, cardTitle, cardSub, tip, topSuppliers, top5Share, billed,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  tip: React.CSSProperties;
  topSuppliers: PerSupplierEntry[];
  top5Share: number;
  billed: number;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={17} color={T.antiqueGold} />
          <div>
            <div style={cardTitle}>Top Suppliers by Purchase Value</div>
            <div style={cardSub}>Sourcing concentration across the network</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: T.taupe }}>TOP 5 SHARE</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: top5Share > 80 ? T.crimson : T.royalBurgundy }}>{top5Share}%</div>
        </div>
      </div>
      <ChartFigure title="Top Suppliers by Purchase Value" summary={`Top ${topSuppliers.length} suppliers account for ${top5Share}% of ${formatMoney(rupees(billed))} billed.`}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={topSuppliers} layout="vertical" barSize={20} margin={{ left: 6, right: 76 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.06)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="short" width={132} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.luxuryBrown }} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={tip}
              formatter={(v: ValueType, _n: NameType, p: Payload<ValueType, NameType>) => {
                const entry = p.payload as PerSupplierEntry;
                return [`${formatMoney(rupees(v as number))} · ${entry.pieces} sarees · ${formatMoney(rupees(entry.avgPiece))}/pc`, entry.name];
              }} />
            <Bar dataKey="billed" radius={[0, 6, 6, 0]}
              label={{ position: "right", formatter: (v: number) => formatMoney(rupees(v)), fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: T.luxuryBrown }}>
              {topSuppliers.map((s, i) => (
                <Cell key={s.id} fill={semantic.chart.series[i % semantic.chart.series.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFigure>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[var(--border-default)] pt-3.5 mt-3.5">
        {topSuppliers.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: i === 0 ? `linear-gradient(135deg,${T.antiqueGold},${T.goldLight})` : T.silkCream, border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800, color: i === 0 ? T.darkBurgundy : T.taupe }}>{i + 1}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{toInitials(s.initials)}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{billed ? Math.round((s.billed / billed) * 100) : 0}% share</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
