/**
 * Small presentation pieces shared by the two Accountant Staff screens.
 *
 * The badge palette is deliberately the same one Payment History already
 * uses (features/payments/.../HistoryCard.tsx `HIST_TYPE_CFG`) — a weaver
 * payment must not be gold here and burgundy two screens away.
 */
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MoneyValue, useMoneyVisible } from "@/shared/ui/MoneyValue";
import { formatMoney, rupees, type MoneyOpts } from "@/lib/domain/money";
import type { StaffLedgerKind } from "@/shared/api/staff-finance";
import { KIND_CONFIG, type DayPoint } from "./ledger";

const KIND_COLORS: Record<StaffLedgerKind, { bg: string; color: string; border: string }> = {
  WEAVER: { bg: "rgba(110,15,45,0.10)", color: "#6E0F2D", border: "rgba(110,15,45,0.30)" },
  VENDOR: { bg: "rgba(200,155,71,0.12)", color: "#8B6018", border: "rgba(200,155,71,0.34)" },
  SUPPLIER: { bg: "rgba(74,107,138,0.12)", color: "#2E5A8A", border: "rgba(74,107,138,0.30)" },
  RETAIL_SALE: { bg: "rgba(30,102,64,0.10)", color: "#1E6640", border: "rgba(30,102,64,0.28)" },
};

/** Direction colours, used by both the amount cell and the sparkline. */
export const OUT_COLOR = "#6E0F2D";
export const IN_COLOR = "#1E6640";

/**
 * A rupee figure that inherits its colour from whatever it sits in.
 *
 * `<Money>` is the app's default, but it hard-codes `--text-primary`, which
 * is invisible on the dark stats strip and silently overrides the accent
 * colour on a tile. This keeps the same tabular figures and the same
 * MONEY_HIDDEN masking, and leaves colour to the caller.
 */
export function MoneyText({
  amount,
  compact,
  className = "",
}: {
  amount: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <MoneyValue
      className={className}
      value={
        <span
          style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
          title={compact ? formatMoney(rupees(amount), { decimals: 2 }) : undefined}
        >
          {formatMoney(rupees(amount), { compact })}
        </span>
      }
    />
  );
}

/**
 * Money as a plain string, masked for MONEY_HIDDEN accounts.
 *
 * `<MoneyText>` covers rendered figures, but these screens also put money
 * inside strings — a panel subtitle, a chart axis, a tooltip, a
 * screen-reader summary. Those bypass every component-level gate, so an
 * account that sees `••••` in the tiles would read the exact totals in the
 * sentence underneath. This is the gate for that text.
 */
export function useMoneyFormatter() {
  const visible = useMoneyVisible();
  return {
    visible,
    money: (amount: number, opts?: MoneyOpts) => (visible ? formatMoney(rupees(amount), opts) : "\u2022\u2022\u2022\u2022"),
  };
}

export function KindBadge({ kind, short = false }: { kind: StaffLedgerKind; short?: boolean }) {
  const cfg = KIND_COLORS[kind];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {short ? KIND_CONFIG[kind].short : KIND_CONFIG[kind].label}
    </span>
  );
}

/**
 * One amount with its direction made explicit. The arrow carries the meaning
 * for anyone who cannot separate the two colours, so direction is never
 * encoded in colour alone.
 */
export function DirectionAmount({
  amount,
  direction,
  compact,
}: {
  amount: number;
  direction: "OUT" | "IN";
  compact?: boolean;
}) {
  const isOut = direction === "OUT";
  const Arrow = isOut ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Arrow size={13} color={isOut ? OUT_COLOR : IN_COLOR} aria-hidden />
      <MoneyText amount={amount} compact={compact} className="text-[13px] font-semibold" />
      <span className="sr-only">{isOut ? "paid out" : "collected in"}</span>
    </span>
  );
}

/**
 * A 14-day stacked volume sparkline. Purely decorative — every figure it
 * hints at is also printed as a real number in the same row — so it is
 * hidden from assistive tech rather than described twice.
 */
export function VolumeSparkline({
  series,
  width = 96,
  height = 30,
}: {
  series: DayPoint[];
  width?: number;
  height?: number;
}) {
  // Bar heights are relative amounts. Drawing them for an account whose
  // figures are masked would leak the shape of exactly what the flag hides.
  const moneyVisible = useMoneyVisible();
  const peak = Math.max(...series.map(d => d.out + d.in), 0);

  if (!moneyVisible) {
    return (
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }} aria-label="Hidden">
        &bull;&bull;&bull;&bull;
      </span>
    );
  }

  if (peak === 0) {
    return (
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        No movement
      </span>
    );
  }

  const gap = 2;
  const barWidth = Math.max(1, (width - gap * (series.length - 1)) / series.length);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden focusable="false">
      {series.map((d, i) => {
        const total = d.out + d.in;
        const x = i * (barWidth + gap);
        if (total === 0) {
          return (
            <rect
              key={d.date}
              x={x}
              y={height - 1}
              width={barWidth}
              height={1}
              rx={0.5}
              fill="var(--border-default)"
            />
          );
        }
        const barHeight = Math.max(2, (total / peak) * height);
        const outHeight = (d.out / total) * barHeight;
        const inHeight = barHeight - outHeight;
        return (
          <g key={d.date}>
            {inHeight > 0 && (
              <rect x={x} y={height - barHeight} width={barWidth} height={inHeight} rx={1} fill={IN_COLOR} opacity={0.85} />
            )}
            {outHeight > 0 && (
              <rect x={x} y={height - outHeight} width={barWidth} height={outHeight} rx={1} fill={OUT_COLOR} opacity={0.85} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** The card every table and chart on these two screens sits inside. */
export function PanelCard({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`overflow-hidden rounded-2xl border ${className}`}
      style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  sub,
  actions,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5 md:px-5"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="min-w-0">
        <div className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </div>
        {sub && (
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {sub}
          </div>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
