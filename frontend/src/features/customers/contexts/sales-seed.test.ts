import { describe, it, expect } from "vitest";
import {
  isOutstanding,
  isSold,
  ageBucket,
  rankSellers,
  purchaseOutstanding,
  supplierRollup,
  currentReturn,
  SEED_PURCHASE_SUMMARIES,
} from "./sales-seed";
import type { UnifiedSaree } from "./sales-types";

// Weaver ids as the backend mints them (UUIDs), shared by the fixtures and the
// assertions that look the same weaver up again.
const RAVI_ID = "b5f9178c-b1b9-4871-a7c3-0d68a462d57a";
const PADMA_ID = "8937070a-ea63-43f3-9cb4-dcbcfd362ff7";

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
    status: "unsold",
    sale: null,
    ret: null,
    ageDays: 10,
    ...overrides,
  };
}

describe("isOutstanding", () => {
  it("counts unsold sarees as outstanding", () => {
    expect(isOutstanding(makeSaree({ status: "unsold" }))).toBe(true);
  });

  it("counts a returned-and-restocked saree as outstanding", () => {
    expect(
      isOutstanding(
        makeSaree({
          status: "returned",
          ret: { returnRef: "RET-1", date: "x", reason: "x", refundAmount: 100, restocked: true },
        })
      )
    ).toBe(true);
  });

  it("does not count a returned-but-not-restocked saree as outstanding", () => {
    expect(
      isOutstanding(
        makeSaree({
          status: "returned",
          ret: { returnRef: "RET-1", date: "x", reason: "x", refundAmount: 100, restocked: false },
        })
      )
    ).toBe(false);
  });

  it("does not count sold sarees as outstanding", () => {
    expect(isOutstanding(makeSaree({ status: "retail" }))).toBe(false);
    expect(isOutstanding(makeSaree({ status: "wholesale" }))).toBe(false);
  });
});

