import { BadRequestException } from "@nestjs/common";
import { PurchaseDiscountType } from "../generated/prisma/client";
import { computeBill } from "./purchases.service";

// Same figures as the frontend's computePurchaseBill tests — the two must agree
// or the bill shown on the form won't be the bill that's saved.
describe("computeBill", () => {
  const lines = [
    { price: 15000, quantity: 2 },
    { price: 4000, quantity: 1 },
  ];

  it("is the sarees' buying total when there's no discount or GST", () => {
    expect(computeBill(lines, null, 0, 0)).toEqual({
      subtotal: 34000,
      discountType: null,
      discountValue: 0,
      discountAmount: 0,
      gstPercent: 0,
      gstAmount: 0,
      billAmount: 34000,
    });
  });

  it("applies a percentage discount, then GST on the discounted total", () => {
    const bill = computeBill(lines, PurchaseDiscountType.PERCENT, 5, 5);
    expect(bill.discountAmount).toBe(1700);
    expect(bill.gstAmount).toBe(1615);
    expect(bill.billAmount).toBe(33915);
  });

  it("applies a flat amount discount", () => {
    expect(computeBill(lines, PurchaseDiscountType.AMOUNT, 1500, 0).billAmount).toBe(32500);
  });

  it("keeps paise exact on GST", () => {
    const bill = computeBill([{ price: 999, quantity: 1 }], null, 0, 12);
    expect(bill.gstAmount).toBe(119.88);
    expect(bill.billAmount).toBe(1118.88);
  });

  it("stores no discount type when the value is zero", () => {
    const bill = computeBill(lines, PurchaseDiscountType.PERCENT, 0, 0);
    expect(bill.discountType).toBeNull();
  });

  it("rejects a discount larger than the bill", () => {
    expect(() => computeBill(lines, PurchaseDiscountType.PERCENT, 120, 0)).toThrow(BadRequestException);
    expect(() => computeBill(lines, PurchaseDiscountType.AMOUNT, 40000, 0)).toThrow(BadRequestException);
  });
});
