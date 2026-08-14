import { NotFoundException } from "@nestjs/common";
import { WeaversService } from "./weavers.service";

describe("WeaversService", () => {
  let prisma: any;
  let auditLog: any;
  let service: WeaversService;

  beforeEach(() => {
    prisma = {
      weaver: { findUnique: jest.fn(), findMany: jest.fn() },
      qcRecord: { findMany: jest.fn() },
      finishingAssignment: { findMany: jest.fn() },
      batchSareeRow: { count: jest.fn() },
      materialIssueRecord: { count: jest.fn() },
    };
    auditLog = { recordAction: jest.fn() };
    service = new WeaversService(prisma, auditLog);
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
        materialIssueCount: 3,
      });
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
});
