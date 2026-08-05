import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
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

@Injectable()
export class WeaversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateWeaverDto) {
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    const initials = (dto.initials ?? dto.firstName).toUpperCase().slice(0, 10);

    const weaver = await this.prisma.weaver.create({
      data: {
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

    const [items, total] = await this.prisma.$transaction([
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
            saree: { weaverId: id },
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
}
