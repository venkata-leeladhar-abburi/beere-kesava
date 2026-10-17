import { useMemo } from "react";
import { OutstandingPage } from "@/features/payments";
import { useSales, isOutstanding, type UnifiedSaree } from "@/features/customers";
import { useDataAccess } from "@/shared/ui/domain";
import { CompareStrip, metric } from "../common/compare";
import { useRegisterExport, usePeriodSplit, useReportPeriod } from "../PeriodContext";

const ORIGIN_LABEL: Record<UnifiedSaree["origin"], string> = {
  weaver: "Weaver",
  factoryLoom: "Factory Loom",
  external: "External Purchase",
};

function sourceOf(s: UnifiedSaree): string {
  if (s.origin === "weaver") return s.weaverName ?? "—";
  if (s.origin === "factoryLoom") return s.factoryLoomNumber ? `Loom ${s.factoryLoomNumber}` : "—";
  return s.supplier ?? "—";
}

function summarise(list: UnifiedSaree[]) {
  const out = list.filter(isOutstanding);
  return {
    count: out.length,
    value: out.reduce((a, s) => a + s.finalAmount, 0),
    aged90: out.filter((s) => s.ageDays > 90).length,
    weaver: out.filter((s) => s.origin === "weaver").length,
    loom: out.filter((s) => s.origin === "factoryLoom").length,
    external: out.filter((s) => s.origin === "external").length,
  };
}

/**
 * The Outstanding Stock tab. The stock screen itself is the Payments
 * feature's OutstandingPage; this wrapper gives it what every other report
 * tab has — the comparison panel and a working "Download Excel" (the toolbar
 * button stayed disabled on this tab because nothing registered its rows).
 */
export function OutstandingStockReport() {
  const { sarees, isLoading } = useSales();
  const { compareActive } = useReportPeriod();
  const canSeeCost = useDataAccess("cost");
  const split = usePeriodSplit(sarees, (s) => s.qcDate);

  const cur = useMemo(() => summarise(split.cur), [split.cur]);
  const pri = useMemo(
    () => (compareActive ? summarise(split.prev) : null),
    [split.prev, compareActive]
  );

  const metrics = useMemo(
    () => [
      metric("count", "Unsold sarees", "count", cur.count, pri?.count, "down"),
      metric("value", "Stock value", "money", cur.value, pri?.value, "down"),
      metric("weaver", "From weavers", "count", cur.weaver, pri?.weaver, "neutral"),
      metric("loom", "From factory looms", "count", cur.loom, pri?.loom, "neutral"),
      metric(
        "external",
        "From external purchases",
        "count",
        cur.external,
        pri?.external,
        "neutral"
      ),
      metric("aged", "Unsold over 90 days", "count", cur.aged90, pri?.aged90, "down"),
    ],
    [cur, pri]
  );

  const rows = useMemo(
    () =>
      split.cur
        .filter(isOutstanding)
        .slice()
        .sort((a, b) => b.ageDays - a.ageDays)
        .map((s) => [
          s.sareeId,
          ORIGIN_LABEL[s.origin],
          sourceOf(s),
          s.designCode || "—",
          s.sareeTypeName || s.sareeTypeCode || "—",
          s.batchId ?? s.invoiceNumber ?? "—",
          s.qcDate || null,
          s.ageDays,
          s.status === "returned" ? "Customer return (restocked)" : "Unsold",
          canSeeCost ? s.costPrice : null,
          s.finalAmount,
        ]),
    [split.cur, canSeeCost]
  );

  useRegisterExport(
    useMemo(
      () => ({
        name: "Outstanding Stock Report",
        sheetName: "Unsold Sarees",
        headers: [
          "Saree ID",
          "Origin",
          "Weaver / Loom / Supplier",
          "Design",
          "Saree Type",
          "Batch / Invoice",
          "Received",
          "Days Unsold",
          "Status",
          "Cost Price",
          "Expected Selling Price",
        ],
        columns: [
          "text",
          "text",
          "text",
          "text",
          "text",
          "text",
          "date",
          "figure",
          "text",
          "money",
          "money",
        ],
        totals: true,
        rows,
        metrics,
        ready: !isLoading,
      }),
      [rows, metrics, isLoading]
    )
  );

  return (
    <>
      {compareActive && (
        <div className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 24 }}>
          <CompareStrip metrics={metrics} />
        </div>
      )}
      <OutstandingPage embedded />
    </>
  );
}
