import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { BatchesService } from "./batches.service";
import { BatchStatus, QcResult, RecipientType } from "../generated/prisma/client";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";

/**
 * BatchesService owns the production batch lifecycle: draft -> assigned rows
 * -> received from the weaver -> tallied -> finalized, plus the cascade delete.
 *
 * Three things here are load-bearing well beyond this file:
 *
 *  - the `weaverId` scoping on findAll/findOne is the only thing stopping a
 *    WEAVER token from reading another weaver's batch;
 *  - the generated sareeId format is parsed back out elsewhere (PaymentsService
 *    recovers a weaver's loom from it with /-L(\d+)-B/), so a format change
 *    silently breaks loom attribution on the payments summary rather than
 *    failing anywhere near here;
 *  - assignRow and assignRows build that id through two separate code paths,
 *    so they are pinned against each other.
 */
describe("BatchesService", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: BatchesService;

  const row = (overrides: Record<string, unknown> = {}) => ({
    serial: 1,
    batchId: "BATCH-0007",
    sareeId: "RAMESH-L1-B0007-001",
    weaverId: "w-1",
    receivedAt: null,
    qcRecords: [],
    ...overrides,
  });

  const batch = (overrides: Record<string, unknown> = {}) => ({
    id: "BATCH-0007",
    status: BatchStatus.DRAFT,
    totalCount: 2,
    rows: [row(), row({ serial: 2, sareeId: "RAMESH-L1-B0007-002" })],
    ...overrides,
  });

  const assignDto = (overrides: Partial<AssignBatchRowDto> = {}): AssignBatchRowDto => ({
    recipientType: RecipientType.WEAVER,
    weaverId: "w-1",
    sareeTypeCode: "SILK",
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      batch: {
        create: jest.fn().mockResolvedValue(batch()),
        findUnique: jest.fn().mockResolvedValue(batch()),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue(batch({ status: BatchStatus.ACTIVE })),
        delete: jest.fn(),
      },
      batchSareeRow: {
        findUnique: jest.fn().mockResolvedValue(row()),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...row(), ...data })),
      },
      designLibrary: { findUnique: jest.fn().mockResolvedValue({ code: "BKB-045" }), findMany: jest.fn().mockResolvedValue([]) },
      bulkOrder: { findUnique: jest.fn().mockResolvedValue({ ref: "BO-01" }), findMany: jest.fn().mockResolvedValue([]) },
      sareeTypeRate: {
        findUnique: jest.fn().mockResolvedValue({ code: "SILK" }),
        findMany: jest.fn().mockResolvedValue([{ code: "SILK" }]),
      },
      weaver: {
        findUnique: jest.fn().mockResolvedValue({ id: "w-1", firstName: "Ramesh", lastName: "Kumar" }),
        findMany: jest.fn().mockResolvedValue([{ id: "w-1", firstName: "Ramesh", lastName: "Kumar" }]),
      },
      factoryLoom: {
        findUnique: jest.fn().mockResolvedValue({ id: "fl-1", loomNumber: "FL-12" }),
        findMany: jest.fn().mockResolvedValue([{ id: "fl-1", loomNumber: "FL-12" }]),
      },
      finishingAssignment: { deleteMany: jest.fn() },
      qcRecord: { deleteMany: jest.fn() },
      materialIssueRecord: { deleteMany: jest.fn() },
      materialReturnRecord: { deleteMany: jest.fn() },
      inventoryRecord: { deleteMany: jest.fn() },
      saree: { deleteMany: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    idGenerator = { nextFormatted: jest.fn().mockResolvedValue("BATCH-0007") };
    auditLog = { recordAction: jest.fn() };
    service = new BatchesService(prisma, idGenerator, auditLog);
  });

  describe("create", () => {
    it("seeds one unassigned row per saree in the batch", async () => {
      await service.create({ totalCount: 3, dueDate: "2026-09-01" });

      const data = prisma.batch.create.mock.calls[0][0].data;
      expect(data.rows.create).toEqual([{ serial: 1 }, { serial: 2 }, { serial: 3 }]);
      expect(data.id).toBe("BATCH-0007");
    });
  });

  describe("weaver scoping", () => {
    it("restricts a weaver's list to batches holding at least one of their rows", async () => {
      await service.findAll({ page: 1, pageSize: 10 }, "w-9");

      expect(prisma.batch.findMany.mock.calls[0][0].where).toEqual(
        expect.objectContaining({ rows: { some: { weaverId: "w-9" } } }),
      );
    });

    it("does not scope the list for a non-weaver caller", async () => {
      await service.findAll({ page: 1, pageSize: 10 });

      expect(prisma.batch.findMany.mock.calls[0][0].where.rows).toBeUndefined();
    });

    it("hides a batch with none of the weaver's rows behind a 404, not a 403", async () => {
      // A 403 would confirm the batch exists; NotFound leaks nothing.
      await expect(service.findOne("BATCH-0007", "w-OTHER")).rejects.toThrow(NotFoundException);
    });

    it("returns the batch when one of its rows belongs to the weaver", async () => {
      await expect(service.findOne("BATCH-0007", "w-1")).resolves.toMatchObject({ id: "BATCH-0007" });
    });
  });

  describe("assignRow recipient validation", () => {
    it("rejects a WEAVER row that also carries a factoryLoomId", async () => {
      await expect(
        service.assignRow("BATCH-0007", 1, assignDto({ factoryLoomId: "fl-1" })),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.batchSareeRow.update).not.toHaveBeenCalled();
    });

    it("rejects a WEAVER row with no weaverId", async () => {
      await expect(
        service.assignRow("BATCH-0007", 1, assignDto({ weaverId: undefined })),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects a FACTORY_LOOM row that also carries a weaverId", async () => {
      await expect(
        service.assignRow(
          "BATCH-0007",
          1,
          assignDto({ recipientType: RecipientType.FACTORY_LOOM, factoryLoomId: "fl-1" }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("assignRow foreign keys", () => {
    it("normalises an empty designCode to null instead of writing it as a broken FK", async () => {
      await service.assignRow("BATCH-0007", 1, assignDto({ designCode: "", bulkOrderRef: "" }));

      // An empty string would trip the DB constraint and surface as an opaque 500.
      expect(prisma.designLibrary.findUnique).not.toHaveBeenCalled();
      expect(prisma.batchSareeRow.update.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ designCode: null, bulkOrderRef: null }),
      );
    });

    it("404s on a design code that isn't in the library", async () => {
      prisma.designLibrary.findUnique.mockResolvedValue(null);

      await expect(
        service.assignRow("BATCH-0007", 1, assignDto({ designCode: "GHOST" })),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.batchSareeRow.update).not.toHaveBeenCalled();
    });

    it("404s on an unknown saree type", async () => {
      prisma.sareeTypeRate.findUnique.mockResolvedValue(null);

      await expect(service.assignRow("BATCH-0007", 1, assignDto())).rejects.toThrow(NotFoundException);
    });
  });

  describe("generated sareeId", () => {
    it("builds a weaver id as FIRSTNAME-L{loom}-B{batchSeq}-{serial}", async () => {
      await service.assignRow("BATCH-0007", 4, assignDto({ loomNumber: 3 }));

      expect(prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId).toBe("RAMESH-L3-B0007-004");
    });

    it("defaults a weaver row with no loomNumber to loom 1", async () => {
      await service.assignRow("BATCH-0007", 1, assignDto());

      expect(prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId).toBe("RAMESH-L1-B0007-001");
    });

    it("keeps the -L{n}-B marker PaymentsService parses looms back out of", async () => {
      await service.assignRow("BATCH-0007", 2, assignDto({ loomNumber: 7 }));

      const sareeId = prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId;
      expect(sareeId.match(/-L(\d+)-B/)?.[1]).toBe("7");
    });

    it("builds a factory-loom id from the loom number, with no -L segment", async () => {
      await service.assignRow(
        "BATCH-0007",
        5,
        assignDto({ recipientType: RecipientType.FACTORY_LOOM, weaverId: undefined, factoryLoomId: "fl-1" }),
      );

      expect(prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId).toBe("FL-12-B0007-005");
    });

    it("agrees with the bulk assignRows path for the same input", async () => {
      await service.assignRow("BATCH-0007", 2, assignDto({ loomNumber: 3 }));
      const single = prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId;
      prisma.batchSareeRow.update.mockClear();

      await service.assignRows("BATCH-0007", {
        rows: [{ serial: 2, recipientType: RecipientType.WEAVER, weaverId: "w-1", sareeTypeCode: "SILK", loomNumber: 3 }],
      });
      const bulk = prisma.batchSareeRow.update.mock.calls[0][0].data.sareeId;

      // Two independent implementations of the same format — they must not drift.
      expect(bulk).toBe(single);
    });
  });

  describe("assignRows", () => {
    it("applies every row in one transaction rather than row-by-row", async () => {
      await service.assignRows("BATCH-0007", {
        rows: [
          { serial: 1, recipientType: RecipientType.WEAVER, weaverId: "w-1", sareeTypeCode: "SILK" },
          { serial: 2, recipientType: RecipientType.WEAVER, weaverId: "w-1", sareeTypeCode: "SILK" },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
    });

    it("rejects the whole request when one row names a serial the batch lacks", async () => {
      await expect(
        service.assignRows("BATCH-0007", {
          rows: [{ serial: 99, recipientType: RecipientType.WEAVER, weaverId: "w-1", sareeTypeCode: "SILK" }],
        } as any),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("names the offending serial when a row fails validation", async () => {
      await expect(
        service.assignRows("BATCH-0007", {
          rows: [{ serial: 2, recipientType: RecipientType.WEAVER, sareeTypeCode: "SILK" }],
        } as any),
      ).rejects.toThrow(/Row 2/);
    });
  });

  describe("receiveRow", () => {
    it("refuses a row that was never assigned", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ sareeId: null }));

      await expect(service.receiveRow("BATCH-0007", 1, { weight: 800 } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("refuses a second receipt while the first is still standing", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ receivedAt: new Date("2026-02-01") }));

      await expect(service.receiveRow("BATCH-0007", 1, { weight: 800 } as any)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.batchSareeRow.update).not.toHaveBeenCalled();
    });

    it("refuses to re-receive a saree that already passed QC", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(
        row({ receivedAt: null, qcRecords: [{ result: QcResult.PASSED }] }),
      );

      await expect(service.receiveRow("BATCH-0007", 1, { weight: 800 } as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it("accepts the rework receipt after a SEMI verdict and clears qcPassed", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(
        row({ receivedAt: null, qcPassed: false, qcRecords: [{ result: QcResult.SEMI }] }),
      );

      await service.receiveRow("BATCH-0007", 1, { weight: 820 });

      // qcPassed back to null is what puts the reworked saree in the QC queue again.
      expect(prisma.batchSareeRow.update.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ receivedWeight: 820, qcPassed: null }),
      );
    });
  });

  describe("tallyRow", () => {
    it("refuses to tally a saree that hasn't been received", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ receivedAt: null }));

      await expect(
        service.tallyRow("BATCH-0007", 1, { tallied: true } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("applies only the corrected fields, leaving the others untouched", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ receivedAt: new Date() }));

      await service.tallyRow("BATCH-0007", 1, { tallied: true, warpG: 310 });

      const data = prisma.batchSareeRow.update.mock.calls[0][0].data;
      expect(data.receivedWarpG).toBe(310);
      // A partial correction must not clobber the weights it didn't mention.
      expect(data).not.toHaveProperty("receivedWeight");
      expect(data).not.toHaveProperty("receivedReshamG");
    });

    it("clears the tally attribution when a row is un-tallied", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ receivedAt: new Date() }));

      await service.tallyRow("BATCH-0007", 1, { tallied: false, talliedBy: "admin" });

      const data = prisma.batchSareeRow.update.mock.calls[0][0].data;
      expect(data).toEqual(expect.objectContaining({ tallied: false, talliedBy: null, talliedAt: null }));
    });

    it("notes a weight correction in the audit trail", async () => {
      prisma.batchSareeRow.findUnique.mockResolvedValue(row({ receivedAt: new Date() }));

      await service.tallyRow("BATCH-0007", 1, { tallied: true, weight: 815 });

      expect(auditLog.recordAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: expect.stringContaining("weight/material corrected") }),
      );
    });
  });

  describe("finalize", () => {
    it("moves a DRAFT batch to ACTIVE", async () => {
      await service.finalize("BATCH-0007");

      expect(prisma.batch.update.mock.calls[0][0].data).toEqual({ status: BatchStatus.ACTIVE });
    });

    it("refuses to finalize a batch that is no longer a draft", async () => {
      prisma.batch.findUnique.mockResolvedValue(batch({ status: BatchStatus.ACTIVE }));

      await expect(service.finalize("BATCH-0007")).rejects.toThrow(BadRequestException);
      expect(prisma.batch.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("clears every dependent record and the batch in a single transaction", async () => {
      await service.remove("BATCH-0007");

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // Restrict FKs mean a partial delete would strand orphans — all of these
      // must be in the same atomic list as the batch delete itself.
      expect(prisma.finishingAssignment.deleteMany).toHaveBeenCalled();
      expect(prisma.qcRecord.deleteMany).toHaveBeenCalled();
      expect(prisma.materialIssueRecord.deleteMany).toHaveBeenCalled();
      expect(prisma.materialReturnRecord.deleteMany).toHaveBeenCalled();
      expect(prisma.inventoryRecord.deleteMany).toHaveBeenCalled();
      expect(prisma.saree.deleteMany).toHaveBeenCalled();
      expect(prisma.batch.delete).toHaveBeenCalledWith({ where: { id: "BATCH-0007" } });
    });

    it("ignores unassigned rows when collecting saree ids to delete", async () => {
      prisma.batch.findUnique.mockResolvedValue({
        id: "BATCH-0007",
        rows: [{ sareeId: "RAMESH-L1-B0007-001" }, { sareeId: null }],
      });

      await service.remove("BATCH-0007");

      expect(prisma.finishingAssignment.deleteMany).toHaveBeenCalledWith({
        where: { sareeId: { in: ["RAMESH-L1-B0007-001"] } },
      });
    });

    it("404s on a batch that doesn't exist rather than running an empty delete", async () => {
      prisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.remove("BATCH-NOPE")).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
