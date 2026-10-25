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
  const OTHER_FIRM = { id: "FIRM-002", firmName: "Vysnawi Handlooms" };
  const supplierPayment = (id: string, amount: number, purchaseId: string | null, day: string, firmId = "FIRM-001") => ({
    id, supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, purchaseId, amount, date: new Date(day),
    utr: "UTR9", method: "Bank Transfer", firmId, recordedBy: { firstName: "Asha", lastName: "K" },
  });

  const buildPrisma = (over: Record<string, unknown> = {}) => ({
    firm: { findUnique: jest.fn().mockResolvedValue(FIRM), findMany: jest.fn().mockResolvedValue([FIRM, OTHER_FIRM]) },
    supplier: { findMany: jest.fn().mockResolvedValue([{ id: "SUP-1", name: "Ravi Silks" }]) },
    purchaseOrder: { findMany: jest.fn().mockResolvedValue([]) },
    grnReceipt: { findMany: jest.fn().mockResolvedValue([]) },
    purchase: { findMany: jest.fn().mockResolvedValue([]) },
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

  it("reports an external purchase booked to the firm, settled by its linked payments", async () => {
    const prisma = buildPrisma({
      purchase: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "EXT-Ravi-001",
            supplierId: "SUP-1",
            supplier: { name: "Ravi Silks" },
            supplierName: null,
            date: new Date("2026-03-01"),
            billAmount: 50_000,
            firmId: "FIRM-001",
            sareeLines: [{ price: 5_000, quantity: 10, returnedQuantity: 0 }],
          },
        ]),
      },
      supplierPayment: { findMany: jest.fn().mockResolvedValue([supplierPayment("SP-1", 20_000, "EXT-Ravi-001", "2026-03-05")]) },
    });

    const { documents, totals } = await new FirmActivityService(prisma as any).getActivity("FIRM-001");

    expect(prisma.purchase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { firmId: "FIRM-001" } }));
    expect(documents[0]).toMatchObject({
      type: "EXTERNAL_PURCHASE",
      party: "Ravi Silks",
      partyType: "SUPPLIER",
      partyId: "SUP-1",
      amount: 50_000,
      paidAmount: 20_000,
      outstanding: 30_000,
      status: "PARTIAL",
      settlements: [expect.objectContaining({ paymentId: "SP-1", amount: 20_000, appliedAs: "LINKED", fromFirmName: "Kesava Silks" })],
    });
    expect(totals.pendingExpense).toBe(30_000);
  });

  it("takes sarees returned on an approved debit note off what the purchase still owes", async () => {
    const prisma = buildPrisma({
      purchase: {
        findMany: jest.fn().mockResolvedValue([
          // ₹50,000 bill for 10 pieces at ₹5,000; 4 sent back → ₹20,000 credited.
          {
            id: "EXT-Ravi-001", supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, supplierName: null,
            date: new Date("2026-03-01"), billAmount: 50_000, firmId: "FIRM-001",
            sareeLines: [{ price: 5_000, quantity: 10, returnedQuantity: 4 }],
          },
          // Everything sent back, nothing paid — settled by the credit alone.
          {
            id: "EXT-Ravi-002", supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, supplierName: null,
            date: new Date("2026-03-02"), billAmount: 9_000, firmId: "FIRM-001",
            sareeLines: [{ price: 3_000, quantity: 3, returnedQuantity: 3 }],
          },
        ]),
      },
      supplierPayment: { findMany: jest.fn().mockResolvedValue([supplierPayment("SP-1", 20_000, "EXT-Ravi-001", "2026-03-05")]) },
    });

    const { documents, totals } = await new FirmActivityService(prisma as any).getActivity("FIRM-001");

    expect(documents.find((d) => d.id === "EXT-Ravi-001")).toMatchObject({
      amount: 30_000, paidAmount: 20_000, outstanding: 10_000, status: "PARTIAL",
    });
    expect(documents.find((d) => d.id === "EXT-Ravi-002")).toMatchObject({
      amount: 0, outstanding: 0, status: "PAID",
    });
    expect(totals.pendingExpense).toBe(10_000);
  });

  it("groups documents and payments by the party they are with", async () => {
    const prisma = buildPrisma({
      purchase: {
        findMany: jest.fn().mockResolvedValue([
          { id: "EXT-1", supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, supplierName: null, date: new Date("2026-03-01"), billAmount: 50_000, firmId: "FIRM-001", sareeLines: [] },
          // An unregistered supplier has no record to group under.
          { id: "EXT-2", supplierId: null, supplier: null, supplierName: "Walk-in trader", date: new Date("2026-03-02"), billAmount: 9_000, firmId: "FIRM-001", sareeLines: [] },
        ]),
      },
      supplierPayment: {
        findMany: jest.fn().mockResolvedValue([
          supplierPayment("SP-1", 20_000, "EXT-1", "2026-03-05"),
        ]),
      },
      weaverPayment: {
        findMany: jest.fn().mockResolvedValue([
          { id: "WP-1", weaverId: "W-1", weaver: { name: "Ramoji" }, amountPaid: 4_000, paymentDate: new Date("2026-03-06"), utrNumber: null, batchNo: null },
        ]),
      },
    });

    const { connections } = await new FirmActivityService(prisma as any).getConnections("FIRM-001");

    expect(connections).toHaveLength(1);
    expect(connections[0]).toMatchObject({
      partyType: "SUPPLIER",
      partyId: "SUP-1",
      name: "Ravi Silks",
      totals: { documentCount: 1, amount: 50_000, paid: 20_000, outstanding: 30_000, paidFromFirm: 20_000, lastActivity: "2026-03-05" },
    });
    expect(connections[0].payments[0]).toMatchObject({ documentRef: "EXT-1" });
  });

  it("settles purchases from a general payment — this firm's first, then another firm's", async () => {
    // Firm FIRM-001 bought ₹1,795; FIRM-002 bought ₹1,23,201 from the same
    // supplier. FIRM-001 then paid ₹1,24,996 against no particular purchase.
    const own = { id: "EXT-4", supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, supplierName: null, date: new Date("2026-10-24"), billAmount: 1_795, firmId: "FIRM-001", sareeLines: [] };
    const other = { id: "EXT-1", supplierId: "SUP-1", supplier: { name: "Ravi Silks" }, supplierName: null, date: new Date("2026-10-18"), billAmount: 123_201, firmId: "FIRM-002", sareeLines: [] };
    const payment = supplierPayment("SP-1", 124_996, null, "2026-10-24");
    const prisma = buildPrisma({
      purchase: {
        findMany: jest.fn().mockImplementation(({ where }: { where: { firmId?: string } }) =>
          Promise.resolve(where.firmId ? [own] : [own, other]),
        ),
      },
      supplierPayment: { findMany: jest.fn().mockResolvedValue([payment]) },
    });

    const service = new FirmActivityService(prisma as any);
    const { documents, payments, totals } = await service.getActivity("FIRM-001");

    expect(documents[0]).toMatchObject({ id: "EXT-4", paidAmount: 1_795, outstanding: 0, status: "PAID" });
    expect(documents[0].settlements[0]).toMatchObject({ paymentId: "SP-1", amount: 1_795, appliedAs: "GENERAL" });
    expect(totals.pendingExpense).toBe(0);
    expect(payments[0].appliedTo).toEqual([
      { documentRef: "EXT-4", amount: 1_795, documentFirmId: "FIRM-001", documentFirmName: "Kesava Silks" },
      { documentRef: "EXT-1", amount: 123_201, documentFirmId: "FIRM-002", documentFirmName: "Vysnawi Handlooms" },
    ]);
    expect(payments[0].unapplied).toBe(0);

    const { connections } = await service.getConnections("FIRM-001");
    expect(connections[0].totals).toMatchObject({ amount: 1_795, paid: 1_795, outstanding: 0, paidFromFirm: 124_996 });
  });

  it("never reports a quotation — an unaccepted offer is not part of a firm's ledger", async () => {
    const prisma = buildPrisma() as any;
    const { documents, totals } = await new FirmActivityService(prisma).getActivity("FIRM-001");

    expect(prisma.quotation).toBeUndefined();
    expect(documents.some((d: { type: string }) => d.type === "QUOTATION")).toBe(false);
    expect(totals).not.toHaveProperty("quotedPipeline");
  });
});
