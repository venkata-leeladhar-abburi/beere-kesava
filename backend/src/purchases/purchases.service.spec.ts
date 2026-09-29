import { BadRequestException } from "@nestjs/common";
import { PurchaseDiscountType } from "../generated/prisma/client";
import { PurchasesService, computeBill, planLineChanges } from "./purchases.service";

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

describe("planLineChanges", () => {
  const stored = [
    { id: "l1", code: "RAVI-001", returnedQuantity: 2, returnedPieceNos: [3, 4] },
    { id: "l2", code: "RAVI-002", returnedQuantity: 0, returnedPieceNos: [] },
  ];

  it("keeps lines matched by id, then by code, and keeps their stored returned pieces", () => {
    const plan = planLineChanges(stored, [
      { id: "l1", code: "RAVI-001", price: 100, returnedQuantity: 0 },
      { code: "RAVI-002", price: 200 },
    ]);

    expect(plan.kept.map((k) => k.existing.id)).toEqual(["l1", "l2"]);
    expect(plan.created).toHaveLength(0);
    expect(plan.removedIds).toEqual([]);
    expect(plan.effective[0]).toMatchObject({ returnedQuantity: 2, returnedPieceNos: [3, 4] });
  });

  it("treats unmatched submitted lines as new and unmatched stored lines as removed", () => {
    const plan = planLineChanges(stored, [
      { id: "l1", code: "RAVI-001", price: 100 },
      { code: "RAVI-003", price: 300 },
    ]);

    expect(plan.created.map((c) => c.line.code)).toEqual(["RAVI-003"]);
    expect(plan.removedIds).toEqual(["l2"]);
  });
});

describe("PurchasesService.update — saree lines", () => {
  const storedLine = {
    id: "l1", purchaseId: "EXT-1", code: "RAVI-001", price: 100, quantity: 4,
    returnedQuantity: 1, returnedPieceNos: [2],
  };
  let prisma: any;
  let service: PurchasesService;

  beforeEach(() => {
    const existing = { id: "EXT-1", subtotal: 400, discountType: null, discountValue: 0, gstPercent: 0, billAmount: 400, sareeLines: [storedLine] };
    prisma = {
      purchase: { findUnique: jest.fn().mockResolvedValue(existing), update: jest.fn().mockResolvedValue(existing) },
      purchaseSareeLine: { update: jest.fn(), deleteMany: jest.fn() },
      supplierReturnRequest: { findMany: jest.fn().mockResolvedValue([]) },
      supplierPayment: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
    };
    service = new PurchasesService(prisma, {} as any);
  });

  it("updates a kept line in place instead of deleting and recreating it", async () => {
    await service.update("EXT-1", { sarees: [{ id: "l1", code: "RAVI-001", price: 120, quantity: 4, returnedQuantity: 0 }] });

    expect(prisma.purchaseSareeLine.deleteMany).not.toHaveBeenCalled();
    expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
      where: { id: "l1" },
      data: expect.objectContaining({ price: 120, returnedQuantity: 1, returnedPieceNos: [2] }),
    });
    expect(prisma.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sareeCount: 3 }) }),
    );
  });

  it("refuses to remove a line that has a return raised against it", async () => {
    prisma.supplierReturnRequest.findMany.mockResolvedValue([{ sareeLine: { code: "RAVI-001" } }]);

    await expect(service.update("EXT-1", { sarees: [{ code: "RAVI-009", price: 50 }] })).rejects.toThrow(/Can't remove RAVI-001/);
    expect(prisma.purchaseSareeLine.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses to shrink a line below its returned and pending pieces", async () => {
    prisma.supplierReturnRequest.findMany.mockResolvedValue([{ sareeLineId: "l1", quantity: 2 }]);

    await expect(
      service.update("EXT-1", { sarees: [{ id: "l1", code: "RAVI-001", price: 100, quantity: 2 }] }),
    ).rejects.toThrow(/can't go below 3/);
  });
});
