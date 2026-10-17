import { describe, expect, it } from "vitest";
import { buildReportSheets, metricChange, type ReportExport } from "./reportExport";

const exp: ReportExport = {
  name: "Retail Sales Report",
  sheetName: "Retail Sales",
  headers: ["Sale", "Amount"],
  columns: ["text", "money"],
  rows: [["S-1", 100]],
  metrics: [
    { key: "net", label: "Net revenue", unit: "money", current: 1200, prior: 1000 },
    { key: "rate", label: "Pass rate", unit: "percent", current: 92, prior: 95, better: "up" },
    { key: "new", label: "New customers", unit: "count", current: 3, prior: 0 },
  ],
  extraSheets: [{ name: "Returns", headers: ["Ref"], rows: [] }],
};
const at = new Date(2026, 9, 17, 10, 30);

describe("metricChange", () => {
  it("reports the difference and the percentage of the prior value", () => {
    expect(metricChange(1200, 1000)).toEqual({ diff: 200, pct: 20, direction: "up" });
    expect(metricChange(50, 200)).toEqual({ diff: -150, pct: -75, direction: "down" });
    expect(metricChange(7, 7).direction).toBe("flat");
  });

  it("has no percentage when there was nothing before", () => {
    expect(metricChange(3, 0).pct).toBeNull();
  });
});

describe("buildReportSheets", () => {
  it("leads with a Summary, then the data sheet, then any extra sheets", () => {
    const sheets = buildReportSheets(exp, { periodLabel: "October 2026", generatedAt: at });
    expect(sheets.map((s) => s.name)).toEqual(["Summary", "Retail Sales", "Returns"]);
  });

  it("lists each measure with its value when not comparing", () => {
    const [summary] = buildReportSheets(exp, { periodLabel: "October 2026", generatedAt: at });
    expect(summary!.headers).toEqual(["Measure", "Value"]);
    expect(summary!.preamble).toContainEqual(["Period", "October 2026"]);
    expect(summary!.preamble).toContainEqual(["Records", 1]);
    expect(summary!.rows[0]).toEqual(["Net revenue", { value: 1200, kind: "money" }]);
  });

  it("sets both windows side by side with the change when comparing", () => {
    const [summary] = buildReportSheets(exp, {
      periodLabel: "October 2026",
      compareLabel: "1–17 Oct 2026",
      priorLabel: "1–17 Sep 2026",
      generatedAt: at,
    });
    expect(summary!.headers).toEqual([
      "Measure",
      "1–17 Oct 2026",
      "1–17 Sep 2026",
      "Change",
      "Change %",
    ]);
    expect(summary!.preamble).toContainEqual(["Compared window", "1–17 Oct 2026"]);
    expect(summary!.preamble).toContainEqual(["Compared with", "1–17 Sep 2026"]);
    expect(summary!.rows[0]).toEqual([
      "Net revenue",
      { value: 1200, kind: "money" },
      { value: 1000, kind: "money" },
      { value: 200, kind: "money" },
      { value: 20, kind: "percent" },
    ]);
    // A percentage changes by points, written as a plain number.
    expect(summary!.rows[1]![3]).toEqual({ value: -3, kind: "number" });
    // Up from nothing has no percentage to show.
    expect(summary!.rows[2]![4]).toBe("new");
  });

  it("ignores the comparison for a live report", () => {
    const [summary] = buildReportSheets(
      { ...exp, live: true },
      { periodLabel: "Live", priorLabel: "1–17 Sep 2026", generatedAt: at }
    );
    expect(summary!.headers).toEqual(["Measure", "Value"]);
    expect(String(summary!.preamble![1]![1])).toMatch(/^Live status as of /);
  });
});
