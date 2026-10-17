import { describe, expect, it } from "vitest";
import { latestVerdicts, matchReturnsToSales } from "./reportMath";
import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";
import type { BackendQcRecord } from "../../../shared/api/qc";

const sale = (saleRef: string, sareeId: string, saleDate: string) =>
  ({ saleRef, sareeId, saleDate, channel: "RETAIL", amount: "1000" }) as BackendSaleRecord;
const ret = (returnRef: string, sareeId: string, returnDate: string) =>
  ({ returnRef, sareeId, returnDate, refundAmount: "1000" }) as BackendSaleReturn;

describe("matchReturnsToSales", () => {
  it("pins a return on the sale it undid, not on a later resale of the same saree", () => {
    const sales = [
      sale("S-1", "SAR-9", "2026-09-01T10:00:00Z"),
      sale("S-2", "SAR-9", "2026-10-05T10:00:00Z"), // sold again after restocking
    ];
    const map = matchReturnsToSales(sales, [ret("R-1", "SAR-9", "2026-09-03T09:00:00Z")]);
    expect(map.get("S-1")?.returnRef).toBe("R-1");
    expect(map.has("S-2")).toBe(false);
  });

  it("matches two returns of one saree to its two sales in order", () => {
    const sales = [sale("S-1", "A", "2026-09-01"), sale("S-2", "A", "2026-09-10")];
    const map = matchReturnsToSales(sales, [
      ret("R-2", "A", "2026-09-12"),
      ret("R-1", "A", "2026-09-02"),
    ]);
    expect(map.get("S-1")?.returnRef).toBe("R-1");
    expect(map.get("S-2")?.returnRef).toBe("R-2");
  });

  it("still finds the sale when it was back-dated after the return", () => {
    const map = matchReturnsToSales(
      [sale("S-1", "A", "2026-09-05")],
      [ret("R-1", "A", "2026-09-04")]
    );
    expect(map.get("S-1")?.returnRef).toBe("R-1");
  });
});

describe("latestVerdicts", () => {
  const qc = (id: string, sareeId: string, qcDate: string, result: BackendQcRecord["result"]) =>
    ({ id, sareeId, qcDate, result }) as BackendQcRecord;

  it("keeps only the newest verdict for a reworked saree", () => {
    const verdicts = latestVerdicts([
      qc("q2", "SAR-1", "2026-10-10", "PASSED"),
      qc("q1", "SAR-1", "2026-10-01", "SEMI"),
      qc("q3", "SAR-2", "2026-10-02", "DEFECTIVE"),
    ]);
    expect(verdicts.map((v) => v.id).sort()).toEqual(["q2", "q3"]);
  });
});
