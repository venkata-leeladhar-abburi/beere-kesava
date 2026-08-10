import { describe, it, expect } from "vitest";
import {
  isOutstanding,
  isSold,
  ageBucket,
  rankSellers,
  purchaseOutstanding,
  SEED_PURCHASE_SUMMARIES,
} from "./sales-seed";
import type { UnifiedSaree } from "./sales-types";
import { SALE_STATUS } from "./sales-types";

function makeSaree(overrides: Partial<UnifiedSaree>): UnifiedSaree {
  return {
    sareeId: "TEST-001",
    origin: "weaver",
    batchId: null,
    designCode: "BKB-045",
    sareeTypeCode: "SB-001",
    sareeTypeName: "Self Brocade",
    weight: "800g",
    qcDate: "01 Jun 2026",
    costPrice: 3500,
    sellPercent: 25,
    finalAmount: 4375,
    status: SALE_STATUS.Unsold,
    sale: null,
    ret: null,
    ageDays: 10,
    ...overrides,
  };
}

describe("isOutstanding", () => {
  it("counts unsold sarees as outstanding", () => {
    expect(isOutstanding(makeSaree({ status: SALE_STATUS.Unsold }))).toBe(true);
  });

  it("counts a returned-and-restocked saree as outstanding", () => {
    expect(
      isOutstanding(
        makeSaree({ status: SALE_STATUS.Returned, ret: { returnRef: "RET-1", date: "x", reason: "x", refundAmount: 100, restocked: true } }),
      ),
    ).toBe(true);
  });

  it("does not count a returned-but-not-restocked saree as outstanding", () => {
    expect(
      isOutstanding(
        makeSaree({ status: SALE_STATUS.Returned, ret: { returnRef: "RET-1", date: "x", reason: "x", refundAmount: 100, restocked: false } }),
      ),
    ).toBe(false);
  });

  it("does not count sold sarees as outstanding", () => {
    expect(isOutstanding(makeSaree({ status: SALE_STATUS.Retail }))).toBe(false);
    expect(isOutstanding(makeSaree({ status: SALE_STATUS.Wholesale }))).toBe(false);
  });
});

describe("isSold", () => {
  it("is true for retail and wholesale, false otherwise", () => {
    expect(isSold(makeSaree({ status: SALE_STATUS.Retail }))).toBe(true);
    expect(isSold(makeSaree({ status: SALE_STATUS.Wholesale }))).toBe(true);
    expect(isSold(makeSaree({ status: SALE_STATUS.Unsold }))).toBe(false);
    expect(isSold(makeSaree({ status: SALE_STATUS.Returned }))).toBe(false);
  });
});

// This is the exact bucket scheme the Outstanding-payments UI (AGE_BUCKETS in
// shared/ui payments primitives) filters against — regression-guards the fix
// where a duplicate "fresh/aging/old/stale" definition briefly broke the build.
describe("ageBucket", () => {
  it("buckets into the 0-30/31-60/61-90/90+ scheme the UI filters expect", () => {
    expect(ageBucket(0)).toBe("0-30");
    expect(ageBucket(30)).toBe("0-30");
    expect(ageBucket(31)).toBe("31-60");
    expect(ageBucket(60)).toBe("31-60");
    expect(ageBucket(61)).toBe("61-90");
    expect(ageBucket(90)).toBe("61-90");
    expect(ageBucket(91)).toBe("90+");
    expect(ageBucket(500)).toBe("90+");
  });
});

