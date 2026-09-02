import { notificationsStub } from "../common/testing/notifications.stub";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { WeaversService } from "./weavers.service";
import { Prisma } from "../generated/prisma/client";
import { CreateWeaverDto } from "./dto/create-weaver.dto";

describe("WeaversService", () => {
  let prisma: any;
  let auditLog: any;
  let idGenerator: any;
  let tx: any;
  let service: WeaversService;

  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError("db constraint", { code, clientVersion: "6" });

  const createDto = (overrides: Partial<CreateWeaverDto> = {}): CreateWeaverDto =>
    ({
      firstName: "Padma",
      lastName: "Devi",
      photoUrl: "https://example.test/p.jpg",
      email: "padma@example.test",
      phone: "9000000000",
      bankName: "State Bank of India",
      accountNo: "1234567890",
      ifsc: "SBIN0001234",
      ...overrides,
    });

  beforeEach(() => {
    // Callback form: remove() runs its deletes inside $transaction(async (tx) => …).
    tx = { user: { delete: jest.fn() }, weaver: { delete: jest.fn() } };
    prisma = {
      weaver: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: "w-1", name: "Padma Devi" }),
        update: jest.fn().mockResolvedValue({ id: "w-1" }),
        count: jest.fn().mockResolvedValue(0),
      },
      qcRecord: { findMany: jest.fn().mockResolvedValue([]) },
      finishingAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      batchSareeRow: {
        // Two different counts run now — active rows and the awaiting-QC
        // queue. Tests that care set them apart via mockImplementation on the
        // `where`; the shared default keeps the rest untouched.
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      materialIssueRecord: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation((arg: any) =>
        typeof arg === "function" ? arg(tx) : Promise.resolve([]),
      ),
    };
    auditLog = { recordAction: jest.fn() };
    idGenerator = { nextNamed: jest.fn().mockResolvedValue("Padma-001") };
    service = new WeaversService(prisma, auditLog, idGenerator, notificationsStub());
  });

  describe("getWeaverStats", () => {
    it("throws NotFoundException when the weaver doesn't exist", async () => {
      prisma.weaver.findUnique.mockResolvedValue(null);

      await expect(service.getWeaverStats("missing")).rejects.toThrow(NotFoundException);
    });

    it("computes qcPassRate as a percentage rounded to 1 decimal", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w1" });
      // 5 passed QC records across 7 distinct sarees -> 5/7 = 71.4285... -> 71.4
      prisma.qcRecord.findMany.mockResolvedValue([
        { weaverId: "w1", sareeId: "s1" },
        { weaverId: "w1", sareeId: "s2" },
        { weaverId: "w1", sareeId: "s3" },
        { weaverId: "w1", sareeId: "s4" },
        { weaverId: "w1", sareeId: "s5" },
      ]);
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "s6", batchSareeRow: { weaverId: "w1" } },
        { sareeId: "s7", batchSareeRow: { weaverId: "w1" } },
      ]);
      prisma.batchSareeRow.count.mockResolvedValue(2);
      prisma.materialIssueRecord.count.mockResolvedValue(3);

      const stats = await service.getWeaverStats("w1");

      expect(stats).toEqual({
        weaverId: "w1",
        totalSareesWoven: 7,
        qcPassCount: 5,
        qcPassRate: 71.4,
        activeBatchRowsCount: 2,
        awaitingQcCount: 2,
        materialIssueCount: 3,
        lastActivityAt: null,
      });
    });

    it("counts a re-inspected saree once, so the pass rate can't exceed 100%", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w1" });
      // s1 was inspected twice and passed both times. Counting the raw
      // QcRecord rows against a deduplicated saree total gave 3/2 = 150%.
      prisma.qcRecord.findMany.mockResolvedValue([
        { weaverId: "w1", sareeId: "s1" },
        { weaverId: "w1", sareeId: "s1" },
        { weaverId: "w1", sareeId: "s2" },
      ]);
      prisma.finishingAssignment.findMany.mockResolvedValue([]);
      prisma.batchSareeRow.count.mockResolvedValue(0);
      prisma.materialIssueRecord.count.mockResolvedValue(0);

      const stats = await service.getWeaverStats("w1");

      expect(stats.totalSareesWoven).toBe(2);
      expect(stats.qcPassCount).toBe(2);
      expect(stats.qcPassRate).toBe(100);
    });

    it("returns 0% qcPassRate (not NaN) when the weaver has zero sarees", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w1" });
      prisma.qcRecord.findMany.mockResolvedValue([]);
      prisma.finishingAssignment.findMany.mockResolvedValue([]);
      prisma.batchSareeRow.count.mockResolvedValue(0);
      prisma.materialIssueRecord.count.mockResolvedValue(0);

      const stats = await service.getWeaverStats("w1");

      expect(stats.qcPassRate).toBe(0);
    });
  });

  describe("getAllWeaverStats", () => {
    it("shapes each weaver from the grouped counts, defaulting missing groups to 0", async () => {
      prisma.weaver.findMany.mockResolvedValue([{ id: "w1" }, { id: "w2" }]);
      prisma.qcRecord.findMany.mockResolvedValue([
        { weaverId: "w1", sareeId: "s1", qcDate: new Date("2026-05-02") },
        { weaverId: "w1", sareeId: "s2", qcDate: new Date("2026-06-09") },
      ]);
      prisma.finishingAssignment.findMany.mockResolvedValue([]);
      prisma.batchSareeRow.groupBy
        // active rows
        .mockResolvedValueOnce([{ weaverId: "w1", _count: { _all: 4 } }])
        // awaiting QC
        .mockResolvedValueOnce([{ weaverId: "w2", _count: { _all: 3 } }])
        // last receipt
        .mockResolvedValueOnce([{ weaverId: "w1", _max: { receivedAt: null } }]);
      prisma.materialIssueRecord.groupBy.mockResolvedValue([{ weaverId: "w1", _count: { _all: 7 } }]);

      const [w1, w2] = await service.getAllWeaverStats();

      expect(w1).toEqual({
        weaverId: "w1",
        totalSareesWoven: 2,
        qcPassCount: 2,
        qcPassRate: 100,
        activeBatchRowsCount: 4,
        awaitingQcCount: 0,
        materialIssueCount: 7,
        lastActivityAt: new Date("2026-06-09").toISOString(),
      });
      // w2 produced nothing and appears in no count group but the awaiting one
      expect(w2).toEqual({
        weaverId: "w2",
        totalSareesWoven: 0,
        qcPassCount: 0,
        qcPassRate: 0,
        activeBatchRowsCount: 0,
        awaitingQcCount: 3,
        materialIssueCount: 0,
        lastActivityAt: null,
      });
    });

    it("returns an empty list without querying when there are no weavers", async () => {
      prisma.weaver.findMany.mockResolvedValue([]);

      await expect(service.getAllWeaverStats()).resolves.toEqual([]);
      expect(prisma.qcRecord.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getProductionSeries", () => {
    it("buckets output by month and keeps empty months on the axis", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-06-15"));
      prisma.qcRecord.findMany.mockResolvedValue([
        { sareeId: "s1", qcDate: new Date("2026-05-04") },
        // same saree inspected twice in one month — counted once
        { sareeId: "s1", qcDate: new Date("2026-05-20") },
        { sareeId: "s2", qcDate: new Date("2026-06-01") },
      ]);
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "s3", updatedAt: new Date("2026-06-02") },
      ]);

      const series = await service.getProductionSeries(3);

      expect(series).toEqual([
        { month: "2026-04", produced: 0, passed: 0 },
        { month: "2026-05", produced: 1, passed: 1 },
        // s2 passed QC, s3 only came back through finishing
        { month: "2026-06", produced: 2, passed: 1 },
      ]);
      jest.useRealTimers();
    });
  });

  describe("getLeaderboard", () => {
    const makeWeaver = (id: string) => ({
      id,
      name: id,
      initials: id,
      photoUrl: null,
      village: null,
    });

    // sareeCount PASSED qc records for `id`, generating distinct sarees s0..s{n-1}
    const qc = (weaverId: string, sareeCount: number) =>
      Array.from({ length: sareeCount }, (_, i) => ({
        weaverId,
        sareeId: `${weaverId}-s${i}`,
      }));

    it("ranks active weavers by qcPassRate desc, using total output as tiebreaker, capped at 10", async () => {
      prisma.weaver.findMany.mockResolvedValue([
        makeWeaver("low-rate-high-volume"),
        makeWeaver("tie-a"),
        makeWeaver("tie-b"),
        makeWeaver("zero-sarees"),
      ]);
      prisma.qcRecord.findMany.mockResolvedValue([
        ...qc("low-rate-high-volume", 50), // 50/100 produced -> 50%
        ...qc("tie-a", 10), // 100%, total 10
        ...qc("tie-b", 20), // 100%, total 20 -> should rank above tie-a
      ]);
      // extra non-QC-passed production for low-rate-high-volume, via returned finishing assignments
      prisma.finishingAssignment.findMany.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({
          sareeId: `low-rate-high-volume-extra${i}`,
          batchSareeRow: { weaverId: "low-rate-high-volume" },
        })),
      );

      const leaderboard = await service.getLeaderboard();

      expect(leaderboard.map((e) => e.weaverId)).toEqual([
        "tie-b",
        "tie-a",
        "low-rate-high-volume",
        "zero-sarees",
      ]);
      expect(leaderboard[0].qcPassRate).toBe(100);
      expect(leaderboard[3].qcPassRate).toBe(0);
    });

    it("only queries ACTIVE weavers and caps the result at 10 entries", async () => {
      prisma.weaver.findMany.mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => makeWeaver(`w${i}`)),
      );
      prisma.qcRecord.findMany.mockResolvedValue([]);
      prisma.finishingAssignment.findMany.mockResolvedValue([]);

      const leaderboard = await service.getLeaderboard();

      expect(prisma.weaver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "ACTIVE" } }),
      );
      expect(leaderboard).toHaveLength(10);
    });
  });

  /**
   * "Produced" means QC-passed OR returned through the Raise Quotation
   * finishing flow, deduplicated per saree. The two sources overlap constantly
   * — the same saree usually does both — and nothing in the schema enforces the
   * dedup, so it lives or dies by these tests. The cases above use disjoint
   * saree ids, which cannot tell a working dedup apart from a broken one.
   */
  describe("getWeaverStats — produced dedup", () => {
    it("counts a saree once when it both passed QC and came back from finishing", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w1" });
      prisma.qcRecord.findMany.mockResolvedValue([{ weaverId: "w1", sareeId: "s1" }]);
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "s1", batchSareeRow: { weaverId: "w1" } },
      ]);

      const stats = await service.getWeaverStats("w1");

      expect(stats.totalSareesWoven).toBe(1);
      expect(stats.qcPassRate).toBe(100);
    });

    it("counts a finishing-returned saree that never passed QC as produced", async () => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w1" });
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "s2", batchSareeRow: { weaverId: "w1" } },
      ]);

      const stats = await service.getWeaverStats("w1");

      // Produced but never QC-passed, so the pass rate is 0 — not 100.
      expect(stats.totalSareesWoven).toBe(1);
      expect(stats.qcPassCount).toBe(0);
      expect(stats.qcPassRate).toBe(0);
    });

    it("does no counting at all when the weaver doesn't exist", async () => {
      prisma.weaver.findUnique.mockResolvedValue(null);

      await expect(service.getWeaverStats("nope")).rejects.toThrow(NotFoundException);
      expect(prisma.qcRecord.findMany).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("composes the display name and allocates a DB-side code", async () => {
      await service.create(createDto());

      expect(idGenerator.nextNamed).toHaveBeenCalledWith("WEAVER", "Padma");
      expect(prisma.weaver.create.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ code: "Padma-001", name: "Padma Devi" }),
      );
    });

    it("defaults initials to the uppercased first name, capped at 10 characters", async () => {
      await service.create(createDto({ firstName: "Venkateshwarlu" }));

      expect(prisma.weaver.create.mock.calls[0][0].data.initials).toBe("VENKATESHW");
    });

    it("uppercases explicitly supplied initials rather than trusting the input", async () => {
      await service.create(createDto({ initials: "pd" }));

      expect(prisma.weaver.create.mock.calls[0][0].data.initials).toBe("PD");
    });

    it("defaults looms to 0 when not supplied", async () => {
      await service.create(createDto());

      expect(prisma.weaver.create.mock.calls[0][0].data.looms).toBe(0);
    });

    it("turns a duplicate-code race into a retryable conflict, not a 500", async () => {
      prisma.weaver.create.mockRejectedValue(prismaError("P2002"));

      await expect(service.create(createDto())).rejects.toThrow(ConflictException);
      expect(auditLog.recordAction).not.toHaveBeenCalled();
    });

    it("rethrows any other database error untouched", async () => {
      prisma.weaver.create.mockRejectedValue(prismaError("P1001"));

      await expect(service.create(createDto())).rejects.not.toBeInstanceOf(ConflictException);
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      prisma.weaver.findMany.mockResolvedValue([]);
    });

    it("searches name, both name parts, phone and email together", async () => {
      await service.findAll({ page: 1, pageSize: 10, search: "padma" });

      const or = prisma.weaver.findMany.mock.calls[0][0].where.OR;
      expect(or).toHaveLength(5);
      // Phone has no case to fold, so it alone is matched case-sensitively.
      expect(or).toEqual(expect.arrayContaining([{ phone: { contains: "padma" } }]));
    });

    it("omits the OR clause entirely when no search term is given", async () => {
      await service.findAll({ page: 1, pageSize: 10 });

      expect(prisma.weaver.findMany.mock.calls[0][0].where.OR).toBeUndefined();
    });

    it("pages from 1, not 0", async () => {
      await service.findAll({ page: 3, pageSize: 20 });

      expect(prisma.weaver.findMany.mock.calls[0][0]).toEqual(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      prisma.weaver.findUnique.mockResolvedValue({ id: "w-1", name: "Padma Devi", linkedUser: null });
    });

    it("deletes the linked WEAVER user account in the same transaction", async () => {
      prisma.weaver.findUnique.mockResolvedValue({
        id: "w-1",
        name: "Padma Devi",
        linkedUser: { id: "u-1" },
      });

      await service.remove("w-1");

      // Both sides go together — otherwise a login row is left pointing at nothing.
      expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "u-1" } });
      expect(tx.weaver.delete).toHaveBeenCalledWith({ where: { id: "w-1" } });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("deletes a weaver with no linked account without touching the user table", async () => {
      await service.remove("w-1");

      expect(tx.user.delete).not.toHaveBeenCalled();
      expect(tx.weaver.delete).toHaveBeenCalled();
    });

    it("explains that a weaver with existing records must be deactivated instead", async () => {
      prisma.$transaction.mockRejectedValue(prismaError("P2003"));

      await expect(service.remove("w-1")).rejects.toThrow(ConflictException);
      await expect(service.remove("w-1")).rejects.toThrow(/Deactivate them instead/);
      expect(auditLog.recordAction).not.toHaveBeenCalled();
    });

    it("404s on a weaver that doesn't exist", async () => {
      prisma.weaver.findUnique.mockResolvedValue(null);

      await expect(service.remove("nope")).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("getProductionLeaderboard", () => {
    const listed = (id: string) => ({ id, name: id, initials: "XX", photoUrl: "", village: null });

    it("only counts work inside the trailing window", async () => {
      await service.getProductionLeaderboard(3);

      const cutoff = prisma.qcRecord.findMany.mock.calls[0][0].where.qcDate.gte as Date;
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 3);
      expect(Math.abs(cutoff.getTime() - expected.getTime())).toBeLessThan(60_000);
    });

    it("ranks by output volume, highest first", async () => {
      prisma.qcRecord.findMany.mockResolvedValue([
        { weaverId: "w-1", sareeId: "s1" },
        { weaverId: "w-2", sareeId: "s2" },
        { weaverId: "w-2", sareeId: "s3" },
      ]);
      prisma.weaver.findMany.mockResolvedValue([listed("w-1"), listed("w-2")]);

      const board = await service.getProductionLeaderboard();

      expect(board.map((e) => e.weaverId)).toEqual(["w-2", "w-1"]);
      expect(board[0].sareesProduced).toBe(2);
    });

    it("caps the list at five weavers", async () => {
      prisma.qcRecord.findMany.mockResolvedValue(
        Array.from({ length: 8 }, (_, i) => ({ weaverId: `w-${i}`, sareeId: `s${i}` })),
      );
      prisma.weaver.findMany.mockResolvedValue(
        Array.from({ length: 8 }, (_, i) => listed(`w-${i}`)),
      );

      await expect(service.getProductionLeaderboard()).resolves.toHaveLength(5);
    });

    it("deduplicates a saree counted through both QC and finishing", async () => {
      prisma.qcRecord.findMany.mockResolvedValue([{ weaverId: "w-1", sareeId: "s1" }]);
      prisma.finishingAssignment.findMany.mockResolvedValue([
        { sareeId: "s1", batchSareeRow: { weaverId: "w-1" } },
      ]);
      prisma.weaver.findMany.mockResolvedValue([listed("w-1")]);

      const board = await service.getProductionLeaderboard();

      expect(board[0].sareesProduced).toBe(1);
    });

    it("skips the weaver lookup entirely when nothing was produced", async () => {
      await expect(service.getProductionLeaderboard()).resolves.toEqual([]);
      expect(prisma.weaver.findMany).not.toHaveBeenCalled();
    });

    it("drops a ranked id that no longer resolves to a weaver row", async () => {
      prisma.qcRecord.findMany.mockResolvedValue([{ weaverId: "deleted-weaver", sareeId: "s1" }]);
      prisma.weaver.findMany.mockResolvedValue([]);

      // Without the filter this would dereference an absent map entry.
      await expect(service.getProductionLeaderboard()).resolves.toEqual([]);
    });
  });
});
