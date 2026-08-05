import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma, PurchaseRequestStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { DecidePurchaseRequestDto } from "./dto/decide-purchase-request.dto";
import { ListPurchaseRequestsQueryDto } from "./dto/list-purchase-requests-query.dto";

@Injectable()
export class PurchaseRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseRequestDto) {
    const requester = await this.prisma.user.findUnique({ where: { id: dto.requestedById } });
    if (!requester) {
      throw new NotFoundException(`User ${dto.requestedById} not found`);
    }

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
    }

    return this.prisma.purchaseRequest.create({
      data: {
        supplierId: dto.supplierId,
        requestedById: dto.requestedById,
        sareeType: dto.sareeType,
        quantity: dto.quantity,
        estimatedAmount: dto.estimatedAmount,
        urgency: dto.urgency,
        reason: dto.reason,
      },
    });
  }

  async findAll(
    query: ListPurchaseRequestsQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseRequestGetPayload<object>>> {
    const where: Prisma.PurchaseRequestWhereInput = {
      status: query.status,
      supplierId: query.supplierId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseRequest.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const request = await this.prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Purchase request ${id} not found`);
    }
    return request;
  }

  async decide(id: string, dto: DecidePurchaseRequestDto) {
    const request = await this.findOne(id);
    if (request.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException(
        `Purchase request must be PENDING to be decided (currently ${request.status})`,
      );
    }

    const decider = await this.prisma.user.findUnique({ where: { id: dto.decidedById } });
    if (!decider) {
      throw new NotFoundException(`User ${dto.decidedById} not found`);
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: dto.decision,
        decidedById: dto.decidedById,
        decidedDate: new Date(),
        decisionNote: dto.decisionNote,
      },
    });
  }
}
