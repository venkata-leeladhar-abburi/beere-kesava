import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { nextSequenceId } from "../common/sequence-id.util";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";

export const WEAVER_CODE_PREFIX = "WEA";

/**
 * Gap-filled weaver code (e.g. "Wea-001"), scoped to however many Weaver
 * rows currently exist — deleting a weaver frees its number for reuse.
 * Exported standalone so UsersService can call it from inside its own
 * transaction when auto-creating a linked Weaver for a WEAVER-role User.
 */
export async function nextWeaverCode(
  client: Pick<Prisma.TransactionClient, "weaver">,
): Promise<string> {
  const existing = await client.weaver.findMany({ select: { code: true } });
  return nextSequenceId(existing.map((w) => w.code), WEAVER_CODE_PREFIX);
}

export interface WeaverStats {
  weaverId: string;
  totalSareesWoven: number;
  qcPassCount: number;
  qcPassRate: number; // percentage 0–100
  activeBatchRowsCount: number;
  materialIssueCount: number;
}

export interface WeaverLeaderboardEntry {
  weaverId: string;
  name: string;
  initials: string;
  photoUrl: string;
  village: string | null;
  totalSareesWoven: number;
  qcPassRate: number;
}

export interface WeaverProductionLeaderboardEntry {
  weaverId: string;
  name: string;
  initials: string;
  photoUrl: string;
  village: string | null;
  sareesProduced: number;
}

@Injectable()
export class WeaversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateWeaverDto) {
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    const initials = (dto.initials ?? dto.firstName).toUpperCase().slice(0, 10);
    const code = await nextWeaverCode(this.prisma);

    let weaver;
    try {
      weaver = await this.prisma.weaver.create({
        data: {
          code,
          name,
          firstName: dto.firstName,
          lastName: dto.lastName,
          initials,
          village: dto.village,
          cluster: dto.cluster,
          looms: dto.looms ?? 0,
          photoUrl: dto.photoUrl,
          email: dto.email,
          phone: dto.phone,
          bankName: dto.bankName,
          accountNo: dto.accountNo,
          ifsc: dto.ifsc,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Extremely rare race on the gap-filled code (two simultaneous
        // creates computing the same lowest gap) — surfaced as a conflict
        // rather than a raw 500 so the caller knows to just retry.
        throw new ConflictException("Weaver code was just taken by a concurrent request — please retry.");
      }
      throw error;
    }

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "WEAVERS",
      action: `Added weaver ${name}`,
      entityType: "Weaver",
      entityId: weaver.id,
      recordLabel: name,
    });

    return weaver;
  }

