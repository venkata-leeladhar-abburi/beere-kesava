import { NotFoundException } from "@nestjs/common";
import { WeaversService } from "./weavers.service";

describe("WeaversService", () => {
  let prisma: any;
  let auditLog: any;
  let service: WeaversService;

  beforeEach(() => {
    prisma = {
      weaver: { findUnique: jest.fn(), findMany: jest.fn() },
      saree: { count: jest.fn() },
      qcRecord: { count: jest.fn() },
      batchSareeRow: { count: jest.fn() },
      materialIssueRecord: { count: jest.fn() },
      $transaction: jest.fn(),
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
      // totalSareesWoven=7, qcPassCount=5 -> 71.4285... -> 71.4
      prisma.$transaction.mockResolvedValue([7, 5, 2, 3]);

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
      prisma.$transaction.mockResolvedValue([0, 0, 0, 0]);

      const stats = await service.getWeaverStats("w1");

      expect(stats.qcPassRate).toBe(0);
    });
  });

  describe("getLeaderboard", () => {
    it("ranks active weavers by qcPassRate desc, using total output as tiebreaker, capped at 10", async () => {
      const makeWeaver = (id: string, sarees: number, passed: number) => ({
        id,
        name: id,
        initials: id,
        photoUrl: null,
        village: null,
        _count: { sarees, qcRecords: passed },
      });

      prisma.weaver.findMany.mockResolvedValue([
        makeWeaver("low-rate-high-volume", 100, 50), // 50%
        makeWeaver("tie-a", 10, 10), // 100%, total 10
        makeWeaver("tie-b", 20, 20), // 100%, total 20 -> should rank above tie-a
        makeWeaver("zero-sarees", 0, 0), // 0%
      ]);

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
        Array.from({ length: 15 }, (_, i) => ({
          id: `w${i}`,
          name: `w${i}`,
          initials: "W",
          photoUrl: null,
          village: null,
          _count: { sarees: i + 1, qcRecords: 0 },
        })),
      );

      const leaderboard = await service.getLeaderboard();

      expect(prisma.weaver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "ACTIVE" } }),
      );
      expect(leaderboard).toHaveLength(10);
    });
  });
});
