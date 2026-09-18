import { FirmActivityService } from "./firm-activity.service";

/**
 * The committed half of a firm's ledger is where the money is easiest to get
 * wrong: a document that should never have been a commitment (a rejected
 * purchase order), or one that nothing can ever settle (an ad-hoc goods
 * receipt, which has no bill behind it), both inflate "payable" silently and
 * permanently. These fix the shape of those two cases.
 */
describe("FirmActivityService — committed money", () => {
  const FIRM = { id: "FIRM-001", firmName: "Kesava Silks" };

  const buildPrisma = (over: Record<string, unknown> = {}) => ({
    firm: { findUnique: jest.fn().mockResolvedValue(FIRM) },
    purchaseOrder: { findMany: jest.fn().mockResolvedValue([]) },
    grnReceipt: { findMany: jest.fn().mockResolvedValue([]) },
    dispatchRecord: { findMany: jest.fn().mockResolvedValue([]) },
    weaverPayment: { findMany: jest.fn().mockResolvedValue([]) },
    vendorPayment: { findMany: jest.fn().mockResolvedValue([]) },
    supplierPayment: { findMany: jest.fn().mockResolvedValue([]) },
    invoicePayment: { findMany: jest.fn().mockResolvedValue([]) },
    saleRecord: { findMany: jest.fn().mockResolvedValue([]) },
    firmFinancialEntry: { findMany: jest.fn().mockResolvedValue([]) },
    ...over,
  });

  const grn = (id: string, total: number, day: string, vendorId = "VEN-1") => ({
    id,
    vendorId,
    vendor: { name: "Sree Ganesha Silks" },
    supplierName: "Sree Ganesha Silks",
    receivedDate: new Date(day),
    items: [{ totalPrice: total }],
    purchaseOrders: [],
  });

  it("asks only for purchase orders that were not rejected", async () => {
    const prisma = buildPrisma();
    await new FirmActivityService(prisma as any).getActivity("FIRM-001");

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { firmId: "FIRM-001", status: { not: "REJECTED" } },
      }),
    );
  });

  it("settles ad-hoc goods receipts from unallocated vendor payments, oldest first", async () => {
    const prisma = buildPrisma({
      grnReceipt: {
        findMany: jest.fn().mockResolvedValue([
          grn("GRN-2026-002", 40_000, "2026-02-01"),
          grn("GRN-2026-001", 30_000, "2026-01-01"),
        ]),
      },
      vendorPayment: {
        findMany: jest.fn().mockResolvedValue([
          // ₹50,000 paid to this vendor against no particular bill.
          { id: "PAY-1", vendorId: "VEN-1", billId: null, amount: 50_000, date: new Date("2026-02-10"), utr: "UTR1", vendor: { name: "Sree Ganesha Silks" } },
        ]),
      },
    });

    const { documents, totals } = await new FirmActivityService(prisma as any).getActivity("FIRM-001");
    const byId = Object.fromEntries(documents.map((d) => [d.id, d]));

    // Oldest receipt clears in full, the remaining ₹20,000 part-pays the next.
    expect(byId["GRN-2026-001"]).toMatchObject({ paidAmount: 30_000, outstanding: 0, status: "PAID" });
    expect(byId["GRN-2026-002"]).toMatchObject({ paidAmount: 20_000, outstanding: 20_000, status: "PARTIAL" });
    expect(totals.pendingExpense).toBe(20_000);
  });

  it("ignores payments already tied to a bill — those settle a purchase order, not a receipt", async () => {
    const prisma = buildPrisma({
      grnReceipt: { findMany: jest.fn().mockResolvedValue([grn("GRN-2026-001", 30_000, "2026-01-01")]) },
      vendorPayment: {
        findMany: jest.fn().mockResolvedValue([
          { id: "PAY-1", vendorId: "VEN-1", billId: "BILL-1", amount: 30_000, date: new Date("2026-01-05"), utr: "UTR1", vendor: { name: "Sree Ganesha Silks" } },
        ]),
      },
    });

    const { totals } = await new FirmActivityService(prisma as any).getActivity("FIRM-001");

    expect(totals.pendingExpense).toBe(30_000);
  });

  it("never reports a quotation — an unaccepted offer is not part of a firm's ledger", async () => {
    const prisma = buildPrisma() as any;
    const { documents, totals } = await new FirmActivityService(prisma).getActivity("FIRM-001");

    expect(prisma.quotation).toBeUndefined();
    expect(documents.some((d: { type: string }) => d.type === "QUOTATION")).toBe(false);
    expect(totals).not.toHaveProperty("quotedPipeline");
  });
});
