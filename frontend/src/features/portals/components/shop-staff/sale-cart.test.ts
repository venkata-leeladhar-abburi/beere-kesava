import { describe, expect, it } from "vitest";
import { allocateBillDiscount, billDiscountAmount, billTotal, type SaleLine } from "./sale-cart";

const line = (id: string, soldPrice: number): SaleLine => ({
  id, batchId: "", design: "", name: "", type: "", typeCode: "", weight: "", weaver: "",
  originalPrice: soldPrice, discountMode: "amount", discountValue: 0, soldPrice,
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
