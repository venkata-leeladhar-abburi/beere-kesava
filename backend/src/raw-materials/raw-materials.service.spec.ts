import { NotFoundException } from "@nestjs/common";
import { RawMaterialsService } from "./raw-materials.service";
import { MaterialType } from "../generated/prisma/client";

describe("RawMaterialsService.createGrn", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: RawMaterialsService;
  let tx: any;

  beforeEach(() => {
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("GRN-RaviTextiles-001") };
    auditLog = { recordAction: jest.fn() };

    tx = {
      grnReceipt: { create: jest.fn() },
      rawMaterialStock: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    prisma = {
      vendor: { findUnique: jest.fn().mockResolvedValue({ id: "vendor-1", name: "Ravi Textiles", code: "RaviTextiles-001" }) },
      $transaction: jest.fn().mockImplementation((fn: any) => fn(tx)),
    };

    service = new RawMaterialsService(prisma, idGenerator, auditLog);
  });

  it("adds only the accepted quantity (quantity - rejectedQuantity) to existing stock, not the full received quantity", async () => {
    tx.grnReceipt.create.mockResolvedValue({
      id: "GRN-2026-0001",
      items: [],
    });
    tx.rawMaterialStock.findFirst.mockResolvedValue({ id: "stock-1", unit: "KG", currentStock: 0 });

    await service.createGrn({
      supplierName: "Acme Yarns",
      vendorId: "vendor-1",
      items: [
        {
          materialType: MaterialType.WARP,
          name: "Cotton Yarn",
          quantity: 100,
          unitPrice: 50,
          rejectedQuantity: 12,
        },
      ],
    });

    expect(tx.rawMaterialStock.update).toHaveBeenCalledWith({
      where: { id: "stock-1" },
      data: { currentStock: 88 }, // 100 - 12, converted through grams and back at the same KG unit
    });
    expect(tx.rawMaterialStock.create).not.toHaveBeenCalled();
  });

  it("treats a missing rejectedQuantity as 0 and adds the full quantity", async () => {
    tx.grnReceipt.create.mockResolvedValue({ id: "GRN-2026-0002", items: [] });
    tx.rawMaterialStock.findFirst.mockResolvedValue({ id: "stock-2", unit: "KG", currentStock: 0 });

    await service.createGrn({
      supplierName: "Acme Yarns",
      vendorId: "vendor-1",
      items: [{ materialType: MaterialType.WARP, name: "Silk Yarn", quantity: 50, unitPrice: 80 }],
    });

    expect(tx.rawMaterialStock.update).toHaveBeenCalledWith({
      where: { id: "stock-2" },
      data: { currentStock: 50 },
    });
  });

  it("creates a new stock row with currentStock = accepted quantity when no matching stock exists yet", async () => {
    tx.grnReceipt.create.mockResolvedValue({ id: "GRN-2026-0003", items: [] });
    tx.rawMaterialStock.findFirst.mockResolvedValue(null);

    await service.createGrn({
      supplierName: "New Vendor",
      vendorId: "vendor-1",
      items: [
        {
          materialType: MaterialType.RESHAM,
          name: "Red Dye",
          grade: "A",
          color: "Red",
          quantity: 30,
          unitPrice: 20,
          rejectedQuantity: 5,
        },
      ],
    });

    expect(tx.rawMaterialStock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        materialType: MaterialType.RESHAM,
        name: "Red Dye",
        grade: "A",
        color: "Red",
        currentStock: 25, // 30 - 5
        vendorId: "vendor-1",
      }),
    });
  });

  it("computes each GRN item's totalPrice as quantity * unitPrice and records the audit action", async () => {
    tx.grnReceipt.create.mockResolvedValue({ id: "GRN-2026-0004", items: [] });
    tx.rawMaterialStock.findFirst.mockResolvedValue({ id: "stock-4", unit: "KG", currentStock: 0 });

    await service.createGrn({
      supplierName: "Acme Yarns",
      vendorId: "vendor-1",
      actorId: "user-1",
      items: [{ materialType: MaterialType.WARP, name: "Cotton", quantity: 10, unitPrice: 25 }],
    });

    expect(tx.grnReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [expect.objectContaining({ quantity: 10, unitPrice: 25, totalPrice: 250 })],
          },
        }),
      }),
    );
    expect(auditLog.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "user-1", module: "MATERIALS" }),
    );
  });

  it("rejects an unknown vendorId before touching stock, since vendor is now mandatory on a GRN", async () => {
    prisma.vendor.findUnique.mockResolvedValue(null);

    await expect(
      service.createGrn({
        supplierName: "Acme Yarns",
        vendorId: "missing-vendor",
        items: [{ materialType: MaterialType.WARP, name: "Cotton", quantity: 10, unitPrice: 25 }],
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
