import { ConflictException, NotFoundException } from "@nestjs/common";
import { normaliseCode, SareePhotosService } from "./saree-photos.service";

describe("SareePhotosService", () => {
  let prisma: any;
  let auditLog: { recordAction: jest.Mock };
  let service: SareePhotosService;

  const wovenRow = (over: Record<string, unknown> = {}) => ({
    sareeId: "RAVI-L1-B12-003",
    batchId: "B-12",
    recipientType: "WEAVER",
    receivedAt: new Date("2026-09-01"),
    receivedColor: "Maroon",
    receivedWeight: "650.00",
    receivedPhotoUrl: null,
    qcPassed: true,
    weaver: { firstName: "Ravi", lastName: "Kumar" },
    factoryLoom: null,
    design: { code: "D-101", name: "Peacock Border" },
    sareeType: { type: "Pure Silk" },
    qcRecords: [],
    ...over,
  });

  const purchaseLine = (over: Record<string, unknown> = {}) => ({
    id: "line-1",
    code: "SABO-3850-001",
    quantity: 3,
    returnedQuantity: 0,
    returnedPieceNos: [],
    pieceImageUrls: [],
    imageUrl: "/uploads/photos/line.jpg",
    sareeType: "Kanchi",
    color: "Green",
    weight: "700g",
    purchase: {
      id: "EXT-2026-001",
      date: new Date("2026-08-20"),
      invoiceNumber: "3850",
      supplierName: null,
      supplier: { name: "Sabo Silks" },
    },
    ...over,
  });

  beforeEach(() => {
    prisma = {
      batchSareeRow: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      purchaseSareeLine: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    auditLog = { recordAction: jest.fn().mockResolvedValue({}) };
    service = new SareePhotosService(prisma, auditLog as any);
  });

  describe("lookup", () => {
    it("returns a woven saree's details with no photo when none exists", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(wovenRow());

      const r = await service.lookup("RAVI-L1-B12-003");

      expect(r).toMatchObject({
        sareeId: "RAVI-L1-B12-003",
        origin: "production",
        stage: "QC passed",
        designName: "Peacock Border",
        weightG: 650,
        maker: { kind: "weaver", label: "Ravi Kumar" },
        photo: null,
      });
    });

    it("falls back to the latest QC photo, and prefers the saree's own photo over it", async () => {
      const qcRecords = [{ result: "PASSED", qcDate: new Date("2026-09-02"), photoUrl: "/uploads/photos/qc.jpg" }];
      prisma.batchSareeRow.findUnique.mockResolvedValueOnce(wovenRow({ qcRecords }));
      expect((await service.lookup("RAVI-L1-B12-003")).photo).toEqual({ url: "/uploads/photos/qc.jpg", source: "qc" });

      prisma.batchSareeRow.findUnique.mockResolvedValueOnce(wovenRow({ qcRecords, receivedPhotoUrl: "/uploads/photos/own.jpg" }));
      expect((await service.lookup("RAVI-L1-B12-003")).photo).toEqual({ url: "/uploads/photos/own.jpg", source: "inventory" });
    });

    it("matches a hand-typed code case-insensitively", async () => {
      prisma.batchSareeRow.findFirst.mockResolvedValue(wovenRow());

      const r = await service.lookup("ravi-l1-b12-003");

      expect(prisma.batchSareeRow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sareeId: { equals: "ravi-l1-b12-003", mode: "insensitive" } } }),
      );
      expect(r.sareeId).toBe("RAVI-L1-B12-003");
    });

    it("resolves a purchased piece by its line code plus piece number, without borrowing the line photo", async () => {
      prisma.purchaseSareeLine.findMany.mockResolvedValue([purchaseLine()]);

      const r = await service.lookup("sabo-3850-001-02");

      expect(r).toMatchObject({
        sareeId: "SABO-3850-001-02",
        origin: "external",
        stage: "Purchased stock",
        weightG: 700,
        purchase: { supplier: "Sabo Silks", pieceNo: 2, lineQuantity: 3, linePhotoUrl: "/uploads/photos/line.jpg" },
        photo: null,
      });
    });

    it("reads a scanned QR URL down to its code", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(wovenRow());
      await service.lookup("https://erp.example.com/s?id=RAVI-L1-B12-003");
      expect(prisma.batchSareeRow.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sareeId: "RAVI-L1-B12-003" } }),
      );
    });

    it("rejects a piece number beyond the line's quantity", async () => {
      prisma.purchaseSareeLine.findMany.mockResolvedValue([purchaseLine()]);
      await expect(service.lookup("SABO-3850-001-04")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuses to guess between two purchase lines sharing a code", async () => {
      prisma.purchaseSareeLine.findMany.mockResolvedValue([purchaseLine(), purchaseLine({ id: "line-2" })]);
      await expect(service.lookup("SABO-3850-001-01")).rejects.toBeInstanceOf(ConflictException);
    });

    it("reports an unknown code as not found", async () => {
      await expect(service.lookup("NOPE")).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.lookup("   ")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("setPhoto", () => {
    it("writes a woven saree's photo to its batch row and audits it", async () => {
      prisma.batchSareeRow.findUnique
        .mockResolvedValueOnce(wovenRow())
        .mockResolvedValueOnce(wovenRow({ receivedPhotoUrl: "/uploads/photos/new.jpg" }));

      const r = await service.setPhoto("RAVI-L1-B12-003", "/uploads/photos/new.jpg", "user-1");

      expect(prisma.batchSareeRow.update).toHaveBeenCalledWith({
        where: { sareeId: "RAVI-L1-B12-003" },
        data: { receivedPhotoUrl: "/uploads/photos/new.jpg" },
      });
      expect(auditLog.recordAction).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: "user-1", action: "Added a photo for saree RAVI-L1-B12-003", newValue: "/uploads/photos/new.jpg" }),
      );
      expect(r.photo).toEqual({ url: "/uploads/photos/new.jpg", source: "inventory" });
    });

    it("sets only the scanned piece's slot, padding the array and keeping the other pieces' photos", async () => {
      prisma.purchaseSareeLine.findMany.mockResolvedValue([purchaseLine()]);
      prisma.purchaseSareeLine.findUniqueOrThrow.mockResolvedValue({ pieceImageUrls: ["/uploads/photos/p1.jpg"], quantity: 3 });

      await service.setPhoto("SABO-3850-001-03", "/uploads/photos/p3.jpg", "user-1");

      expect(prisma.purchaseSareeLine.update).toHaveBeenCalledWith({
        where: { id: "line-1" },
        data: { pieceImageUrls: ["/uploads/photos/p1.jpg", "", "/uploads/photos/p3.jpg"] },
      });
    });

    it("records a replacement as a replacement, without logging a legacy base64 photo", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(wovenRow({ receivedPhotoUrl: "data:image/jpeg;base64,AAAA" }));

      await service.setPhoto("RAVI-L1-B12-003", "/uploads/photos/new.jpg");

      expect(auditLog.recordAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: "Replaced the photo of saree RAVI-L1-B12-003", oldValue: null }),
      );
    });
  });

  it("normaliseCode tolerates stray percent signs and whitespace", () => {
    expect(normaliseCode("  ABC-01 ")).toBe("ABC-01");
    expect(normaliseCode("AB%C")).toBe("AB%C");
  });
});
