import { notificationsStub } from "../common/testing/notifications.stub";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SupplierDebitNotesService, decisionStatus } from "./supplier-debit-notes.service";
import { passthroughSareeCodes } from "../saree-codes/testing";

describe("SupplierDebitNotesService", () => {
  let prisma: any;
  let idGenerator: any;
  let service: SupplierDebitNotesService;

  const supplier = { id: "supplier-1", name: "Ravi Silks", code: "RaviSilks-001" };
  const purchase = { id: "EXT-2026-001", supplierId: "supplier-1", supplier };
  const lineA = { id: "line-a", code: "RAVI-001", purchaseId: "EXT-2026-001", quantity: 8, returnedQuantity: 0, returnedPieceNos: [] as number[] };
  const lineB = { id: "line-b", code: "RAVI-002", purchaseId: "EXT-2026-001", quantity: 3, returnedQuantity: 2, returnedPieceNos: [] as number[] };
  const lines = [lineA, lineB];

  beforeEach(() => {
    let counter = 0;
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "user-1" }) },
      purchase: { findUnique: jest.fn().mockResolvedValue(purchase), update: jest.fn() },
      purchaseSareeLine: {
        findMany: jest.fn().mockResolvedValue(lines),
        // The row after an atomic `increment`, as Postgres would return it.
        update: jest.fn().mockImplementation(({ where, data }) => {
          const line = lines.find((l) => l.id === where.id)!;
          return { ...line, returnedQuantity: line.returnedQuantity + (data.returnedQuantity?.increment ?? 0) };
        }),
      },
      supplierReturnRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      supplierDebitNote: {
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
    };
    idGenerator = { nextScoped: jest.fn().mockImplementation((p: string) => `${p}-RaviSilks-001-00${++counter}`) };
    service = new SupplierDebitNotesService(prisma, idGenerator, { recordAction: jest.fn() } as any, notificationsStub(), passthroughSareeCodes);
  });

  describe("decisionStatus", () => {
    it("is APPROVED for all, REJECTED for none, PARTIALLY_APPROVED otherwise", () => {
      expect(decisionStatus(4, 4)).toBe("APPROVED");
      expect(decisionStatus(0, 4)).toBe("REJECTED");
      expect(decisionStatus(2, 4)).toBe("PARTIALLY_APPROVED");
    });
  });

  describe("create", () => {
    it("raises one note and one PENDING request per line, carrying the picked pieces", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue({ id: "DN-RaviSilks-001-001" });

      await service.create({
        requestedById: "user-1",
        purchaseId: "EXT-2026-001",
        lines: [{ sareeLineId: "line-a", pieceNos: [4, 2] }],
      });

      expect(prisma.supplierDebitNote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ id: "DN-RaviSilks-001-001", supplierId: "supplier-1" }) }),
      );
      expect(prisma.supplierReturnRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ debitNoteId: "DN-RaviSilks-001-001", quantity: 2, pieceNos: [2, 4] }),
        }),
      );
    });

    it("locks the lines and re-checks availability inside the transaction", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue({ id: "DN-RaviSilks-001-001" });
      // Free when first checked; taken by a concurrent note by the time the lock is held.
      prisma.supplierReturnRequest.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ sareeLineId: "line-a", quantity: 1, pieceNos: [2] }]);

      await expect(
        service.create({ requestedById: "user-1", purchaseId: "EXT-2026-001", lines: [{ sareeLineId: "line-a", pieceNos: [2] }] }),
      ).rejects.toThrow(/already on a pending return/);
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.supplierDebitNote.create).not.toHaveBeenCalled();
    });

    it("refuses more pieces than are still available on the line", async () => {
      await expect(
        service.create({ requestedById: "user-1", purchaseId: "EXT-2026-001", lines: [{ sareeLineId: "line-b", pieceNos: [3, 1] }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it("refuses a piece that has already been returned", async () => {
      // line-b: 2 of 3 returned, none named — pieces 1 and 2 by convention.
      await expect(
        service.create({ requestedById: "user-1", purchaseId: "EXT-2026-001", lines: [{ sareeLineId: "line-b", pieceNos: [2] }] }),
      ).rejects.toThrow(/already been returned/);
    });

    it("refuses a piece already on a pending return", async () => {
      prisma.supplierReturnRequest.findMany.mockResolvedValue([{ sareeLineId: "line-a", quantity: 1, pieceNos: [3] }]);
      await expect(
        service.create({ requestedById: "user-1", purchaseId: "EXT-2026-001", lines: [{ sareeLineId: "line-a", pieceNos: [3] }] }),
      ).rejects.toThrow(/already on a pending return/);
    });
  });

  const pendingNote = () => ({
    id: "DN-RaviSilks-001-001",
    status: "PENDING",
    requestedById: "user-1",
    supplier,
    requests: [{ id: "RR-1", status: "PENDING", sareeLineId: "line-a", quantity: 4, pieceNos: [1, 2, 3, 4], sareeLine: lineA }],
  });

  describe("decide", () => {
    it("moves only the approved pieces out of stock and marks the note partially approved", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());

      await service.decide("DN-RaviSilks-001-001", {
        decidedById: "user-1",
        lines: [{ requestId: "RR-1", approvedPieceNos: [1, 3] }],
      });

      expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
        where: { id: "line-a" },
        data: { returnedQuantity: { increment: 2 } },
      });
      expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
        where: { id: "line-a" },
        data: { returnedPieceNos: [1, 3] },
      });
      expect(prisma.purchase.update).toHaveBeenCalledWith({ where: { id: "EXT-2026-001" }, data: { sareeCount: { decrement: 2 } } });
      expect(prisma.supplierReturnRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "PARTIALLY_APPROVED", approvedQuantity: 2, approvedPieceNos: [1, 3] }) }),
      );
      expect(prisma.supplierDebitNote.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "DN-RaviSilks-001-001", status: "PENDING" },
          data: expect.objectContaining({ status: "PARTIALLY_APPROVED" }),
        }),
      );
    });

    it("moves no stock when a concurrent decision got there first", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());
      prisma.supplierDebitNote.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.decide("DN-RaviSilks-001-001", { decidedById: "user-1", lines: [{ requestId: "RR-1", approvedPieceNos: [1] }] }),
      ).rejects.toThrow(/already been decided or cancelled/);
      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
      expect(prisma.purchase.update).not.toHaveBeenCalled();
    });

    it("rolls back when the increment would return more pieces than the line has", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());
      prisma.purchaseSareeLine.update.mockResolvedValueOnce({ ...lineA, returnedQuantity: 9 });

      await expect(
        service.decide("DN-RaviSilks-001-001", { decidedById: "user-1", lines: [{ requestId: "RR-1", approvedPieceNos: [1] }] }),
      ).rejects.toThrow(/more than exist/);
      expect(prisma.purchase.update).not.toHaveBeenCalled();
    });

    it("rejects the note, touching no stock, when nothing is approved", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());

      await service.decide("DN-RaviSilks-001-001", { decidedById: "user-1", lines: [] });

      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
      expect(prisma.supplierDebitNote.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED" }) }),
      );
    });

    it("refuses approving a piece that was never requested", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());
      await expect(
        service.decide("DN-RaviSilks-001-001", { decidedById: "user-1", lines: [{ requestId: "RR-1", approvedPieceNos: [7] }] }),
      ).rejects.toThrow(/was not requested/);
    });
  });

  describe("cancel", () => {
    it("lets the person who raised it cancel, freeing its pending lines", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());

      await service.cancel("DN-RaviSilks-001-001", { id: "user-1", isAdmin: false });

      expect(prisma.supplierDebitNote.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "DN-RaviSilks-001-001", status: "PENDING" }, data: expect.objectContaining({ status: "CANCELLED" }) }),
      );
      expect(prisma.supplierReturnRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { debitNoteId: "DN-RaviSilks-001-001", status: "PENDING" } }),
      );
      expect(prisma.purchaseSareeLine.update).not.toHaveBeenCalled();
    });

    it("lets an admin cancel someone else's note", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());
      await expect(service.cancel("DN-RaviSilks-001-001", { id: "admin-1", isAdmin: true })).resolves.toBeDefined();
    });

    it("refuses anyone else", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue(pendingNote());
      await expect(service.cancel("DN-RaviSilks-001-001", { id: "user-2", isAdmin: false })).rejects.toThrow(ForbiddenException);
    });

    it("refuses a note that is no longer pending", async () => {
      prisma.supplierDebitNote.findUnique.mockResolvedValue({ ...pendingNote(), status: "APPROVED" });
      await expect(service.cancel("DN-RaviSilks-001-001", { id: "user-1", isAdmin: false })).rejects.toThrow(BadRequestException);
    });
  });
  describe("lookupReturnable", () => {
    const withPurchase = (line: typeof lineA) => ({
      ...line, sareeType: "Kanchi", color: "Maroon", weight: null, price: "1995", imageUrl: null,
      sareeDate: null, pieceImageUrls: [] as string[],
      purchase: { id: "EXT-2026-001", invoiceNumber: "118", gstNumber: null, date: new Date(), supplierName: null, supplier },
    });

    it("resolves a scanned piece tag to its line and marks returned / pending pieces", async () => {
      prisma.purchaseSareeLine.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.code?.equals?.toUpperCase() === "RAVI-002" ? [withPurchase(lineB)] : []));
      prisma.supplierReturnRequest.findMany.mockResolvedValue([]);

      const [line] = await service.lookupReturnable("ravi-002-03");

      expect(line.match).toBe("PIECE");
      expect(line.matchedPieceNo).toBe(3);
      expect(line.pieces.map((p) => p.status)).toEqual(["RETURNED", "RETURNED", "AVAILABLE"]);
      expect(line.pieces[2].code).toBe("RAVI-002-03");
    });

    it("marks pieces already on a pending debit note with that note", async () => {
      prisma.purchaseSareeLine.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.code?.equals === "RAVI-001" ? [withPurchase(lineA)] : []));
      prisma.supplierReturnRequest.findMany.mockResolvedValue([
        { id: "RR-1", sareeLineId: "line-a", quantity: 1, pieceNos: [2], debitNoteId: "DN-1" },
      ]);

      const [line] = await service.lookupReturnable("RAVI-001");

      expect(line.match).toBe("LINE");
      expect(line.pieces[1]).toMatchObject({ status: "PENDING", debitNoteId: "DN-1" });
      expect(line.pieces.filter((p) => p.status === "AVAILABLE")).toHaveLength(7);
    });

    it("unwraps the QR tag URL down to the code", async () => {
      prisma.purchaseSareeLine.findMany.mockImplementation(({ where }: any) =>
        Promise.resolve(where.code?.equals === "RAVI-001" ? [withPurchase(lineA)] : []));

      const [line] = await service.lookupReturnable("https://app.example/scan?id=RAVI-001-04");

      expect(line.matchedPieceNo).toBe(4);
    });
  });
});
