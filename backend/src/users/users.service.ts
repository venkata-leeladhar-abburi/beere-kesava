import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { AccessLevel, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const EMP_ID_PREFIX = "EMP";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateUserDto) {
    const empId = await this.idGenerator.nextFormatted(EMP_ID_PREFIX);

    try {
      return await this.prisma.user.create({
        data: {
          empId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          mobile: dto.mobile,
          email: dto.email,
          role: dto.role,
          accessLevel: dto.accessLevel ?? AccessLevel.FULL_ACCESS,
        },
      });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async findAll(query: ListUsersQueryDto): Promise<PaginatedResult<Prisma.UserGetPayload<object>>> {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { mobile: { contains: query.search } },
              { empId: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { dateAdded: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    try {
      return await this.prisma.user.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  async updateAccessLevel(id: string, accessLevel: AccessLevel) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { accessLevel } });
  }

  private mapPrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return new ConflictException(`A user with this ${target} already exists`);
    }
    return error instanceof Error ? error : new Error("Unknown error");
  }
}
