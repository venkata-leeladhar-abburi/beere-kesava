import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { nextSequenceId } from "../common/sequence-id.util";
import { AccessLevel, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, nameSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

// Human-facing ID prefix per role — gap-filled against however many Users of
// that role currently exist (see common/sequence-id.util.ts), so deleting a
// user frees their number for the next person in that role. WEAVER is
// deliberately absent here: a WEAVER-role User's empId instead mirrors its
// linked Weaver's own gap-filled code (see create() below), since the
// Weaver table — not the User table — is the source of truth for "how many
// weavers exist" per the product requirement.
const ROLE_ID_PREFIX: Partial<Record<UserRole, string>> = {
  SUPERADMIN: "SUPER",
  ADMIN: "ADMIN",
  WORKER: "STAFF",
  SHOP: "SHOP",
  ACCOUNTANT: "ACCT",
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateUserDto) {
    // Allocated before the transaction: the id counter is its own atomic
    // statement, so it must not run on the transaction's connection.
    const weaverCode =
      dto.role === "WEAVER" ? await this.idGenerator.nextNamed("WEAVER", nameSegment(dto.firstName)) : null;
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Some roles are backed by their own domain table (currently just
        // WEAVER, matching Weavers/Batches/QC/etc.) — the User row alone
        // would be invisible in that module's roster, so provision the
        // linked record here rather than leaving it as a dangling role tag.
        // The Add User form collects the weaver-specific fields (photo,
        // village, looms, bank details) when role=Weaver is selected; any
        // left blank fall back to an empty placeholder, editable later from
        // the Weavers module.
        const linkedWeaver =
          dto.role === "WEAVER"
            ? await tx.weaver.create({
                data: {
                  code: weaverCode!,
                  name: `${dto.firstName} ${dto.lastName}`.trim(),
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  initials: dto.firstName.toUpperCase().slice(0, 10),
                  photoUrl: dto.photoUrl ?? "",
                  email: dto.email ?? "",
                  phone: dto.mobile,
                  village: dto.village,
                  cluster: dto.cluster,
                  looms: dto.looms ?? 0,
                  bankName: dto.bankName,
                  accountNo: dto.accountNo,
                  ifsc: dto.ifsc,
                },
              })
            : null;

        const empId = linkedWeaver
          ? linkedWeaver.code
          : nextSequenceId(
              (await tx.user.findMany({ where: { role: dto.role }, select: { empId: true } })).map(
                (u) => u.empId,
              ),
              ROLE_ID_PREFIX[dto.role] ?? dto.role,
            );

        return tx.user.create({
          data: {
            empId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            mobile: dto.mobile,
            email: dto.email,
            role: dto.role,
            accessLevel: dto.accessLevel ?? AccessLevel.FULL_ACCESS,
            linkedWeaverId: linkedWeaver?.id,
          },
        });
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

    const [items, total] = await Promise.all([
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

  async remove(id: string) {
    const user = await this.findOne(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        // A WEAVER-role user has a linked Weaver row created alongside it
        // (see create()) — delete both together so removing the person
        // doesn't leave an orphaned half-record in the other module.
        if (user.linkedWeaverId) {
          await tx.weaver.delete({ where: { id: user.linkedWeaverId } });
        }
        await tx.user.delete({ where: { id } });
      });
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  private mapPrismaError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return new ConflictException(`A user with this ${target} already exists`);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return new ConflictException(
        "This user has existing records (batches, QC entries, payments, audit history, etc.) and can't be deleted. Deactivate the account instead.",
      );
    }
    return error instanceof Error ? error : new Error("Unknown error");
  }
}
