import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma, SalesChannel } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReturnDto } from "./dto/create-return.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { ListReturnQueryDto } from "./dto/list-return-query.dto";
import { ListSaleQueryDto } from "./dto/list-sale-query.dto";

const saleInclude = {
  saree: true,
  customer: true,
} satisfies Prisma.SaleRecordInclude;

const returnInclude = {
  saree: true,
} satisfies Prisma.ReturnRecordInclude;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async createSale(dto: CreateSaleDto) {
    const saree = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
    if (!saree) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    if (saree.status !== "UNSOLD") {
      throw new BadRequestException(`Saree ${dto.sareeId} is not available for sale (status: ${saree.status})`);
    }
    if (dto.channel === SalesChannel.WHOLESALE && dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }
    }

    const saleRef = await this.idGenerator.nextFormatted("SALE");

    await this.prisma.$transaction([
      this.prisma.saleRecord.create({
        data: {
          saleRef,
          sareeId: dto.sareeId,
          channel: dto.channel,
          customerId: dto.customerId,
          amount: dto.amount,
        },
      }),
      this.prisma.saree.update({
        where: { id: dto.sareeId },
        data: { status: dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL" },
      }),
    ]);

    return this.findOneSale(saleRef);
  }

  async findAllSales(
    query: ListSaleQueryDto,
  ): Promise<PaginatedResult<Prisma.SaleRecordGetPayload<{ include: typeof saleInclude }>>> {
    const where: Prisma.SaleRecordWhereInput = { channel: query.channel };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.saleRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
        include: saleInclude,
      }),
      this.prisma.saleRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOneSale(saleRef: string) {
    const record = await this.prisma.saleRecord.findUnique({
      where: { saleRef },
      include: saleInclude,
    });
    if (!record) {
      throw new NotFoundException(`Sale ${saleRef} not found`);
    }
    return record;
  }

  async createReturn(dto: CreateReturnDto) {
    const saree = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
    if (!saree) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    if (saree.status !== "RETAIL" && saree.status !== "WHOLESALE") {
      throw new BadRequestException(`Saree ${dto.sareeId} was not sold (status: ${saree.status})`);
    }

    const returnRef = await this.idGenerator.nextFormatted("RET");
    const restocked = dto.restocked ?? false;

    await this.prisma.$transaction([
      this.prisma.returnRecord.create({
        data: {
          returnRef,
          sareeId: dto.sareeId,
          reason: dto.reason,
          refundAmount: dto.refundAmount,
          restocked,
        },
      }),
      this.prisma.saree.update({
        where: { id: dto.sareeId },
        data: { status: restocked ? "UNSOLD" : "RETURNED" },
      }),
    ]);

    return this.findOneReturn(returnRef);
  }

  async findAllReturns(
    query: ListReturnQueryDto,
  ): Promise<PaginatedResult<Prisma.ReturnRecordGetPayload<{ include: typeof returnInclude }>>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.returnRecord.findMany({
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: returnInclude,
      }),
      this.prisma.returnRecord.count(),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOneReturn(returnRef: string) {
    const record = await this.prisma.returnRecord.findUnique({
      where: { returnRef },
      include: returnInclude,
    });
    if (!record) {
      throw new NotFoundException(`Return ${returnRef} not found`);
    }
    return record;
  }
}
