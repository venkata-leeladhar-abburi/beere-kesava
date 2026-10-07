import { describe, expect, it } from "vitest";
import {
  allocateBillDiscount,
  allocateByWeight,
  billDiscountAmount,
  billTotal,
  gstBreakdown,
  gstIssue,
  isValidGstin,
  NO_GST,
  type SaleLine,
} from "./sale-cart";

const line = (id: string, soldPrice: number): SaleLine => ({
  id,
  batchId: "",
  design: "",
  name: "",
  type: "",
  typeCode: "",
  weight: "",
  weaver: "",
  originalPrice: soldPrice,
  discountMode: "amount",
  discountValue: 0,
  soldPrice,
});

describe("bill discount", () => {
  it("takes a percentage or a flat amount off the basket, never below zero", () => {
    expect(billDiscountAmount(68000, { mode: "percent", value: 10 })).toBe(6800);
    expect(billDiscountAmount(68000, { mode: "amount", value: 500 })).toBe(500);
    expect(billDiscountAmount(1000, { mode: "amount", value: 5000 })).toBe(1000);
    expect(billDiscountAmount(1000, { mode: "percent", value: 0 })).toBe(0);
  });

  it("applies after the per-saree prices", () => {
    const cart = [line("A", 34000), { ...line("B", 34000), soldPrice: 30000 }];
    expect(billTotal(cart, { mode: "percent", value: 10 })).toBe(57600);
  });

  it("splits the discount across sarees in proportion, summing to the rupee", () => {
    const shares = allocateBillDiscount([line("A", 34000), line("B", 34000)], 1001);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1001);
    expect(shares.every(Number.isInteger)).toBe(true);
    expect(Math.abs(shares[0] - shares[1])).toBeLessThanOrEqual(1);

    const uneven = allocateBillDiscount([line("A", 1000), line("B", 3000), line("C", 333)], 777);
    expect(uneven.reduce((a, b) => a + b, 0)).toBe(777);
    expect(uneven[1]).toBeGreaterThan(uneven[0]);
  });

  it("never discounts a saree below zero", () => {
    const lines = [line("A", 10), line("B", 5)];
    const shares = allocateBillDiscount(lines, 15);
    expect(shares).toEqual([10, 5]);
    expect(allocateBillDiscount(lines, 0)).toEqual([0, 0]);
  });
});

describe("bill GST", () => {
  const on = (rate: number, gstin = "") => ({ enabled: true, rate, gstin });

  it("charges nothing when GST is off", () => {
    expect(gstBreakdown(27000, NO_GST)).toBeNull();
    expect(gstIssue(NO_GST)).toBeNull();
  });

  it("adds CGST + SGST, half the rate each, on top of the discounted bill", () => {
    expect(gstBreakdown(27000, on(5))).toEqual({
      rate: 5,
      taxable: 27000,
      cgst: 675,
      sgst: 675,
      gst: 1350,
      total: 28350,
    });
  });

  it("rounds each half to the nearest whole rupee", () => {
    // 12% of ₹1,234 is ₹148.08 → CGST ₹74.04 → ₹74 each.
    expect(gstBreakdown(1234, on(12))).toMatchObject({ cgst: 74, sgst: 74, gst: 148, total: 1382 });
    // 5% of ₹100 is ₹5 → ₹2.50 each rounds up, not down on float noise.
    expect(gstBreakdown(100, on(5))).toMatchObject({ cgst: 3, sgst: 3, gst: 6 });
  });

  it("refuses a missing, zero, oversized or over-precise rate", () => {
    expect(gstIssue(on(0))).toMatch(/percentage/);
    expect(gstIssue(on(29))).toMatch(/28%/);
    expect(gstIssue(on(5.555))).toMatch(/2 decimals/);
    expect(gstIssue(on(2.55))).toBeNull();
    expect(gstBreakdown(1000, on(0))).toBeNull();
  });

  it("accepts an empty GSTIN, and only a well-formed one otherwise", () => {
    expect(gstIssue(on(5, ""))).toBeNull();
    expect(gstIssue(on(5, "36aaacr5055k1z5"))).toBeNull();
    expect(gstIssue(on(5, "36AAACR5055K1Z"))).toMatch(/GST number/);
    expect(isValidGstin("36 AAACR 5055K1Z5")).toBe(true);
    expect(isValidGstin("3AAAACR5055K1Z5")).toBe(false);
  });

  it("splits the bill's GST across sarees so it adds up exactly", () => {
    const shares = allocateByWeight([1000, 1000, 1000], 100);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
    expect(shares.sort()).toEqual([33, 33, 34]);
    expect(allocateByWeight([27000], 1350)).toEqual([1350]);
    expect(allocateByWeight([0, 0], 10)).toEqual([0, 0]);
  });
});