describe("isSold", () => {
  it("is true for retail and wholesale, false otherwise", () => {
    expect(isSold(makeSaree({ status: "retail" }))).toBe(true);
    expect(isSold(makeSaree({ status: "wholesale" }))).toBe(true);
    expect(isSold(makeSaree({ status: "unsold" }))).toBe(false);
    expect(isSold(makeSaree({ status: "returned" }))).toBe(false);
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
      makeSaree({
        sareeId: "A",
        origin: "weaver",
        weaverId: RAVI_ID,
        weaverName: "Ravi Kumar",
        weaverLoom: 2,
        status: "retail",
        sale: { saleRef: "S1", channel: "retail", date: "x", customer: "c", amount: 1000 },
      }),
      makeSaree({
        sareeId: "B",
        origin: "weaver",
        weaverId: RAVI_ID,
        weaverName: "Ravi Kumar",
        weaverLoom: 2,
        status: "unsold",
      }),
      makeSaree({
        sareeId: "C",
        origin: "weaver",
        weaverId: PADMA_ID,
        weaverName: "Padma Veni",
        weaverLoom: 1,
        status: "wholesale",
        sale: { saleRef: "S2", channel: "wholesale", date: "x", customer: "c", amount: 2000 },
      }),
      // Different origin — must not be counted for the "weaver" ranking.
      makeSaree({
        sareeId: "D",
        origin: "factoryLoom",
        factoryLoomId: "FL-001",
        factoryLoomNumber: "Loom F-01",
        status: "retail",
      }),
    ];

    const ranked = rankSellers(sarees, "weaver");
    expect(ranked).toHaveLength(2);

    const ravi = ranked.find((r) => r.key === RAVI_ID)!;
    expect(ravi.produced).toBe(2);
    expect(ravi.sold).toBe(1);
    expect(ravi.retail).toBe(1);
    expect(ravi.outstanding).toBe(1);
    expect(ravi.revenue).toBe(1000);
    expect(ravi.sellThroughPct).toBe(50);

    const padma = ranked.find((r) => r.key === PADMA_ID)!;
    expect(padma.wholesale).toBe(1);
    expect(padma.revenue).toBe(2000);
  });

  it("sorts descending by sold count, then by revenue", () => {
    const sarees: UnifiedSaree[] = [
      makeSaree({
        sareeId: "A",
        weaverId: "WV-LOW",
        weaverName: "Low seller",
        status: "retail",
        sale: { saleRef: "S1", channel: "retail", date: "x", customer: "c", amount: 500 },
      }),
      makeSaree({
        sareeId: "B",
        weaverId: "WV-HIGH",
        weaverName: "High seller",
        status: "retail",
        sale: { saleRef: "S2", channel: "retail", date: "x", customer: "c", amount: 100 },
      }),
      makeSaree({
        sareeId: "C",
        weaverId: "WV-HIGH",
        weaverName: "High seller",
        status: "retail",
        sale: { saleRef: "S3", channel: "retail", date: "x", customer: "c", amount: 100 },
      }),
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
      makeSaree({
        sareeId: "P1",
        origin: "external",
        purchaseId,
        status: "unsold",
        costPrice: 400,
        finalAmount: 500,
      }),
      makeSaree({ sareeId: "P2", origin: "external", purchaseId, status: "retail" }),
      makeSaree({
        sareeId: "P3",
        origin: "external",
        purchaseId,
        status: "returned",
        ret: { returnRef: "R1", date: "x", reason: "x", refundAmount: 300, restocked: false },
      }),
    ];
    const result = purchaseOutstanding(sarees);
    const row = result.find((r) => r.id === purchaseId)!;

    expect(row.unsoldCount).toBe(1);
    expect(row.unsoldValue).toBe(500);
    expect(row.unsoldCost).toBe(400);
    expect(row.returnedCount).toBe(1);
    expect(row.refundValue).toBe(300);
    expect(row.soldCount).toBe(1);
    expect(row.dueAmount).toBe(row.billAmount - row.paidAmount);
  });

  it("counts pieces sent back to the supplier apart from customer returns", () => {
    const purchaseId = SEED_PURCHASE_SUMMARIES[0].id;
    const sarees: UnifiedSaree[] = [
      makeSaree({ sareeId: "S1", origin: "external", purchaseId, status: "unsold" }),
      makeSaree({
        sareeId: "S2",
        origin: "external",
        purchaseId,
        status: "returned",
        returnedToSupplier: true,
      }),
      makeSaree({
        sareeId: "S3",
        origin: "external",
        purchaseId,
        status: "returned",
        ret: { returnRef: "R1", date: "x", reason: "x", refundAmount: 0, restocked: true },
      }),
      makeSaree({
        sareeId: "S4",
        origin: "external",
        purchaseId,
        status: "returned",
        ret: { returnRef: "R2", date: "x", reason: "x", refundAmount: 0, restocked: false },
      }),
    ];
    const row = purchaseOutstanding(sarees).find((r) => r.id === purchaseId)!;

    expect(row.supplierReturnedCount).toBe(1);
    expect(row.returnedCount).toBe(2);
    // Unsold, plus the customer return put back on sale; the held return and
    // the piece back with the supplier are not stock.
    expect(row.unsoldSarees.map((s) => s.sareeId)).toEqual(["S1", "S3"]);
  });

  it("takes sarees sent back on an approved debit note off the bill due", () => {
    const base = SEED_PURCHASE_SUMMARIES[0];
    const purchases = [
      { ...base, id: "EXT-A", billAmount: 10_000, creditedAmount: 3_000, paidAmount: 5_000 },
      // Everything sent back: nothing left to pay, never a negative due.
      { ...base, id: "EXT-B", billAmount: 9_000, creditedAmount: 9_000, paidAmount: 0 },
    ];
    const [a, b] = purchaseOutstanding([], purchases);

    expect(a.dueAmount).toBe(2_000);
    expect(b.dueAmount).toBe(0);
  });

  it("returns one row per seeded purchase even with no matching sarees", () => {
    const result = purchaseOutstanding([]);
    expect(result).toHaveLength(SEED_PURCHASE_SUMMARIES.length);
    result.forEach((r) => {
      expect(r.unsoldCount).toBe(0);
      expect(r.sarees).toEqual([]);
    });
  });
});

