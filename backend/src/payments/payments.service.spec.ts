import { NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PaymentsService } from "./payments.service";

/**
 * PaymentsService covers the three payment ledgers (weaver/supplier/vendor),
 * the earnings and summary rollups the Payments dashboard reads, and the
 * synchronous Excel import. The import is where the real risk lives: it writes
 * money rows in bulk from an admin-supplied spreadsheet, and its overpayment
 * guard is the only thing standing between a typo'd cell and a weaver being
 * paid more than they earned. These tests pin that guard, the id-or-name
 * resolution both weaver and firm columns accept, and the rework dedup that
 * decides how much a weaver is owed in the first place.
 */

/** Builds a real .xlsx buffer — the import parses a genuine workbook, so
 *  hand-rolled fixtures would test a parser that isn't the one in production. */
async function sheetBuffer(
  headers: string[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Payments");
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(headers.map((h) => (row[h] === undefined ? null : row[h])));
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe("PaymentsService", () => {
  let prisma: any;
  let auditLog: any;
  let vendorBills: any;
  let purchases: any;
  let idGenerator: any;
  let service: PaymentsService;

  beforeEach(() => {
    prisma = {
      weaver: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      supplier: { findUnique: jest.fn() },
      vendor: { findUnique: jest.fn() },
      vendorBill: { findUnique: jest.fn() },
      firm: { findMany: jest.fn().mockResolvedValue([]) },
      weaverPayment: {
        create: jest.fn().mockResolvedValue({ id: "wp-1" }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountPaid: null } }),
      },
      supplierPayment: {
        create: jest.fn().mockResolvedValue({ id: "sp-1" }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      },
      vendorPayment: {
        create: jest.fn().mockResolvedValue({ id: "vp-1" }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      },
      invoice: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { paid: null, total: null } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      saleRecord: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }) },
      qcRecord: { findMany: jest.fn().mockResolvedValue([]) },
      batchSareeRow: { findMany: jest.fn().mockResolvedValue([]) },
      finishingAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      sareeTypeRate: { findMany: jest.fn().mockResolvedValue([]) },
    };
    auditLog = { recordAction: jest.fn() };
    vendorBills = { recomputeStatus: jest.fn() };
    purchases = { recomputeStatus: jest.fn() };
    let idCounter = 0;
    idGenerator = {
      nextFormatted: jest.fn().mockImplementation((prefix: string) => Promise.resolve(`${prefix}-${String(++idCounter).padStart(3, "0")}`)),
      nextScoped: jest.fn().mockImplementation((prefix: string, parentCode: string) => Promise.resolve(`${prefix}-${parentCode}-${String(++idCounter).padStart(3, "0")}`)),
    };
    service = new PaymentsService(prisma, auditLog, vendorBills, purchases, idGenerator);
  });

  describe("createWeaverPayment", () => {
    it("records the payment and an audit entry naming the weaver", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w-1", name: "Ramesh" });

      await service.createWeaverPayment({
        weaverId: "w-1",
        amountPaid: 5000,
        actorId: "u-1",
      });

      expect(prisma.weaverPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ weaverId: "w-1", amountPaid: 5000 }),
      });
      expect(auditLog.recordAction).toHaveBeenCalledWith(
        expect.objectContaining({
          module: "PAYMENTS",
          entityType: "WeaverPayment",
          recordLabel: "Ramesh",
          newValue: "5000",
        }),
      );
    });

    it("refuses an unknown weaver instead of writing an orphaned payment row", async () => {
      prisma.weaver.findUnique.mockResolvedValue(null);

      await expect(
        service.createWeaverPayment({ weaverId: "ghost", amountPaid: 5000 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.weaverPayment.create).not.toHaveBeenCalled();
    });
  });

  describe("createVendorPayment", () => {
    beforeEach(() => {
      prisma.vendor.findUnique.mockResolvedValue({ id: "v-1", name: "Sri Textiles" });
    });

    it("rejects a bill that belongs to a different vendor", async () => {
      prisma.vendorBill.findUnique.mockResolvedValue({ id: "b-1", vendorId: "v-OTHER" });

      await expect(
        service.createVendorPayment({ vendorId: "v-1", amount: 1000, billId: "b-1" }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.vendorPayment.create).not.toHaveBeenCalled();
      expect(vendorBills.recomputeStatus).not.toHaveBeenCalled();
    });

    it("recomputes the bill status once a payment lands against it", async () => {
      prisma.vendorBill.findUnique.mockResolvedValue({ id: "b-1", vendorId: "v-1" });

      await service.createVendorPayment({
        vendorId: "v-1",
        amount: 1000,
        billId: "b-1",
      });

      expect(vendorBills.recomputeStatus).toHaveBeenCalledWith("b-1");
    });

    it("leaves bill status alone for a standalone payment with no bill", async () => {
      await service.createVendorPayment({ vendorId: "v-1", amount: 1000 });

      expect(prisma.vendorPayment.create).toHaveBeenCalled();
      expect(vendorBills.recomputeStatus).not.toHaveBeenCalled();
    });
  });

  describe("getPaymentSummary", () => {
    it("returns zeros rather than NaN when every ledger is empty", async () => {
      const summary = await service.getPaymentSummary();

      expect(summary).toEqual({
        weaverTotal: 0,
        vendorTotal: 0,
        supplierTotal: 0,
        totalExpenses: 0,
        totalRevenue: 0,
        netCashFlow: 0,
        outstandingAmount: 0,
        outstandingCount: 0,
      });
    });

    it("nets revenue against expenses and sums only the unpaid share of open invoices", async () => {
      prisma.weaverPayment.aggregate.mockResolvedValue({ _sum: { amountPaid: 30000 } });
      prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 12000 } });
      prisma.supplierPayment.aggregate.mockResolvedValue({ _sum: { amount: 8000 } });
      prisma.invoice.aggregate.mockResolvedValue({ _sum: { paid: 60000, total: 90000 } });
      prisma.saleRecord.aggregate.mockResolvedValue({ _sum: { amount: 15000 } });
      prisma.invoice.findMany.mockResolvedValue([
        { total: 20000, paid: 5000, status: "PARTIAL" },
        { total: 10000, paid: 0, status: "OVERDUE" },
      ]);

      const summary = await service.getPaymentSummary();

      expect(summary.totalExpenses).toBe(50000);
      expect(summary.totalRevenue).toBe(75000);
      expect(summary.netCashFlow).toBe(25000);
      // Outstanding is total-minus-paid per invoice, not the raw totals.
      expect(summary.outstandingAmount).toBe(25000);
      expect(summary.outstandingCount).toBe(2);
    });
  });

  describe("getWeaverEarnings", () => {
    it("counts a saree once when it is both QC-passed and returned from finishing", async () => {
      prisma.batchSareeRow.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", sareeTypeCode: "SILK" },
      ]);
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "S-1", batchSareeRow: { weaverId: "w-1", sareeTypeCode: "SILK" } },
      ]);
      prisma.sareeTypeRate.findMany.mockResolvedValue([
        { code: "SILK", type: "Pure Silk", makingCharge: 1200 },
      ]);
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w-1", firstName: "Ramesh", lastName: "Kumar" },
      ]);

      const [earnings] = await service.getWeaverEarnings();

      expect(earnings.totalCompletedSarees).toBe(1);
      expect(earnings.totalEarned).toBe(1200);
      expect(earnings.weaverName).toBe("Ramesh Kumar");
    });

    it("prices an unknown saree type at zero instead of dropping the row", async () => {
      prisma.batchSareeRow.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", sareeTypeCode: "MYSTERY" },
      ]);
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w-1", firstName: "Ramesh", lastName: "Kumar" },
      ]);

      const [earnings] = await service.getWeaverEarnings();

      expect(earnings.totalCompletedSarees).toBe(1);
      expect(earnings.totalEarned).toBe(0);
      expect(earnings.breakdown[0].sareeTypeName).toBe("MYSTERY");
    });

    it("ignores rows with no saree type rather than bucketing them together", async () => {
      prisma.batchSareeRow.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", sareeTypeCode: null },
      ]);
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w-1", firstName: "Ramesh", lastName: "Kumar" },
      ]);

      await expect(service.getWeaverEarnings()).resolves.toEqual([]);
    });
  });

  describe("importWeaverPaymentsFromExcel", () => {
    const HEADERS = ["weaverId", "amountPaid", "firmId", "paymentDate", "utrNumber"];

    /** One weaver owed 10,000 (12,000 making charge less 2,000 deduction). */
    function weaverOwed10k() {
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w-1", code: "WV-001", name: "Ramesh" },
      ]);
      prisma.qcRecord.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", makingCharge: 12000, deduction: 2000, qcDate: new Date("2026-01-01") },
      ]);
    }

    it("rejects a file that isn't a readable workbook", async () => {
      // Arbitrary text parses as a (nonsense) CSV rather than throwing, so
      // what rejects it is the required-column check — which names the column
      // it wanted instead of blaming the file format.
      const result = await service.importWeaverPaymentsFromExcel(Buffer.from("not a spreadsheet"));

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toMatch(/weaverId/);
      expect(prisma.weaverPayment.createMany).not.toHaveBeenCalled();
    });

    it("tells the uploader to re-save a legacy .xls instead of failing opaquely", async () => {
      // OLE2 compound-document signature — a real pre-2007 .xls, which the
      // OOXML reader has no chance of parsing.
      const ole2 = Buffer.concat([
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        Buffer.alloc(512),
      ]);

      const result = await service.importWeaverPaymentsFromExcel(ole2);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toMatch(/legacy \.xls/);
      expect(prisma.weaverPayment.createMany).not.toHaveBeenCalled();
    });

    it("imports a CSV the same as an .xlsx", async () => {
      weaverOwed10k();
      prisma.firm.findMany.mockResolvedValue([{ id: "FIRM-001", firmName: "Beere Kesava" }]);
      prisma.weaverPayment.findMany.mockResolvedValue([]);

      const csv = "weaverId,amountPaid,firmId\nw-1,5000,FIRM-001";
      const result = await service.importWeaverPaymentsFromExcel(Buffer.from(csv, "utf8"));

      expect(result.errors).toEqual([]);
      expect(result.created).toBe(1);
      expect(prisma.weaverPayment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ weaverId: "w-1", amountPaid: 5000, firmId: "FIRM-001" })],
        }),
      );
    });

    it("matches a header column however it is capitalised or spaced", async () => {
      weaverOwed10k();
      prisma.firm.findMany.mockResolvedValue([{ id: "FIRM-001", firmName: "Beere Kesava" }]);
      prisma.weaverPayment.findMany.mockResolvedValue([]);

      // "Firm ID" used to miss the exact-match "firmId" lookup and be dropped
      // silently, because firmId is optional and raised no row error.
      const csv = "Weaver ID,Amount Paid,Firm ID\nw-1,5000,FIRM-001";
      const result = await service.importWeaverPaymentsFromExcel(Buffer.from(csv, "utf8"));

      expect(result.errors).toEqual([]);
      expect(prisma.weaverPayment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: [expect.objectContaining({ firmId: "FIRM-001" })] }),
      );
    });

    it("refuses a sheet missing a required column", async () => {
      const buffer = await sheetBuffer(["weaverId", "utrNumber"], [{ weaverId: "w-1" }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.errors).toEqual([
        { row: 1, message: 'Missing required column "amountPaid"' },
      ]);
      expect(prisma.weaverPayment.createMany).not.toHaveBeenCalled();
    });

    it("flags rows with a missing weaver or a non-positive amount, keeping the row number", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "", amountPaid: 500 },
        { weaverId: "w-1", amountPaid: 0 },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors).toEqual([
        { row: 2, message: "Missing weaverId" },
        { row: 3, message: "Missing or invalid amountPaid" },
      ]);
    });

    it("saves a payment that fits inside the weaver's remaining balance", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [{ weaverId: "w-1", amountPaid: 4000 }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result).toEqual({ created: 1, failed: 0, errors: [], totalAmount: 4000 });
      expect(prisma.weaverPayment.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ weaverId: "w-1", amountPaid: 4000 })],
      });
    });

    it("blocks a payment that exceeds what the weaver is still owed", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [{ weaverId: "w-1", amountPaid: 15000 }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("exceeds remaining balance");
      expect(prisma.weaverPayment.createMany).not.toHaveBeenCalled();
    });

    it("counts payments already saved from earlier uploads against the balance", async () => {
      weaverOwed10k();
      prisma.weaverPayment.findMany.mockResolvedValue([{ weaverId: "w-1", amountPaid: 9000 }]);
      const buffer = await sheetBuffer(HEADERS, [{ weaverId: "w-1", amountPaid: 2000 }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("already paid ₹9000");
    });

    it("checks two rows for the same weaver against each other, not just the DB", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "w-1", amountPaid: 7000 },
        { weaverId: "w-1", amountPaid: 7000 },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      // First row consumes 7,000 of the 10,000 owed; the second no longer fits.
      expect(result.created).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0].row).toBe(3);
    });

    it("only counts a reworked saree's latest QC verdict toward what is owed", async () => {
      prisma.weaver.findMany.mockResolvedValue([{ id: "w-1", code: "WV-001", name: "Ramesh" }]);
      // Same saree inspected twice — the superseded DEFECTIVE attempt must not
      // add its own making charge on top of the final PASSED one.
      prisma.qcRecord.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", makingCharge: 1000, deduction: 1000, qcDate: new Date("2026-01-01") },
        { sareeId: "S-1", weaverId: "w-1", makingCharge: 1000, deduction: 0, qcDate: new Date("2026-01-02") },
      ]);
      const buffer = await sheetBuffer(HEADERS, [{ weaverId: "w-1", amountPaid: 1500 }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      // Owed is 1,000 (the latest verdict alone), not 2,000.
      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("owed ₹1000");
    });

    it("accepts a weaver identified by code or by name, not just by raw id", async () => {
      prisma.weaver.findMany.mockResolvedValue([
        { id: "w-1", code: "WV-001", name: "Ramesh" },
        { id: "w-2", code: "WV-002", name: "Suresh" },
      ]);
      prisma.qcRecord.findMany.mockResolvedValue([
        { sareeId: "S-1", weaverId: "w-1", makingCharge: 5000, deduction: 0, qcDate: new Date("2026-01-01") },
        { sareeId: "S-2", weaverId: "w-2", makingCharge: 5000, deduction: 0, qcDate: new Date("2026-01-01") },
      ]);
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "WV-001", amountPaid: 1000 },
        { weaverId: "Suresh", amountPaid: 1000 },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result).toEqual({ created: 2, failed: 0, errors: [], totalAmount: 2000 });
      const saved = prisma.weaverPayment.createMany.mock.calls[0][0].data;
      expect(saved.map((r: any) => r.weaverId)).toEqual(["w-1", "w-2"]);
    });

    it("reports a weaver it cannot resolve by id, code or name", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [{ weaverId: "Nobody", amountPaid: 100 }]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("not found (checked weaver ID, code, and name)");
    });

    it("resolves a firm typed by name into its real id", async () => {
      weaverOwed10k();
      prisma.firm.findMany.mockResolvedValue([{ id: "f-1", firmName: "Beere Kesava" }]);
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "w-1", amountPaid: 1000, firmId: "Beere Kesava" },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(1);
      expect(prisma.weaverPayment.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ firmId: "f-1" })],
      });
    });

    it("rejects an unmatched firm rather than letting a broken foreign key reach the DB", async () => {
      weaverOwed10k();
      prisma.firm.findMany.mockResolvedValue([{ id: "f-1", firmName: "Beere Kesava" }]);
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "w-1", amountPaid: 1000, firmId: "Nonexistent Firm" },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("not found (checked both firm ID and firm name)");
      expect(prisma.weaverPayment.createMany).not.toHaveBeenCalled();
    });

    it("flags an unparseable paymentDate instead of storing an Invalid Date", async () => {
      weaverOwed10k();
      const buffer = await sheetBuffer(HEADERS, [
        { weaverId: "w-1", amountPaid: 1000, paymentDate: "not-a-date" },
      ]);

      const result = await service.importWeaverPaymentsFromExcel(buffer);

      expect(result.created).toBe(0);
      expect(result.errors[0].message).toContain("Invalid paymentDate");
    });
  });
});
