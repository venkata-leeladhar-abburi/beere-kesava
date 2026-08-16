import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { CustomerType, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { ListCustomersQueryDto } from "./dto/list-customers-query.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateCustomerDto) {
    const { actorId, ...data } = dto;
    const code = await this.idGenerator.nextFormatted(data.type === CustomerType.WHOLESALE ? "WHL" : "CUST");
    const customer = await this.prisma.customer.create({ data: { ...data, code } });

    await this.auditLog.recordAction({
      actorId,
      module: "CUSTOMERS",
      action: `Added customer ${customer.name}`,
      entityType: "Customer",
      entityId: customer.id,
      recordLabel: customer.name,
    });

    return customer;
  }

  async findAll(
    query: ListCustomersQueryDto,
  ): Promise<
    PaginatedResult<Prisma.CustomerGetPayload<object> & { totalPurchases: number; totalSpend: number; lastPurchaseDate: Date | null }>
  > {
    const where: Prisma.CustomerWhereInput = {
      type: query.type,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
              { city: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Real purchase count/spend/last-visit per customer, off SaleRecord —
    // previously the frontend hardcoded these (1 purchase/₹12,500 in the
    // sale flow, 0/0 on the customers list), two different fake numbers for
    // the same customer. Scoped to just this page's customer ids rather than
    // a groupBy over the whole table, since findMany above is already paginated.
    const customerIds = items.map((c) => c.id);
    // ReturnRecord has no saleRef FK — sareeId is the only link back to the
    // original sale (same pattern the frontend already uses) — so a
    // returned saree's sale is excluded here rather than counted as a live
    // purchase. Without this, returning a saree would revert its stock/QC
    // status but leave it still inflating the customer's purchase count.
    const returnedSareeIds = customerIds.length
      ? (await this.prisma.returnRecord.findMany({ select: { sareeId: true } })).map((r) => r.sareeId)
      : [];
    const sales = customerIds.length
      ? await this.prisma.saleRecord.groupBy({
          by: ["customerId"],
          where: { customerId: { in: customerIds }, sareeId: { notIn: returnedSareeIds } },
          _count: { _all: true },
          _sum: { amount: true },
          _max: { date: true },
        })
      : [];
    const salesByCustomer = new Map(sales.map((s) => [s.customerId as string, s]));

    const enriched = items.map((c) => {
      const agg = salesByCustomer.get(c.id);
      return {
        ...c,
        totalPurchases: agg?._count._all ?? 0,
        totalSpend: Number(agg?._sum.amount ?? 0),
        lastPurchaseDate: agg?._max.date ?? null,
      };
    });

    return { items: enriched, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const before = await this.findOne(id);
    const { actorId, ...data } = dto;
    const updated = await this.prisma.customer.update({ where: { id }, data });

    await this.auditLog.recordAction({
      actorId,
      module: "CUSTOMERS",
      action: `Updated customer ${before.name}`,
      entityType: "Customer",
      entityId: id,
      recordLabel: before.name,
    });

    return updated;
  }

  async remove(id: string) {
    const customer = await this.findOne(id);

    try {
      await this.prisma.customer.delete({ where: { id } });

      await this.auditLog.recordAction({
        module: "CUSTOMERS",
        action: `Deleted customer ${customer.name}`,
        entityType: "Customer",
        entityId: id,
        recordLabel: customer.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "This customer has existing records (bulk orders, invoices, sales, etc.) and can't be deleted.",
        );
      }
      throw error;
    }
  }
}
