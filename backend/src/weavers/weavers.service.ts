import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { IdGeneratorService, nameSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";

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
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateWeaverDto) {
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    const initials = (dto.initials ?? dto.firstName).toUpperCase().slice(0, 10);
    // "<FirstName>-NNN", e.g. "Padma-001" — one counter shared across all
    // weavers, allocated DB-side so concurrent creates can't collide. `initials`
    // (used in saree ids like "RAVI-L2-004") stays a separate field.
    const code = await this.idGenerator.nextNamed("WEAVER", nameSegment(dto.firstName));

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

  // "Produced" (== "sarees woven" in the UI) = QC-passed OR finished via the
  // Raise Quotation receive flow, deduplicated per saree — not the separate,
  // disconnected `Saree` table (legacy/unused) and not `receivedAt` alone.
  // Shared by getWeaverStats/getLeaderboard so every weaver-facing number
  // agrees. Pass weaverIds to scope the query; omit for all weavers.
  private async getProducedCountsByWeaver(
    weaverIds?: string[],
  ): Promise<Map<string, { produced: Set<string>; qcPassCount: number }>> {
    const [passedRecords, returnedAssignments] = await Promise.all([
      this.prisma.qcRecord.findMany({
        where: { weaverId: weaverIds ? { in: weaverIds } : { not: null }, result: "PASSED" },
        select: { weaverId: true, sareeId: true },
      }),
      this.prisma.finishingAssignment.findMany({
        where: {
          status: "RETURNED",
          batchSareeRow: { weaverId: weaverIds ? { in: weaverIds } : { not: null } },
        },
        select: { sareeId: true, batchSareeRow: { select: { weaverId: true } } },
      }),
    ]);

    const byWeaver = new Map<string, { produced: Set<string>; qcPassCount: number }>();
    const entry = (weaverId: string) => {
      const e = byWeaver.get(weaverId) ?? { produced: new Set<string>(), qcPassCount: 0 };
      byWeaver.set(weaverId, e);
      return e;
    };
    passedRecords.forEach((r) => {
      if (!r.weaverId) return;
      const e = entry(r.weaverId);
      e.produced.add(r.sareeId);
      e.qcPassCount += 1;
    });
    returnedAssignments.forEach((r) => {
      const weaverId = r.batchSareeRow.weaverId;
      if (!weaverId) return;
      entry(weaverId).produced.add(r.sareeId);
    });
    return byWeaver;
  }

  /** Returns live-calculated performance metrics for a single weaver. */
  async getWeaverStats(id: string): Promise<WeaverStats> {
    await this.findOne(id); // throws 404 if not found

    const [producedByWeaver, activeBatchRowsCount, materialIssueCount] = await Promise.all([
      this.getProducedCountsByWeaver([id]),
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

    const stats = producedByWeaver.get(id);
    const totalSareesWoven = stats?.produced.size ?? 0;
    const qcPassCount = stats?.qcPassCount ?? 0;

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
      },
    });

    const producedByWeaver = await this.getProducedCountsByWeaver(weavers.map((w) => w.id));

    const entries: WeaverLeaderboardEntry[] = weavers.map((w) => {
      const stats = producedByWeaver.get(w.id);
      const totalSareesWoven = stats?.produced.size ?? 0;
      const qcPassCount = stats?.qcPassCount ?? 0;
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
   * Returns the top-5 weaver leaderboard ranked by PRODUCTION VOLUME within
   * a trailing window, rather than QC pass rate. "Produced" here means
   * QC-passed OR finished via the Raise Quotation receive flow — a saree
   * returned through that flow counts even without its own QC pass record —
   * deduplicated per saree so one saree can't be counted twice. Used by the
   * Production Analytics "Top Weavers" chart, which cares about output
   * within the selected period, not all-time quality.
   */
  async getProductionLeaderboard(months = 6): Promise<WeaverProductionLeaderboardEntry[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const [passedRecords, returnedAssignments] = await Promise.all([
      this.prisma.qcRecord.findMany({
        where: { weaverId: { not: null }, qcDate: { gte: cutoff }, result: "PASSED" },
        select: { weaverId: true, sareeId: true },
      }),
      this.prisma.finishingAssignment.findMany({
        where: { status: "RETURNED", updatedAt: { gte: cutoff } },
        select: { sareeId: true, batchSareeRow: { select: { weaverId: true } } },
      }),
    ]);

    const producedByWeaver = new Map<string, Set<string>>();
    const addProduced = (weaverId: string | null | undefined, sareeId: string) => {
      if (!weaverId) return;
      const set = producedByWeaver.get(weaverId) ?? new Set<string>();
      set.add(sareeId);
      producedByWeaver.set(weaverId, set);
    };
    passedRecords.forEach((r) => addProduced(r.weaverId, r.sareeId));
    returnedAssignments.forEach((r) => addProduced(r.batchSareeRow.weaverId, r.sareeId));

    const ranked = Array.from(producedByWeaver.entries())
      .map(([weaverId, sareeIds]) => ({ weaverId, count: sareeIds.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (ranked.length === 0) return [];

    const weavers = await this.prisma.weaver.findMany({
      where: { id: { in: ranked.map((r) => r.weaverId) } },
      select: { id: true, name: true, initials: true, photoUrl: true, village: true },
    });
    const weaverMap = new Map(weavers.map((w) => [w.id, w]));

    return ranked
      .filter((r) => weaverMap.has(r.weaverId))
      .map((r) => {
        const w = weaverMap.get(r.weaverId)!;
        return {
          weaverId: w.id,
          name: w.name,
          initials: w.initials,
          photoUrl: w.photoUrl,
          village: w.village,
          sareesProduced: r.count,
        };
      });
  }
}