describe("rankSellers", () => {
  it("aggregates produced/sold/revenue per weaver and computes sell-through", () => {
    const sarees: UnifiedSaree[] = [
      makeSaree({ sareeId: "A", origin: "weaver", weaverId: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", weaverName: "Ravi Kumar", weaverLoom: 2, status: SALE_STATUS.Retail, sale: { saleRef: "S1", channel: "retail", date: "x", customer: "c", amount: 1000 } }),
      makeSaree({ sareeId: "B", origin: "weaver", weaverId: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", weaverName: "Ravi Kumar", weaverLoom: 2, status: SALE_STATUS.Unsold }),
      makeSaree({ sareeId: "C", origin: "weaver", weaverId: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", weaverName: "Padma Veni", weaverLoom: 1, status: SALE_STATUS.Wholesale, sale: { saleRef: "S2", channel: "wholesale", date: "x", customer: "c", amount: 2000 } }),
      // Different origin — must not be counted for the "weaver" ranking.
      makeSaree({ sareeId: "D", origin: "factoryLoom", factoryLoomId: "FL-001", factoryLoomNumber: "Loom F-01", status: SALE_STATUS.Retail }),
    ];

    const ranked = rankSellers(sarees, "weaver");
    expect(ranked).toHaveLength(2);

    const ravi = ranked.find(r => r.key === "b5f9178c-b1b9-4871-a7c3-0d68a462d57a")!;
    expect(ravi.produced).toBe(2);
    expect(ravi.sold).toBe(1);
    expect(ravi.retail).toBe(1);
    expect(ravi.outstanding).toBe(1);
    expect(ravi.revenue).toBe(1000);
    expect(ravi.sellThroughPct).toBe(50);

    const padma = ranked.find(r => r.key === "8937070a-ea63-43f3-9cb4-dcbcfd362ff7")!;
    expect(padma.wholesale).toBe(1);
    expect(padma.revenue).toBe(2000);
  });

  it("sorts descending by sold count, then by revenue", () => {
    const sarees: UnifiedSaree[] = [
      makeSaree({ sareeId: "A", weaverId: "WV-LOW", weaverName: "Low seller", status: SALE_STATUS.Retail, sale: { saleRef: "S1", channel: "retail", date: "x", customer: "c", amount: 500 } }),
      makeSaree({ sareeId: "B", weaverId: "WV-HIGH", weaverName: "High seller", status: SALE_STATUS.Retail, sale: { saleRef: "S2", channel: "retail", date: "x", customer: "c", amount: 100 } }),
      makeSaree({ sareeId: "C", weaverId: "WV-HIGH", weaverName: "High seller", status: SALE_STATUS.Retail, sale: { saleRef: "S3", channel: "retail", date: "x", customer: "c", amount: 100 } }),
    ];
    const ranked = rankSellers(sarees, "weaver");
    expect(ranked[0].key).toBe("WV-HIGH");
    expect(ranked[1].key).toBe("WV-LOW");
  });
});

describe("purchaseOutstanding", () => {
  it("rolls up unsold/returned/dueAmount per seeded external purchase", () => {
    const purchaseId = SEED_PURCHASE_SUMMARIES[0].id;
    const sarees: UnifiedSaree[] = [
      makeSaree({ sareeId: "P1", origin: "external", purchaseId, status: SALE_STATUS.Unsold, costPrice: 400, finalAmount: 500 }),
      makeSaree({ sareeId: "P2", origin: "external", purchaseId, status: SALE_STATUS.Retail }),
      makeSaree({ sareeId: "P3", origin: "external", purchaseId, status: SALE_STATUS.Returned, ret: { returnRef: "R1", date: "x", reason: "x", refundAmount: 300, restocked: false } }),
    ];
    const result = purchaseOutstanding(sarees);
    const row = result.find(r => r.id === purchaseId)!;

    expect(row.unsoldCount).toBe(1);
    expect(row.unsoldValue).toBe(500);
    expect(row.unsoldCost).toBe(400);
    expect(row.returnedCount).toBe(1);
    expect(row.refundValue).toBe(300);
    expect(row.soldCount).toBe(1);
    expect(row.dueAmount).toBe(row.billAmount - row.paidAmount);
  });

  it("returns one row per seeded purchase even with no matching sarees", () => {
    const result = purchaseOutstanding([]);
    expect(result).toHaveLength(SEED_PURCHASE_SUMMARIES.length);
    result.forEach(r => {
      expect(r.unsoldCount).toBe(0);
      expect(r.sarees).toEqual([]);
    });
  });
});
