import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DispatchService } from "./dispatch.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { DispatchType } from "../generated/prisma/client";

/**
 * The shop-dispatch path: a saree that went straight from QC to the shop has no
 * InventoryRecord (only finishing/quotations/sales write one), and requiring
 * one here made every such dispatch 404 with nothing shown to the operator.
 */
describe("DispatchService.create — sarees with no InventoryRecord yet", () => {
  let prisma: any;
  let service: DispatchService;

  const dto = (overrides: Partial<CreateDispatchDto> = {}): CreateDispatchDto => ({
    type: DispatchType.SHOP,
    sareeIds: ["RAMARAO-L1-001"],
    lrNumber: "LR-77",
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn() },
      inventoryRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      batchSareeRow: { findMany: jest.fn() },
      dispatchRecord: {
        create: jest.fn().mockResolvedValue({ id: "d1" }),
        findUnique: jest.fn().mockResolvedValue({ id: "d1", sarees: [] }),
      },
      dispatchSaree: { createMany: jest.fn() },
    };
    service = new DispatchService(prisma, { recordAction: jest.fn() } as any, {
      nextScoped: jest.fn().mockResolvedValue("DC-2627-001"),
    } as any);
  });

  it("opens an inventory row on demand for a QC-passed saree instead of 404ing", async () => {
    prisma.batchSareeRow.findMany.mockResolvedValue([
      { sareeId: "RAMARAO-L1-001", batchId: "b1", bulkOrderRef: null, qcPassed: true },
    ]);

    await service.create(dto());

    expect(prisma.inventoryRecord.createMany).toHaveBeenCalledWith({
      data: [
        {
          sareeId: "RAMARAO-L1-001",
          status: "QC_PASSED",
          rawType: "READY_SAREE",
          batchId: "b1",
          bulkOrderRef: null,
        },
      ],
      skipDuplicates: true,
    });
    expect(prisma.dispatchRecord.create).toHaveBeenCalled();
    expect(prisma.inventoryRecord.updateMany).toHaveBeenCalledWith({
      where: { sareeId: { in: ["RAMARAO-L1-001"] } },
      data: { status: "DISPATCHED" },
    });
  });

  it("still rejects a saree that was never woven", async () => {
    prisma.batchSareeRow.findMany.mockResolvedValue([]);

    await expect(service.create(dto())).rejects.toThrow(NotFoundException);
    expect(prisma.dispatchRecord.create).not.toHaveBeenCalled();
  });

  it("rejects a woven saree that has not passed QC", async () => {
    prisma.batchSareeRow.findMany.mockResolvedValue([
      { sareeId: "RAMARAO-L1-001", batchId: "b1", bulkOrderRef: null, qcPassed: false },
    ]);

    await expect(service.create(dto())).rejects.toThrow(BadRequestException);
    expect(prisma.dispatchRecord.create).not.toHaveBeenCalled();
  });

  it("still blocks a saree whose inventory row says it has already gone", async () => {
    prisma.inventoryRecord.findMany.mockResolvedValue([
      { sareeId: "RAMARAO-L1-001", status: "DISPATCHED" },
    ]);

    await expect(service.create(dto())).rejects.toThrow(BadRequestException);
    expect(prisma.batchSareeRow.findMany).not.toHaveBeenCalled();
  });

  it("stamps the dispatch with the date entered on the form", async () => {
    prisma.inventoryRecord.findMany.mockResolvedValue([
      { sareeId: "RAMARAO-L1-001", status: "FINISHING_COMPLETE" },
    ]);

    await service.create(dto({ dispatchDate: "2026-08-21" }));

    expect(prisma.dispatchRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ dispatchDate: new Date("2026-08-21") }),
    });
  });
});

/**
 * Undoing a dispatch must put the saree back where it actually was. A saree
 * dispatched straight from QC never entered finishing, so reverting it to
 * FINISHING_COMPLETE invented a step it had not been through.
 */
describe("DispatchService.remove — reverting inventory status", () => {
  let prisma: any;
  let service: DispatchService;

  beforeEach(() => {
    prisma = {
      dispatchRecord: {
        findUnique: jest.fn().mockResolvedValue({
          id: "d1",
          lrNumber: "LR-1",
          invoiceNumber: null,
          quotationRef: null,
          sarees: [{ sareeId: "QC-ONLY-1" }, { sareeId: "FINISHED-1" }],
        }),
        delete: jest.fn(),
      },
      finishingAssignment: {
        findMany: jest.fn().mockResolvedValue([{ sareeId: "FINISHED-1" }]),
      },
      inventoryRecord: { updateMany: jest.fn() },
      quotation: { update: jest.fn() },
    };
    service = new DispatchService(prisma, { recordAction: jest.fn() } as any, {} as any);
  });

  it("sends a finished saree back to FINISHING_COMPLETE and a QC-only saree back to QC_PASSED", async () => {
    await service.remove("d1", "actor");

    expect(prisma.inventoryRecord.updateMany).toHaveBeenCalledWith({
      where: { sareeId: { in: ["FINISHED-1"] } },
      data: { status: "FINISHING_COMPLETE" },
    });
    expect(prisma.inventoryRecord.updateMany).toHaveBeenCalledWith({
      where: { sareeId: { in: ["QC-ONLY-1"] } },
      data: { status: "QC_PASSED" },
    });
  });
});

/**
 * A shop dispatch raises a Delivery Challan, not a tax invoice — so it gets a
 * DC-<FY>-NNN allocated server-side, and never an invoice number.
 */
describe("DispatchService.create — challan numbering", () => {
  let prisma: any;
  let idGenerator: any;
  let service: DispatchService;

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ code: "Sree", name: "Sree Kesava" }) },
      inventoryRecord: {
        findMany: jest.fn().mockResolvedValue([{ sareeId: "S-1", status: "FINISHING_COMPLETE" }]),
        createMany: jest.fn(),
        updateMany: jest.fn(),
      },
      batchSareeRow: { findMany: jest.fn().mockResolvedValue([]) },
      dispatchRecord: {
        create: jest.fn().mockResolvedValue({ id: "d1" }),
        findUnique: jest.fn().mockResolvedValue({ id: "d1", sarees: [] }),
      },
      dispatchSaree: { createMany: jest.fn() },
    };
    idGenerator = { nextScoped: jest.fn().mockResolvedValue("DC-2627-001") };
    service = new DispatchService(prisma, { recordAction: jest.fn() } as any, idGenerator);
  });

  it("allocates a DC number scoped to the financial year for a shop dispatch", async () => {
    await service.create({ type: DispatchType.SHOP, sareeIds: ["S-1"] });

    expect(idGenerator.nextScoped).toHaveBeenCalledWith("DC", expect.stringMatching(/^\d{4}$/));
    expect(prisma.dispatchRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ challanNumber: "DC-2627-001", invoiceNumber: undefined }),
    });
  });

  it("gives a wholesale dispatch an invoice number and no challan number", async () => {
    idGenerator.nextScoped.mockResolvedValue("INV-Sree-001");

    await service.create({
      type: DispatchType.WHOLESALE,
      sareeIds: ["S-1"],
      customerId: "c1",
      raiseInvoice: true,
    });

    expect(prisma.dispatchRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ invoiceNumber: "INV-Sree-001", challanNumber: undefined }),
    });
  });
});

