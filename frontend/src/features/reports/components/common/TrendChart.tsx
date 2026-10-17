import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { semantic } from "../../../../design-system/tokens";
import { useDataAccess } from "@/shared/ui/domain";
import { rupees, formatMoney } from "@/lib/domain/money";
import { T, F } from "../theme";
import type { SeriesPoint } from "../timeSeries";
import type { MetricUnit } from "../reportExport";
import { formatMetricValue } from "./compare";

const PRIOR_COLOR = semantic.chart.series[1];

function TrendTooltip({
  active,
  payload,
  label,
  unit,
  hidden,
  currentName,
  priorName,
}: TooltipProps<ValueType, NameType> & {
  unit: MetricUnit;
  hidden: boolean;
  currentName: string;
  priorName: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload as SeriesPoint;
  const fmt = (v: number) => (hidden ? "••••" : formatMetricValue(v, unit));
  return (
    <div
      style={{
        background: "#FFFDF9",
        border: `1px solid ${T.borderDef}`,
        borderRadius: 9,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(74,6,27,0.12)",
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: T.taupe,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {[
        { name: currentName, value: p.current, color: T.royalBurgundy },
        ...(p.prior !== null ? [{ name: priorName, value: p.prior, color: PRIOR_COLOR }] : []),
      ].map((row) => (
        <div
          key={row.name}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{row.name}:</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 700,
              color: T.luxuryBrown,
              marginLeft: "auto",
            }}
          >
            {fmt(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The reports' trend chart: the selected period bucket by bucket, with the
 * comparison period drawn alongside (lighter bars / a dashed line) when
 * comparing.
 */
export function TrendChart({
  points,
  unit,
  kind = "bar",
  height = 240,
  currentName,
  priorName,
  emptyText,
  gate,
}: {
  points: SeriesPoint[];
  unit: MetricUnit;
  kind?: "bar" | "line";
  height?: number;
  currentName: string;
  priorName?: string | null;
  emptyText: string;
  gate?: "cost" | "sell" | "margin" | "payroll";
}) {
  const visible = useDataAccess(gate ?? "sell");
  const hidden = unit === "money" && !visible;
  const comparing = points.some((p) => p.prior !== null);
  const hasData = points.some((p) => p.current !== 0 || (p.prior ?? 0) !== 0);

  if (points.length === 0 || !hasData) {
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          fontFamily: F.ui,
          fontSize: 13,
          color: T.taupe,
        }}
      >
        {emptyText}
      </div>
    );
  }

  const axisTick = { fontFamily: "var(--font-mono)", fontSize: 11, fill: T.taupe };
  const yFormat = (v: number) =>
    hidden ? "••" : unit === "money" ? formatMoney(rupees(v), { compact: true }) : String(v);
  const tooltip = (
    <Tooltip
      content={
        <TrendTooltip
          unit={unit}
          hidden={hidden}
          currentName={currentName}
          priorName={priorName ?? "Prior"}
        />
      }
      cursor={{ fill: "rgba(110,15,45,0.04)" }}
    />
  );
  const common = {
    data: points,
    margin: { top: 4, right: 4, left: 0, bottom: 0 },
  };
  const yWidth = unit === "money" ? 58 : 34;

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        {kind === "line" ? (
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              minTickGap={8}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={yWidth}
              tickFormatter={yFormat}
              allowDecimals={unit !== "count"}
            />
            {tooltip}
            <Line
              type="monotone"
              dataKey="current"
              name={currentName}
              stroke={T.royalBurgundy}
              strokeWidth={2.5}
              dot={points.length <= 31 ? { fill: T.royalBurgundy, r: 3 } : false}
            />
            {comparing && (
              <Line
                type="monotone"
                dataKey="prior"
                name={priorName ?? "Prior"}
                stroke={PRIOR_COLOR}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            )}
          </LineChart>
        ) : (
          <BarChart {...common} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              minTickGap={8}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={yWidth}
              tickFormatter={yFormat}
              allowDecimals={unit !== "count"}
            />
            {tooltip}
            {comparing && (
              <Bar
                dataKey="prior"
                name={priorName ?? "Prior"}
                fill={PRIOR_COLOR}
                opacity={0.45}
                radius={[4, 4, 0, 0]}
              />
            )}
            <Bar
              dataKey="current"
              name={currentName}
              fill={T.royalBurgundy}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
      {comparing && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 18,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: T.royalBurgundy, label: currentName, dashed: false },
            { color: PRIOR_COLOR, label: priorName ?? "Prior", dashed: kind === "line" },
          ].map((x) => (
            <span key={x.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 16,
                  height: kind === "line" ? 0 : 10,
                  borderRadius: 2,
                  background: kind === "line" ? "transparent" : x.color,
                  borderTop:
                    kind === "line" ? `2.5px ${x.dashed ? "dashed" : "solid"} ${x.color}` : "none",
                  opacity: kind === "bar" && x.color === PRIOR_COLOR ? 0.6 : 1,
                }}
              />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{x.label}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
