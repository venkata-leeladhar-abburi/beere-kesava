import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { signatureFileToUrl } from "../common/storage/upload.config";
import { MaterialIssueStatus, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { ListMaterialIssuesQueryDto } from "./dto/list-material-issues-query.dto";

const MIR_ID_PREFIX_BASE = "MIR";

const includeItems = { items: true } satisfies Prisma.MaterialIssueRecordInclude;

@Injectable()
export class MaterialIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateMaterialIssueDto) {
    if ((dto.weaverId && dto.factoryLoomId) || (!dto.weaverId && !dto.factoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    const issuer = await this.prisma.user.findUnique({ where: { id: dto.issuedById } });
    if (!issuer) {
      throw new NotFoundException(`User ${dto.issuedById} not found`);
    }
    if (dto.weaverId) {
      const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
      if (!weaver) {
        throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
      }
    }
    if (dto.factoryLoomId) {
      const loom = await this.prisma.factoryLoom.findUnique({ where: { id: dto.factoryLoomId } });
      if (!loom) {
        throw new NotFoundException(`Factory loom ${dto.factoryLoomId} not found`);
      }
    }
    if (dto.batchId) {
      const batch = await this.prisma.batch.findUnique({ where: { id: dto.batchId } });
      if (!batch) {
        throw new NotFoundException(`Batch ${dto.batchId} not found`);
      }
    }

    const year = new Date().getFullYear();
    const id = await this.idGenerator.nextFormatted(`${MIR_ID_PREFIX_BASE}-${year}`);

    return this.prisma.materialIssueRecord.create({
      data: {
        id,
        weaverId: dto.weaverId,
        factoryLoomId: dto.factoryLoomId,
        loomNumber: dto.loomNumber ? String(dto.loomNumber) : undefined,
        batchId: dto.batchId,
        issuedById: dto.issuedById,
        signatureMethod: dto.signatureMethod,
        notes: dto.notes,
        items: { create: dto.items },
      },
      include: includeItems,
    });
  }

  async findAll(
    query: ListMaterialIssuesQueryDto,
  ): Promise<
    PaginatedResult<Prisma.MaterialIssueRecordGetPayload<{ include: typeof includeItems }>>
  > {
    const where: Prisma.MaterialIssueRecordWhereInput = {
      status: query.status,
      weaverId: query.weaverId,
      batchId: query.batchId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.materialIssueRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { issuedAt: "desc" },
        include: includeItems,
      }),
      this.prisma.materialIssueRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const record = await this.prisma.materialIssueRecord.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!record) {
      throw new NotFoundException(`Material issue ${id} not found`);
    }
    return record;
  }

  async sign(id: string, signature: Express.Multer.File) {
    const record = await this.findOne(id);
    if (record.status !== MaterialIssueStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Material issue must be PENDING_SIGNATURE to be signed (currently ${record.status})`,
      );
    }
    return this.prisma.materialIssueRecord.update({
      where: { id },
      data: {
        status: MaterialIssueStatus.SIGNED,
        signatureCaptured: true,
        signatureTimestamp: new Date(),
        signatureUrl: signatureFileToUrl(signature),
      },
      include: includeItems,
    });
  }

  async cancel(id: string) {
    const record = await this.findOne(id);
    if (record.status === MaterialIssueStatus.SIGNED) {
      throw new BadRequestException("A signed material issue cannot be cancelled");
    }
    return this.prisma.materialIssueRecord.update({
      where: { id },
      data: { status: MaterialIssueStatus.CANCELLED },
      include: includeItems,
    });
  }
}
