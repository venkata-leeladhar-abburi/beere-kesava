import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FirmsService } from "./firms.service";

/**
 * The link is an accounting decision applied in bulk, so the rules that keep a
 * firm's income honest are all in the guard clauses: nothing is written unless
 * every ref is a real retail sale that isn't already on this firm.
 */
describe("FirmsService — retail sale linking", () => {
  let prisma: any;
  let service: FirmsService;

  const FIRM = { id: "FIRM-001", firmName: "Kesava Silks" };

  beforeEach(() => {
    prisma = {
      firm: {
        findUnique: jest.fn().mockResolvedValue(FIRM),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockResolvedValue([{ count: 0 }, FIRM, { count: 7 }]),
      saleRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      },
    };
    service = new FirmsService(prisma, {} as any);
  });

  const sale = (over: Record<string, unknown> = {}) => ({
    saleRef: "SALE-001", channel: "RETAIL", firmId: null, ...over,
  });


  describe("setRetailSalesFirm", () => {
    it("clears the flag elsewhere, sets it here, and back-fills unconnected sales in one transaction", async () => {
      const result = await service.setRetailSalesFirm("FIRM-001", "user-1");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // "At most one active firm" and the back-fill must not be separable.
      expect(prisma.firm.updateMany).toHaveBeenCalledWith({
        where: { isRetailSalesFirm: true, id: { not: "FIRM-001" } },
        data: { isRetailSalesFirm: false },
      });
      expect(prisma.firm.update).toHaveBeenCalledWith({
        where: { id: "FIRM-001" }, data: { isRetailSalesFirm: true },
      });
      expect(result).toMatchObject({ firmId: "FIRM-001", backfilled: 7 });
    });

    it("back-fills only sales on no firm — a sale on another firm is left alone", async () => {
      await service.setRetailSalesFirm("FIRM-001");

      expect(prisma.saleRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { channel: "RETAIL", firmId: null } }),
      );
      expect(prisma.saleRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ firmLinkedAuto: true }) }),
      );
    });

    it("404s on an unknown firm before writing anything", async () => {
      prisma.firm.findUnique.mockResolvedValue(null);

      await expect(service.setRetailSalesFirm("FIRM-404")).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("clearRetailSalesFirm", () => {
    it("unsets the rule but leaves every existing link in place", async () => {
      prisma.firm.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.clearRetailSalesFirm();

      expect(result).toEqual({ cleared: 1 });
      // Clearing the rule is not a reason to strip a firm's booked income.
      expect(prisma.saleRecord.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("linkRetailSales", () => {
    it("books the sales to the firm with an audit trail", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale(), sale({ saleRef: "SALE-002" })]);

      const result = await service.linkRetailSales(
        "FIRM-001",
        { saleRefs: ["SALE-001", "SALE-002"], note: "March counter sales" },
        "user-1",
      );
      // A person picked these, so they are not marked automatic.

      expect(prisma.saleRecord.updateMany).toHaveBeenCalledWith({
        where: { saleRef: { in: ["SALE-001", "SALE-002"] } },
        data: expect.objectContaining({
          firmId: "FIRM-001",
          firmLinkedById: "user-1",
          firmLinkedAuto: false,
          firmLinkNote: "March counter sales",
        }),
      });
      expect(result).toMatchObject({ linked: 2, moved: 0 });
    });

    it("de-duplicates repeated refs so a sale can't be counted twice", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale()]);

      const result = await service.linkRetailSales("FIRM-001", { saleRefs: ["SALE-001", "SALE-001"] });

      expect(result.linked).toBe(1);
      expect(prisma.saleRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { saleRef: { in: ["SALE-001"] } } }),
      );
    });

    it("moves a sale that is on another firm, and reports the move", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale({ firmId: "FIRM-002" })]);

      const result = await service.linkRetailSales("FIRM-001", { saleRefs: ["SALE-001"] });

      expect(result).toMatchObject({ linked: 1, moved: 1 });
    });

    it("writes nothing when any ref is unknown", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale()]);

      await expect(
        service.linkRetailSales("FIRM-001", { saleRefs: ["SALE-001", "SALE-999"] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.saleRecord.updateMany).not.toHaveBeenCalled();
    });

    it("rejects wholesale sales — those reach a firm via dispatch invoices", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale({ channel: "WHOLESALE" })]);

      await expect(
        service.linkRetailSales("FIRM-001", { saleRefs: ["SALE-001"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.saleRecord.updateMany).not.toHaveBeenCalled();
    });

    it("rejects a sale already on this firm rather than re-stamping it", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale({ firmId: "FIRM-001" })]);

      await expect(
        service.linkRetailSales("FIRM-001", { saleRefs: ["SALE-001"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.saleRecord.updateMany).not.toHaveBeenCalled();
    });

    it("404s on an unknown firm before touching any sale", async () => {
      prisma.firm.findUnique.mockResolvedValue(null);

      await expect(
        service.linkRetailSales("FIRM-404", { saleRefs: ["SALE-001"] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.saleRecord.findMany).not.toHaveBeenCalled();
    });
  });

  describe("unlinkRetailSale", () => {
    it("clears the link and its audit fields", async () => {
      prisma.saleRecord.findUnique.mockResolvedValue({ saleRef: "SALE-001", firmId: "FIRM-001" });

      await service.unlinkRetailSale("FIRM-001", "SALE-001");

      expect(prisma.saleRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { saleRef: "SALE-001" },
          data: { firmId: null, firmLinkedAt: null, firmLinkedById: null, firmLinkedAuto: false, firmLinkNote: null },
        }),
      );
    });

    it("refuses to disconnect a sale that belongs to another firm", async () => {
      prisma.saleRecord.findUnique.mockResolvedValue({ saleRef: "SALE-001", firmId: "FIRM-002" });

      await expect(service.unlinkRetailSale("FIRM-001", "SALE-001"))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.saleRecord.update).not.toHaveBeenCalled();
    });
  });

  describe("listRetailSales", () => {
    it("reports the revenue total over the whole filtered set, not the page", async () => {
      prisma.saleRecord.findMany.mockResolvedValue([sale()]);
      prisma.saleRecord.count.mockResolvedValue(120);
      prisma.saleRecord.aggregate.mockResolvedValue({ _sum: { amount: "450000" } });

      const result = await service.listRetailSales("FIRM-001", { page: 1, pageSize: 20 });

      expect(result).toMatchObject({ total: 120, totalAmount: 450000 });
    });

    it("scopes to this firm's RETAIL sales and honours the date window", async () => {
      await service.listRetailSales("FIRM-001", {
        page: 1, pageSize: 20, from: "2026-03-01", to: "2026-03-31",
      });

      const where = prisma.saleRecord.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({ firmId: "FIRM-001", channel: "RETAIL" });
      // `to` is a calendar day but sales carry a time — the whole day counts.
      expect(where.date.lte.getHours()).toBe(23);
    });

    it("rejects an unparseable date instead of silently ignoring the filter", async () => {
      await expect(
        service.listRetailSales("FIRM-001", { page: 1, pageSize: 20, from: "not-a-date" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("listConnectableRetailSales", () => {
    it("defaults to sales not yet on any firm", async () => {
      await service.listConnectableRetailSales({ page: 1, pageSize: 20 });

      expect(prisma.saleRecord.findMany.mock.calls[0][0].where).toMatchObject({
        channel: "RETAIL", firmId: null,
      });
    });

    it("includes already-linked sales when asked, so one can be moved", async () => {
      await service.listConnectableRetailSales({ page: 1, pageSize: 20, includeLinked: true });

      expect(prisma.saleRecord.findMany.mock.calls[0][0].where.firmId).toBeUndefined();
    });
  });
});
