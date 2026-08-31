/**
 * Shared chart bits for the Shop Staff report (mobile + desktop).
 *
 * Recharts' own <Legend> lays its items out in one non-wrapping row, which
 * clips past the card edge at 320px once there are four payment methods — so
 * the donut renders with `legendType="none"` and this wrapping legend instead.
 */
import { C, F } from "./theme";

export const CHART_COLORS = [C.burg, C.gold, "#1E6640", "#8E5A2B", "#C0392B", "#5B4B8A"];

export function ChartLegend({ items }: { items: { label: string; value?: string }[] }) {
  return (
    <ul style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", listStyle: "none", margin: "10px 0 0", padding: 0 }}>
      {items.map((item, i) => (
        <li key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{item.label}</span>
          {item.value && <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
