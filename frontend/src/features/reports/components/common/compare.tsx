import type { ReactNode } from "react";
import { ArrowLeftRight, Minus, TrendingDown, TrendingUp, Info } from "lucide-react";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useDataAccess } from "@/shared/ui/domain";
import { T, F } from "../theme";
import { useReportPeriod } from "../PeriodContext";
import { metricChange, round1, round2, type MetricUnit, type ReportMetric } from "../reportExport";

/** Builds a metric, attaching the prior value only while a comparison is showing. */
export function metric(
  key: string,
  label: string,
  unit: MetricUnit,
  current: number,
  prior: number | null | undefined,
  better: ReportMetric["better"] = "up",
  gate?: ReportMetric["gate"]
): ReportMetric {
  return {
    key,
    label,
    unit,
    current,
    prior: prior ?? undefined,
    better,
    gate,
  };
}

export function formatMetricValue(value: number, unit: MetricUnit): string {
  switch (unit) {
    case "money":
      return formatMoney(rupees(value));
    case "percent":
      return `${round1(value)}%`;
    case "kg":
      return `${round2(value).toLocaleString("en-IN")} kg`;
    case "reels":
      return `${round2(value).toLocaleString("en-IN")} reels`;
    default:
      return Math.round(value).toLocaleString("en-IN");
  }
}

type Tone = "good" | "bad" | "neutral";

const TONE: Record<Tone, { fg: string; bg: string; border: string }> = {
  good: { fg: T.green, bg: T.greenBg, border: "rgba(30,102,64,0.22)" },
  bad: { fg: T.crimson, bg: T.crimsonBg, border: "rgba(192,57,43,0.22)" },
  neutral: { fg: "#7B5C18", bg: "rgba(200,155,71,0.12)", border: T.borderGold },
};

function describeChange(m: ReportMetric) {
  const prior = m.prior ?? 0;
  const { diff, pct, direction } = metricChange(m.current, prior);
  const tone: Tone =
    direction === "flat" || m.better === "neutral"
      ? "neutral"
      : (direction === "up") === (m.better !== "down")
        ? "good"
        : "bad";
  let text: string;
  if (direction === "flat") text = "No change";
  else if (m.unit === "percent") text = `${diff > 0 ? "+" : ""}${round1(diff)} pts`;
  else if (pct === null) text = "New";
  else text = `${pct > 0 ? "+" : ""}${pct}%`;
  const verb = direction === "up" ? "Up" : direction === "down" ? "Down" : "Unchanged";
  const amount =
    m.unit === "percent"
      ? `${round1(Math.abs(diff))} points`
      : formatMetricValue(Math.abs(diff), m.unit);
  const title =
    direction === "flat"
      ? `Same as before (${formatMetricValue(prior, m.unit)})`
      : `${verb} ${amount} from ${formatMetricValue(prior, m.unit)}`;
  return { tone, text, title, direction };
}

/** "+12.5%" pill, coloured by whether the move is good news for this measure. */
export function DeltaBadge({
  metric: m,
  size = "md",
}: {
  metric: ReportMetric;
  size?: "sm" | "md";
}) {
  const visible = useDataAccess(m.gate ?? "sell");
  if (m.prior === undefined || m.prior === null) return null;
  const hidden = m.unit === "money" && !visible;
  const { tone, text, title, direction } = describeChange(m);
  const c = TONE[tone];
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  return (
    <span
      title={hidden ? undefined : title}
      aria-label={hidden ? "Change hidden" : title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "2px 7px" : "3px 9px",
        borderRadius: 99,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.fg,
        fontFamily: "var(--font-mono)",
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={size === "sm" ? 11 : 13} aria-hidden />
      {hidden ? "••••" : text}
    </span>
  );
}

/** "was ₹96,000" — the prior value in words, masked like the money it shows. */
export function PriorValue({ metric: m }: { metric: ReportMetric }) {
  const visible = useDataAccess(m.gate ?? "sell");
  if (m.prior === undefined || m.prior === null) return null;
  const hidden = m.unit === "money" && !visible;
  return (
    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
      was {hidden ? "••••" : formatMetricValue(m.prior, m.unit)}
    </span>
  );
}

function MetricTile({ metric: m }: { metric: ReportMetric }) {
  const visible = useDataAccess(m.gate ?? "sell");
  const hidden = m.unit === "money" && !visible;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.borderDef}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: F.ui,
          fontSize: 11,
          fontWeight: 700,
          color: T.taupe,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          lineHeight: 1.35,
        }}
      >
        {m.label}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 21,
          fontWeight: 700,
          color: T.luxuryBrown,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
        }}
      >
        {hidden ? "••••" : formatMetricValue(m.current, m.unit)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <DeltaBadge metric={m} size="sm" />
        <PriorValue metric={m} />
      </div>
    </div>
  );
}

// Literal class names so Tailwind keeps them. Eight tiles sit as 4 + 4, not 7 + 1.
const WIDE_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-3 xl:grid-cols-5",
  6: "md:grid-cols-3 xl:grid-cols-6",
};
const wideCols = (n: number) => (n <= 6 ? Math.max(1, n) : Math.ceil(n / 2));

/**
 * The comparison panel each dated report shows under its period bar while
 * "Compare period" is on: every headline figure for both windows, with the
 * change between them.
 */
export function CompareStrip({ metrics }: { metrics: ReportMetric[] }) {
  const { compareActive, compareLabel, priorLabel, partial, label } = useReportPeriod();
  if (!compareActive || metrics.length === 0) return null;
  return (
    <section
      aria-label="Period comparison"
      style={{
        background: "linear-gradient(145deg, #FDF8EE 0%, #FFFDF9 100%)",
        border: `1px solid ${T.borderGold}`,
        borderRadius: 16,
        padding: "16px 18px 18px",
        marginBottom: 24,
        boxShadow: "0 2px 12px rgba(200,155,71,0.10)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "rgba(200,155,71,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ArrowLeftRight size={16} color={T.antiqueGold} aria-hidden />
        </div>
        <span
          style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}
        >
          Period comparison
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Chip tone="current">{compareLabel ?? label}</Chip>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>vs</span>
          <Chip tone="prior">{priorLabel}</Chip>
        </span>
      </div>
      {partial && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            fontFamily: F.ui,
            fontSize: 12,
            color: T.taupe,
            marginBottom: 12,
          }}
        >
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
          <span>
            {label} isn&apos;t over yet, so both sides cover the same number of days — a fair,
            like-for-like comparison.
          </span>
        </div>
      )}
      <div className={`grid grid-cols-2 gap-2.5 ${WIDE_COLS[wideCols(metrics.length)]}`}>
        {metrics.map((m) => (
          <MetricTile key={m.key} metric={m} />
        ))}
      </div>
    </section>
  );
}

export function Chip({ tone, children }: { tone: "current" | "prior"; children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 11px",
        borderRadius: 99,
        background: tone === "current" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)",
        color: tone === "current" ? T.royalBurgundy : "#8B6018",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Finds a metric by key — for passing one to a KPI card's `delta`. */
export function pick(metrics: ReportMetric[], key: string): ReportMetric | undefined {
  return metrics.find((m) => m.key === key);
}
