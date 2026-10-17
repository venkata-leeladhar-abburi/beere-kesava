// What a report section hands the toolbar for "Download Excel", and how that
// becomes a workbook: a Summary sheet (period, comparison, headline figures)
// followed by the section's own table(s). Kept free of React so the workbook
// layout can be tested directly.

import type { CellValue, ColumnKind, SheetSpec } from "./xlsx";

export type MetricUnit = "money" | "count" | "percent" | "kg" | "reels";

/** One headline figure, for the current window and (when comparing) the prior one. */
export interface ReportMetric {
  key: string;
  label: string;
  unit: MetricUnit;
  current: number;
  /** Present only while a comparison is showing. */
  prior?: number | null;
  /** Which way is good news: revenue "up", rejections and dues "down". */
  better?: "up" | "down" | "neutral";
  /** Money metrics hidden from roles that may not see them. */
  gate?: "cost" | "sell" | "margin" | "payroll";
}

export interface ReportSheet {
  name: string;
  headers: string[];
  rows: CellValue[][];
  columns?: ColumnKind[];
  totals?: boolean;
}

/** What a report section offers up for Excel export. */
export interface ReportExport {
  /** Report name — the workbook's title and file name. */
  name: string;
  /** Name of the main data sheet; defaults to the report name. */
  sheetName?: string;
  headers: string[];
  rows: CellValue[][];
  columns?: ColumnKind[];
  /** Appends a SUM row under the main table. */
  totals?: boolean;
  /** Further tables, each on its own sheet after the main one. */
  extraSheets?: ReportSheet[];
  /** Headline figures for the Summary sheet (and the comparison). */
  metrics?: ReportMetric[];
  /** False while the section's data is still loading. */
  ready?: boolean;
  /** A live "right now" report — no period applies. */
  live?: boolean;
}

export interface WorkbookContext {
  periodLabel: string;
  /** Set only when a comparison is active. */
  compareLabel?: string | null;
  priorLabel?: string | null;
  generatedAt: Date;
}

/** Change from `prior` to `current`; null percent when there is no base to divide by. */
export function metricChange(
  current: number,
  prior: number
): { diff: number; pct: number | null; direction: "up" | "down" | "flat" } {
  const diff = round2(current - prior);
  const pct = prior !== 0 ? round1((diff / Math.abs(prior)) * 100) : null;
  return { diff, pct, direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat" };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const UNIT_KIND: Record<MetricUnit, ColumnKind> = {
  money: "money",
  count: "number",
  percent: "percent",
  kg: "number",
  reels: "number",
};

const UNIT_SUFFIX: Partial<Record<MetricUnit, string>> = { kg: " (kg)", reels: " (reels)" };

function summarySheet(exp: ReportExport, ctx: WorkbookContext): SheetSpec {
  const comparing = !exp.live && !!ctx.priorLabel;
  const generated = ctx.generatedAt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preamble: CellValue[][] = [
    [exp.name],
    ["Period", exp.live ? `Live status as of ${generated}` : ctx.periodLabel],
  ];
  if (comparing) {
    if (ctx.compareLabel && ctx.compareLabel !== ctx.periodLabel) {
      preamble.push(["Compared window", ctx.compareLabel]);
    }
    preamble.push(["Compared with", ctx.priorLabel!]);
  }
  preamble.push(["Generated", generated]);
  preamble.push(["Records", exp.rows.length]);

  const metrics = exp.metrics ?? [];
  if (!comparing) {
    return {
      name: "Summary",
      preamble,
      headers: ["Measure", "Value"],
      rows: metrics.map((m) => [
        m.label + (UNIT_SUFFIX[m.unit] ?? ""),
        { value: m.current, kind: UNIT_KIND[m.unit] },
      ]),
    };
  }

  return {
    name: "Summary",
    preamble,
    headers: [
      "Measure",
      ctx.compareLabel ?? ctx.periodLabel,
      ctx.priorLabel!,
      "Change",
      "Change %",
    ],
    rows: metrics.map((m) => {
      const prior = m.prior ?? 0;
      const { diff, pct } = metricChange(m.current, prior);
      const kind = UNIT_KIND[m.unit];
      return [
        m.label + (UNIT_SUFFIX[m.unit] ?? ""),
        { value: m.current, kind },
        { value: prior, kind },
        // A change in a percentage is in percentage points, not a % of a %.
        { value: diff, kind: m.unit === "percent" ? "number" : kind },
        pct === null ? (m.current === 0 ? "" : "new") : { value: pct, kind: "percent" },
      ];
    }),
  };
}

/** The full workbook for an export: Summary first, then the section's tables. */
export function buildReportSheets(exp: ReportExport, ctx: WorkbookContext): SheetSpec[] {
  return [
    summarySheet(exp, ctx),
    {
      name: exp.sheetName ?? exp.name,
      headers: exp.headers,
      rows: exp.rows,
      columns: exp.columns,
      totals: exp.totals,
    },
    ...(exp.extraSheets ?? []).map((s) => ({ ...s })),
  ];
}