describe("currentReturn", () => {
  const ret = { returnRef: "R1", returnDate: "2026-09-10T10:00:00.000Z" };

  it("keeps a return with no sale on record", () => {
    expect(currentReturn(ret, undefined)).toBe(ret);
  });

  it("keeps a return made after the latest sale", () => {
    expect(currentReturn(ret, { saleDate: "2026-09-01T10:00:00.000Z" })).toBe(ret);
  });

  it("drops a return the saree has since been sold again after", () => {
    expect(currentReturn(ret, { saleDate: "2026-09-20T10:00:00.000Z" })).toBeUndefined();
  });

  it("is undefined when there is no return", () => {
    expect(currentReturn(undefined, { saleDate: "2026-09-01T10:00:00.000Z" })).toBeUndefined();
  });
});

describe("supplierRollup", () => {
  const base = SEED_PURCHASE_SUMMARIES[0];
  const purchases = [
    { ...base, id: "EXT-A", supplier: "Alpha Silks", billAmount: 10_000, paidAmount: 4_000 },
    { ...base, id: "EXT-B", supplier: "Alpha Silks", billAmount: 5_000, paidAmount: 5_000 },
    { ...base, id: "EXT-C", supplier: "Beta Weaves", billAmount: 2_000, paidAmount: 0 },
  ].map((p) => ({ ...p, creditedAmount: 0 }));
  const ext = (sareeId: string, purchaseId: string, o: Partial<UnifiedSaree> = {}) =>
    makeSaree({ sareeId, origin: "external", purchaseId, ...o });
  const restockedReturn = {
    returnRef: "R1",
    date: "x",
    reason: "x",
    refundAmount: 0,
    restocked: true,
  };
  const heldReturn = { ...restockedReturn, returnRef: "R2", restocked: false };
  const sarees: UnifiedSaree[] = [
    ext("A1", "EXT-A", { status: "retail" }),
    ext("A2", "EXT-A", { status: "wholesale" }),
    ext("A3", "EXT-A", { status: "unsold", finalAmount: 700 }),
    ext("A4", "EXT-A", { status: "returned", ret: restockedReturn, finalAmount: 900 }),
    ext("A5", "EXT-A", { status: "returned", ret: heldReturn }),
    ext("B1", "EXT-B", { status: "retail" }),
    ext("B2", "EXT-B", { status: "returned", returnedToSupplier: true }),
    ext("C1", "EXT-C", { status: "unsold" }),
  ];
  const rollup = supplierRollup(purchaseOutstanding(sarees, purchases));
  const alpha = rollup.find((r) => r.supplier === "Alpha Silks")!;

  it("groups purchases by supplier, most outstanding first", () => {
    expect(rollup.map((r) => r.supplier)).toEqual(["Alpha Silks", "Beta Weaves"]);
    expect(alpha.purchases).toBe(2);
  });

  it("counts retail and wholesale as sold, and customer returns as not sold", () => {
    expect(alpha.sold).toBe(3);
    expect(alpha.returned).toBe(2);
    expect(alpha.unsold).toBe(2);
    expect(alpha.supplierReturned).toBe(1);
  });

  it("reconciles: bought = sold + outstanding + to supplier + held customer returns", () => {
    rollup.forEach((r) => {
      const supplierSarees = sarees.filter((s) =>
        purchases.some((p) => p.id === s.purchaseId && p.supplier === r.supplier)
      );
      const held = supplierSarees.filter(
        (s) => s.status === "returned" && !s.returnedToSupplier && !s.ret?.restocked
      ).length;
      expect(r.bought).toBe(r.sold + r.unsold + r.supplierReturned + held);
    });
    expect(alpha.bought).toBe(7);
  });

  it("sums bill due and unsold value across the supplier's purchases", () => {
    expect(alpha.due).toBe(6_000);
    expect(alpha.unsoldValue).toBe(1_600);
  });
});
