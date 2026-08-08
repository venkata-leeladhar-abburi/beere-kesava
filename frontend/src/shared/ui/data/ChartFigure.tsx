/**
 * ChartFigure — design-system/04-DATA-DISPLAY.md Part K.7.
 * ═══════════════════════════════════════════════════════════════════════════
 * Recharts renders SVG that screen readers cannot interpret. This wraps any
 * chart in a labelled `<figure>` with a prose trend summary and a "View as
 * table" fallback, without dictating the chart's own markup — callers keep
 * their existing card/title styling and just move it inside `title`/`children`.
 */
import { useRef } from "react";
import { cn } from "../utils";

let chartFigureIdSeq = 0;

export interface ChartFigureProps {
  /** Visible chart title — rendered as the <figcaption>. */
  title: React.ReactNode;
  /** Prose summary of the trend (not raw numbers) for aria-describedby. */
  summary?: string;
  /** The chart itself (usually a <ResponsiveContainer>...). */
  children: React.ReactNode;
  /** "View as table" fallback — the same data as a real table. */
  viewAsTable?: React.ReactNode;
  className?: string;
}

export function ChartFigure({ title, summary, children, viewAsTable, className }: ChartFigureProps) {
  const idRef = useRef<string>();
  if (!idRef.current) idRef.current = `chart-figure-${++chartFigureIdSeq}`;
  const summaryId = `${idRef.current}-summary`;

  // aria-label (not aria-labelledby + a hidden duplicate node) — the caller's
  // existing visible title stays exactly as-is inside `children`, so this
  // never double-announces it to screen readers.
  return (
    <figure
      role="group"
      aria-label={typeof title === "string" ? title : undefined}
      aria-describedby={summary ? summaryId : undefined}
      className={cn("m-0", className)}
    >
      {summary && <p id={summaryId} className="sr-only">{summary}</p>}
      {children}
      {viewAsTable && (
        <details style={{ marginTop: 10 }}>
          <summary style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-tertiary)" }}>View as table</summary>
          <div style={{ marginTop: 8 }}>{viewAsTable}</div>
        </details>
      )}
    </figure>
  );
}
