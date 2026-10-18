import { BadRequestException } from "@nestjs/common";
import { Prisma, PurchaseDiscountType } from "../generated/prisma/client";
import { PurchasesService, computeBill, creditedAmount, planLineChanges } from "./purchases.service";

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
  let sareeCodes: any;
  let service: PurchasesService;

  beforeEach(() => {
    const existing = { id: "EXT-1", subtotal: 400, discountType: null, discountValue: 0, gstPercent: 0, billAmount: 400, sareeLines: [storedLine] };
    prisma = {
      purchase: {
        findUnique: jest.fn().mockResolvedValue(existing),
        findUniqueOrThrow: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(existing),
      },
      purchaseSareeLine: { update: jest.fn(), deleteMany: jest.fn() },
      supplierReturnRequest: { findMany: jest.fn().mockResolvedValue([]) },
      supplierPayment: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
    };
    sareeCodes = { recodePurchases: jest.fn().mockResolvedValue([]), assertCodesFree: jest.fn() };
    service = new PurchasesService(prisma, {} as any, sareeCodes);
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

  it("keeps a saved line's stored code and re-codes through SareeCodesService in the same transaction", async () => {
    // The form may send a recomputed code for a saved line; writing it here
    // would rename the line without moving its sales/dispatch/stock records.
    await service.update("EXT-1", {
      invoiceNumber: "NEW",
      sarees: [{ id: "l1", code: "RAVI-NEW-001", price: 100, quantity: 4 }],
    });

    expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
      where: { id: "l1" },
      data: expect.objectContaining({ code: "RAVI-001" }),
    });
    expect(sareeCodes.recodePurchases).toHaveBeenCalledWith(prisma, ["EXT-1"]);
  });

  it("refuses to move a purchase to another firm once a different firm has paid against it", async () => {
    prisma.firm = { findUnique: jest.fn().mockResolvedValue({ id: "FIRM-002" }) };
    prisma.supplierPayment.findFirst = jest.fn().mockResolvedValue({ firm: { firmName: "Kesava Silks" } });

    await expect(service.update("EXT-1", { firmId: "FIRM-002" })).rejects.toThrow(/Kesava Silks has already paid/);
    expect(prisma.purchase.update).not.toHaveBeenCalled();
  });

  it("sets the firm on a purchase nobody has paid from another firm", async () => {
    prisma.firm = { findUnique: jest.fn().mockResolvedValue({ id: "FIRM-002" }) };
    prisma.supplierPayment.findFirst = jest.fn().mockResolvedValue(null);

    await service.update("EXT-1", { firmId: "FIRM-002" });

    expect(prisma.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ firmId: "FIRM-002" }) }),
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

describe("PurchasesService — supplier must be registered", () => {
  let prisma: any;
  let service: PurchasesService;

  beforeEach(() => {
    const existing = { id: "EXT-1", supplierId: null, supplierName: "RAVI SILKS", subtotal: 0, discountType: null, discountValue: 0, gstPercent: 0, billAmount: 0, sareeLines: [] };
    prisma = {
      purchase: {
        findUnique: jest.fn().mockResolvedValue(existing),
        findUniqueOrThrow: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(existing),
      },
      supplier: { findUnique: jest.fn() },
      $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
    };
    service = new PurchasesService(prisma, {} as any, { recodePurchases: jest.fn().mockResolvedValue([]), assertCodesFree: jest.fn() } as any);
  });

  it("refuses a new purchase with only a typed supplier name", async () => {
    await expect(
      service.create({ supplierName: "RAVI SILKS", sarees: [] } as any),
    ).rejects.toThrow(/registered supplier/);
    expect(prisma.supplier.findUnique).not.toHaveBeenCalled();
  });

  it("refuses to switch a purchase to a different typed name", async () => {
    await expect(service.update("EXT-1", { supplierName: "SOMEONE ELSE" })).rejects.toThrow(/registered supplier/);
    expect(prisma.purchase.update).not.toHaveBeenCalled();
  });

  it("still lets an older unlinked purchase be saved with its own name unchanged", async () => {
    await service.update("EXT-1", { supplierName: "RAVI SILKS", notes: "photo added" });
    expect(prisma.purchase.update).toHaveBeenCalled();
  });
});

describe("PurchasesService.findAll — paid amount", () => {
  it("sums each purchase's linked supplier payments, and orders ties on date by id", async () => {
    const prisma: any = {
      purchase: {
        findMany: jest.fn().mockResolvedValue([
          { id: "EXT-1", sareeLines: [] },
          { id: "EXT-2", sareeLines: [] },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
      supplierPayment: {
        groupBy: jest.fn().mockResolvedValue([{ purchaseId: "EXT-1", _sum: { amount: new Prisma.Decimal("2500.5") } }]),
      },
    };
    const service = new PurchasesService(prisma, {} as any, {} as any);

    const res = await service.findAll({ page: 1, pageSize: 100 });

    expect(res.items.map((p) => p.paidAmount)).toEqual(["2500.50", "0.00"]);
    expect(prisma.supplierPayment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { purchaseId: { in: ["EXT-1", "EXT-2"] } } }),
    );
    expect(prisma.purchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ date: "desc" }, { id: "asc" }] }),
    );
  });
});