  async findAll(
    query: ListWeaversQueryDto,
  ): Promise<PaginatedResult<Prisma.WeaverGetPayload<object>>> {
    const where: Prisma.WeaverWhereInput = {
      status: query.status,
      village: query.village,
      cluster: query.cluster,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.weaver.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.weaver.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const weaver = await this.prisma.weaver.findUnique({ where: { id } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${id} not found`);
    }
    return weaver;
  }

  async update(id: string, dto: UpdateWeaverDto) {
    const before = await this.findOne(id);
    const { actorId, ...data } = dto;
    const updated = await this.prisma.weaver.update({ where: { id }, data });

    await this.auditLog.recordAction({
      actorId,
      module: "WEAVERS",
      action: `Updated weaver ${before.name}`,
      entityType: "Weaver",
      entityId: id,
      recordLabel: before.name,
    });

    return updated;
  }

  async remove(id: string) {
    const weaver = await this.prisma.weaver.findUnique({
      where: { id },
      include: { linkedUser: true },
    });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${id} not found`);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Symmetric with UsersService.remove(): this weaver may itself be
        // the linked record behind a WEAVER-role User row — delete both
        // sides together so neither is left dangling.
        if (weaver.linkedUser) {
          await tx.user.delete({ where: { id: weaver.linkedUser.id } });
        }
        await tx.weaver.delete({ where: { id } });
      });

      await this.auditLog.recordAction({
        module: "WEAVERS",
        action: `Deleted weaver ${weaver.name}`,
        entityType: "Weaver",
        entityId: id,
        recordLabel: weaver.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "This weaver has existing records (batches, QC entries, payments, etc.) and can't be deleted. Deactivate them instead.",
        );
      }
      throw error;
    }
  }

  /** Returns live-calculated performance metrics for a single weaver. */
  async getWeaverStats(id: string): Promise<WeaverStats> {
    await this.findOne(id); // throws 404 if not found

    const [totalSareesWoven, qcPassCount, activeBatchRowsCount, materialIssueCount] =
      await this.prisma.$transaction([
        // All sarees attributed to this weaver
        this.prisma.saree.count({ where: { weaverId: id } }),

        // QC records where this weaver's saree passed
        this.prisma.qcRecord.count({
          where: {
            weaverId: id,
            result: "PASSED",
          },
        }),

        // Active batch rows currently assigned to this weaver
        this.prisma.batchSareeRow.count({
          where: {
            weaverId: id,
            batch: { status: "ACTIVE" },
          },
        }),

        // Material issues sent to this weaver
        this.prisma.materialIssueRecord.count({
          where: { weaverId: id },
        }),
      ]);

    const qcPassRate =
      totalSareesWoven > 0
        ? Math.round((qcPassCount / totalSareesWoven) * 100 * 10) / 10
        : 0;

    return {
      weaverId: id,
      totalSareesWoven,
      qcPassCount,
      qcPassRate,
      activeBatchRowsCount,
      materialIssueCount,
    };
  }

  /** Returns the top-10 leaderboard of active weavers ranked by QC pass rate. */
  async getLeaderboard(): Promise<WeaverLeaderboardEntry[]> {
    const weavers = await this.prisma.weaver.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        initials: true,
        photoUrl: true,
        village: true,
        _count: {
          select: {
            // Total sarees attributed to this weaver
            sarees: true,
            // QC records that passed — filtered count requires Prisma >= 4.3
            qcRecords: {
              where: { result: "PASSED" },
            },
          },
        },
      },
    });

    const entries: WeaverLeaderboardEntry[] = weavers.map((w) => {
      const totalSareesWoven = w._count.sarees;
      const qcPassCount = w._count.qcRecords;
      const qcPassRate =
        totalSareesWoven > 0
          ? Math.round((qcPassCount / totalSareesWoven) * 100 * 10) / 10
          : 0;

      return {
        weaverId: w.id,
        name: w.name,
        initials: w.initials,
        photoUrl: w.photoUrl,
        village: w.village,
        totalSareesWoven,
        qcPassRate,
      };
    });

    // Sort: highest QC pass rate first; total output as tiebreaker
    entries.sort((a, b) => {
      if (b.qcPassRate !== a.qcPassRate) return b.qcPassRate - a.qcPassRate;
      return b.totalSareesWoven - a.totalSareesWoven;
    });

    return entries.slice(0, 10);
  }

  /**
   * Returns the top-5 weaver leaderboard ranked by PRODUCTION VOLUME (QC
   * records recorded) within a trailing window, rather than QC pass rate.
   * Used by the Production Analytics "Top Weavers" chart, which cares about
   * output within the selected period, not all-time quality.
   */
  async getProductionLeaderboard(months = 6): Promise<WeaverProductionLeaderboardEntry[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const grouped = await this.prisma.qcRecord.groupBy({
      by: ["weaverId"],
      where: { weaverId: { not: null }, qcDate: { gte: cutoff } },
      _count: { sareeId: true },
      orderBy: { _count: { sareeId: "desc" } },
      take: 5,
    });

    const weaverIds = grouped
      .map((g) => g.weaverId)
      .filter((id): id is string => !!id);

    if (weaverIds.length === 0) return [];

    const weavers = await this.prisma.weaver.findMany({
      where: { id: { in: weaverIds } },
      select: { id: true, name: true, initials: true, photoUrl: true, village: true },
    });
    const weaverMap = new Map(weavers.map((w) => [w.id, w]));

    return grouped
      .filter((g) => g.weaverId && weaverMap.has(g.weaverId))
      .map((g) => {
        const w = weaverMap.get(g.weaverId as string)!;
        return {
          weaverId: w.id,
          name: w.name,
          initials: w.initials,
          photoUrl: w.photoUrl,
          village: w.village,
          sareesProduced: g._count.sareeId,
        };
      });
  }
}
