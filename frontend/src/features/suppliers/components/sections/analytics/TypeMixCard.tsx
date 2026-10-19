// Row 1 right card: purchase mix by saree type (donut chart).

import React from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
import { T, F } from "../../theme";
import { formatMoney, rupees } from "@/lib/domain/money";
import { ChartFigure } from "../../../../../shared/ui/data";
import { rowFormatter } from "@/shared/ui/data/rowFormatter";

function CardBloom() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top: -70,
        right: -70,
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
        pointerEvents: "none",
      }}
    />
  );
}

function CardHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Layers;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        margin: "-24px -28px 18px -28px",
        padding: "16px 20px",
        background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
        borderRadius: "14px 14px 0 0",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 10,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.12)",
          }}
        >
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 15,
              color: "#FFFDF9",
              letterSpacing: "-0.1px",
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: "rgba(255,253,249,0.65)",
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ByTypeEntry {
  type: string;
  cost: number;
  retail: number;
  qty: number;
  markup: number;
  avgCost: number;
  fill: string;
}

/** Slices shown before the rest are folded into "Other" — 120+ types made the
 *  donut a ring of hairlines and the legend an endless list. */
const TOP_TYPES = 7;
const OTHER_FILL = "#CBBFB4";

export function TypeMixCard({
  card,
  tip,
  byType,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  tip: React.CSSProperties;
  byType: ByTypeEntry[];
}) {
  const totalCost = byType.reduce((s, d) => s + d.cost, 0);
  const totalQty = byType.reduce((s, d) => s + d.qty, 0);
  const top = byType.slice(0, TOP_TYPES);
  const rest = byType.slice(TOP_TYPES);
  const slices: (Pick<ByTypeEntry, "type" | "cost" | "qty" | "fill"> & { other?: number })[] = [
    ...top,
    ...(rest.length
      ? [
          {
            type: `Other ${rest.length} types`,
            cost: rest.reduce((s, d) => s + d.cost, 0),
            qty: rest.reduce((s, d) => s + d.qty, 0),
            fill: OTHER_FILL,
            other: rest.length,
          },
        ]
      : []),
  ];
  const share = (cost: number) => (totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0);

  return (
    <div style={{ ...card, height: "100%" }}>
      <CardBloom />
      <CardHeader
        icon={Layers}
        title="Purchase Mix by Saree Type"
        subtitle="Share of purchase value, largest first"
      />
      <ChartFigure
        title="Purchase Mix by Saree Type"
        summary={`${byType.length} saree types: ${slices
          .map((d) => `${d.type} ${share(d.cost)}%`)
          .join(", ")}.`}
      >
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={176}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="cost"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={80}
                paddingAngle={slices.length > 1 ? 2 : 0}
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {slices.map((d) => (
                  <Cell key={d.type} fill={d.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={tip}
                formatter={rowFormatter(
                  (v: number | string, _n: string, p: { payload: ByTypeEntry }) => [
                    `${formatMoney(rupees(Number(v)))} · ${p.payload.qty} pcs`,
                    p.payload.type,
                  ]
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontFamily: F.display,
                fontSize: 24,
                fontWeight: 700,
                color: T.luxuryBrown,
                lineHeight: 1,
              }}
            >
              {byType.length}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
              types · {totalQty.toLocaleString("en-IN")} pcs
            </div>
          </div>
        </div>
      </ChartFigure>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {slices.map((d) => {
          const pct = share(d.cost);
          return (
            <div key={d.type} title={`${d.type}: ${formatMoney(rupees(d.cost))}`}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto auto",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: d.fill,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: F.ui,
                      fontSize: 12.5,
                      color: d.other ? T.taupe : T.luxuryBrown,
                      fontStyle: d.other ? "italic" : undefined,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.type}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: T.taupe,
                    textAlign: "right",
                    minWidth: 56,
                  }}
                >
                  {d.qty.toLocaleString("en-IN")} pcs
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.luxuryBrown,
                    textAlign: "right",
                    minWidth: 36,
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 99,
                  background: "rgba(110,15,45,0.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(pct, 1)}%`,
                    height: "100%",
                    borderRadius: 99,
                    background: d.fill,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
