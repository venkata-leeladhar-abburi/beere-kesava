import { describe, expect, test } from "vitest";
import type { StaffLedgerRow } from "@/shared/api/staff-finance";
import { DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { dailySeries, dateFilterToRange, groupByRecorder, matchesLedgerSearch, summarise } from "./ledger";

function row(over: Partial<StaffLedgerRow>): StaffLedgerRow {
  return {
    id: "weaver:1",
    kind: "WEAVER",
    direction: "OUT",
    date: "2026-08-20T10:00:00.000Z",
    amount: 1000,
    partyName: "Ravi",
    partyCode: "Wea-001",
    reference: "UTR123",
    method: "Bank transfer",
    firmName: "Firm A",
    recordedById: "u1",
    recordedBy: { id: "u1", firstName: "Asha", lastName: "N", role: "ACCOUNTANT" },
    ...over,
  };
}

describe("summarise", () => {
  test("splits by direction rather than lumping every movement together", () => {
    const t = summarise([
      row({ id: "a", direction: "OUT", amount: 1000 }),
      row({ id: "b", kind: "VENDOR", direction: "OUT", amount: 500 }),
      row({ id: "c", kind: "RETAIL_SALE", direction: "IN", amount: 300 }),
    ]);
    expect(t.paidOut).toBe(1500);
    expect(t.collectedIn).toBe(300);
    expect(t.txns).toBe(3);
    // The average spans both directions — 1800/3, not (1500-300)/3.
    expect(t.avgTxn).toBe(600);
  });

  test("lastActivity is the newest date, not the last row in the array", () => {
    const t = summarise([
      row({ id: "a", date: "2026-08-20T10:00:00.000Z" }),
      row({ id: "b", date: "2026-08-28T10:00:00.000Z" }),
      row({ id: "c", date: "2026-08-01T10:00:00.000Z" }),
    ]);
    expect(t.lastActivity).toBe("2026-08-28T10:00:00.000Z");
  });

  test("counts and amounts are tracked per kind", () => {
    const t = summarise([
      row({ id: "a", kind: "WEAVER", amount: 100 }),
      row({ id: "b", kind: "WEAVER", amount: 200 }),
      row({ id: "c", kind: "SUPPLIER", amount: 50 }),
    ]);
    expect(t.byKind.WEAVER).toEqual({ amount: 300, count: 2 });
    expect(t.byKind.SUPPLIER).toEqual({ amount: 50, count: 1 });
    expect(t.byKind.RETAIL_SALE).toEqual({ amount: 0, count: 0 });
  });

  test("an empty ledger reports zeros, not NaN", () => {
    const t = summarise([]);
    expect(t.avgTxn).toBe(0);
    expect(t.lastActivity).toBeNull();
  });
});

describe("groupByRecorder", () => {
  test("rows with no recorded actor share the unattributed bucket", () => {
    const grouped = groupByRecorder([
      row({ id: "a", recordedById: "u1" }),
      row({ id: "b", recordedById: null, recordedBy: null }),
      row({ id: "c", recordedById: null, recordedBy: null }),
    ]);
    expect(grouped.get("u1")).toHaveLength(1);
    expect(grouped.get("unattributed")).toHaveLength(2);
  });
});

describe("dailySeries", () => {
  test("ends at the supplied date, so an older filtered period still charts", () => {
    const series = dailySeries(
      [row({ id: "a", date: "2024-03-15T10:00:00.000Z", amount: 700 })],
      30,
      "2024-03-20T10:00:00.000Z",
    );
    expect(series).toHaveLength(30);
    expect(series[series.length - 1].date).toBe("2024-03-20");
    expect(series.reduce((sum, d) => sum + d.out, 0)).toBe(700);
  });

  test("rows outside the window are excluded rather than folded into an edge day", () => {
    const series = dailySeries(
      [
        row({ id: "a", date: "2024-03-19T10:00:00.000Z", amount: 100 }),
        row({ id: "b", date: "2023-01-01T10:00:00.000Z", amount: 999 }),
      ],
      14,
      "2024-03-20T10:00:00.000Z",
    );
    expect(series.reduce((sum, d) => sum + d.out + d.in, 0)).toBe(100);
  });

  test("quiet days stay in the series as real zeroes", () => {
    const series = dailySeries([], 7, "2024-03-20T10:00:00.000Z");
    expect(series).toHaveLength(7);
    expect(series.every(d => d.out === 0 && d.in === 0)).toBe(true);
  });
});

describe("matchesLedgerSearch", () => {
  test("matches party, code, reference and firm case-insensitively", () => {
    const r = row({});
    expect(matchesLedgerSearch(r, "ravi")).toBe(true);
    expect(matchesLedgerSearch(r, "WEA-001")).toBe(true);
    expect(matchesLedgerSearch(r, "utr123")).toBe(true);
    expect(matchesLedgerSearch(r, "firm a")).toBe(true);
    expect(matchesLedgerSearch(r, "nonsense")).toBe(false);
  });

  test("an empty query matches everything", () => {
    expect(matchesLedgerSearch(row({}), "   ")).toBe(true);
  });
});

describe("dateFilterToRange", () => {
  const filter = (over: Partial<DateFilterState>): DateFilterState => ({ ...DEFAULT_DATE_FILTER, ...over });
  /** Local-calendar fields, since the bounds are built in the reader's zone. */
  const local = (iso: string) => {
    const d = new Date(iso);
    return [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()] as const;
  };

  test("all-time sends no bounds at all", () => {
    expect(dateFilterToRange(filter({ mode: "all" }))).toEqual({});
  });

  test("a single day spans that whole local day", () => {
    const r = dateFilterToRange(filter({ mode: "day", day: "2026-03-15" }));
    expect(local(r.from!)).toEqual([2026, 2, 15, 0, 0]);
    expect(local(r.to!)).toEqual([2026, 2, 15, 23, 59]);
  });

  test("a range ends at end-of-day, so the last day is included", () => {
    const r = dateFilterToRange(filter({ mode: "range", from: "2026-03-01", to: "2026-03-31" }));
    expect(local(r.from!)).toEqual([2026, 2, 1, 0, 0]);
    expect(local(r.to!)).toEqual([2026, 2, 31, 23, 59]);
  });

  test("a half-open range sends only the bound it has", () => {
    const r = dateFilterToRange(filter({ mode: "range", from: "2026-03-01", to: "" }));
    expect(r.from).toBeDefined();
    expect(r.to).toBeUndefined();
  });

  test("a month ends on its real last day, leap years included", () => {
    const feb = dateFilterToRange(filter({ mode: "month", month: "2024-02" }));
    expect(local(feb.to!)).toEqual([2024, 1, 29, 23, 59]);
    const apr = dateFilterToRange(filter({ mode: "month", month: "2026-04" }));
    expect(local(apr.to!)).toEqual([2026, 3, 30, 23, 59]);
  });

  test("a year spans 1 Jan to 31 Dec", () => {
    const r = dateFilterToRange(filter({ mode: "year", year: "2025" }));
    expect(local(r.from!)).toEqual([2025, 0, 1, 0, 0]);
    expect(local(r.to!)).toEqual([2025, 11, 31, 23, 59]);
  });

  test("the picked day survives a timezone west of UTC", () => {
    // DateFilterBar stores local calendar dates, but `new Date("2026-03-15")`
    // is UTC midnight — which reads back as the 14th anywhere behind UTC.
    // This is the assertion that fails if that parsing ever creeps back in.
    // Asserted through the local getters, which is how the bounds are built.
    const r = dateFilterToRange(filter({ mode: "day", day: "2026-03-15" }));
    expect(local(r.from!)[2]).toBe(15);
    expect(local(r.to!)[2]).toBe(15);
    expect(new Date(r.from!).getTime()).toBeLessThan(new Date(r.to!).getTime());
  });

  test("a malformed date is ignored rather than sent as an invalid bound", () => {
    expect(dateFilterToRange(filter({ mode: "day", day: "15/03/2026" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "day", day: "2026-13-01" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "month", month: "2026-99" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "month", month: "2026-00" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "year", year: "20xx" }))).toEqual({});
  });

  test("a mode with nothing picked yet sends no bounds rather than an invalid date", () => {
    expect(dateFilterToRange(filter({ mode: "day", day: "" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "month", month: "" }))).toEqual({});
    expect(dateFilterToRange(filter({ mode: "year", year: "" }))).toEqual({});
  });
});