describe("creditedAmount", () => {
  const lines = [
    { price: 15000, quantity: 2, returnedQuantity: 0 },
    { price: 4000, quantity: 1, returnedQuantity: 0 },
  ];

  it("is nothing when no piece has gone back", () => {
    expect(creditedAmount(34000, lines)).toBe(0);
  });

  it("is the returned pieces' buying value on a plain bill", () => {
    expect(creditedAmount(34000, [{ ...lines[0], returnedQuantity: 1 }, lines[1]])).toBe(15000);
  });

  it("takes the discount and GST off in proportion", () => {
    // 5% off then 5% GST: bill 33,915 on a 34,000 subtotal. One ₹15,000 piece
    // back = 15,000 × 0.95 × 1.05.
    const bill = computeBill(lines, PurchaseDiscountType.PERCENT, 5, 5).billAmount;
    expect(creditedAmount(bill, [{ ...lines[0], returnedQuantity: 1 }, lines[1]])).toBe(14962.5);
  });

  it("credits the whole bill when every piece has gone back", () => {
    const bill = computeBill(lines, PurchaseDiscountType.AMOUNT, 1500, 12).billAmount;
    expect(creditedAmount(bill, lines.map((l) => ({ ...l, returnedQuantity: l.quantity })))).toBe(bill);
  });

  it("never counts more returned pieces than the line has", () => {
    expect(creditedAmount(34000, [{ ...lines[0], returnedQuantity: 9 }, lines[1]])).toBe(30000);
  });
});

describe("PurchasesService.recomputeStatus — returns credit the bill", () => {
  let prisma: any;
  let service: PurchasesService;

  // ₹10,000 bill for 10 pieces at ₹1,000.
  const purchaseWith = (returnedQuantity: number, status = "PENDING") => ({
    id: "EXT-1",
    billAmount: new Prisma.Decimal(10000),
    status,
    sareeLines: [{ price: new Prisma.Decimal(1000), quantity: 10, returnedQuantity }],
  });
  const paid = (amount: number, count: number) => ({ _sum: { amount: new Prisma.Decimal(amount) }, _count: { _all: count } });

  beforeEach(() => {
    prisma = {
      purchase: { findUnique: jest.fn(), update: jest.fn() },
      supplierPayment: { aggregate: jest.fn() },
    };
    service = new PurchasesService(prisma, {} as any, {} as any);
  });

  it("marks a part-paid bill PAID once returns cover the rest", async () => {
    prisma.purchase.findUnique.mockResolvedValue(purchaseWith(3, "PARTIAL"));
    prisma.supplierPayment.aggregate.mockResolvedValue(paid(7000, 1));

    await service.recomputeStatus("EXT-1");

    expect(prisma.purchase.update).toHaveBeenCalledWith({ where: { id: "EXT-1" }, data: { status: "PAID" } });
  });

  it("keeps a bill PARTIAL while something is still owed after returns", async () => {
    prisma.purchase.findUnique.mockResolvedValue(purchaseWith(2, "PENDING"));
    prisma.supplierPayment.aggregate.mockResolvedValue(paid(7000, 1));

    await service.recomputeStatus("EXT-1");

    expect(prisma.purchase.update).toHaveBeenCalledWith({ where: { id: "EXT-1" }, data: { status: "PARTIAL" } });
  });

  it("marks an unpaid bill PAID when every piece has gone back", async () => {
    prisma.purchase.findUnique.mockResolvedValue(purchaseWith(10, "PENDING"));
    prisma.supplierPayment.aggregate.mockResolvedValue(paid(0, 0));

    await service.recomputeStatus("EXT-1");

    expect(prisma.purchase.update).toHaveBeenCalledWith({ where: { id: "EXT-1" }, data: { status: "PAID" } });
  });

  it("leaves a hand-set status alone when a partial return leaves no linked payment to derive from", async () => {
    prisma.purchase.findUnique.mockResolvedValue(purchaseWith(2, "PAID"));
    prisma.supplierPayment.aggregate.mockResolvedValue(paid(0, 0));

    await service.recomputeStatus("EXT-1");

    expect(prisma.purchase.update).not.toHaveBeenCalled();
  });
});

describe("PurchasesService.findAll — credited amount", () => {
  it("reports each purchase's credit from approved returns", async () => {
    const prisma: any = {
      purchase: {
        findMany: jest.fn().mockResolvedValue([
          { id: "EXT-1", billAmount: new Prisma.Decimal(10000), sareeLines: [{ price: 1000, quantity: 10, returnedQuantity: 3 }] },
          { id: "EXT-2", billAmount: new Prisma.Decimal(5000), sareeLines: [{ price: 5000, quantity: 1, returnedQuantity: 0 }] },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
      supplierPayment: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    const service = new PurchasesService(prisma, {} as any, {} as any);

    const res = await service.findAll({ page: 1, pageSize: 100, view: "summary" });

    expect(res.items.map((p) => p.creditedAmount)).toEqual(["3000.00", "0.00"]);
  });
});
