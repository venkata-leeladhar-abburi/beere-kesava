import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { normalizeMobile } from "../common/phone.util";
import { nextSequenceId } from "../common/sequence-id.util";
import { AccessLevel, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, nameSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { PortalAccessLevelDto } from "./dto/update-access-level.dto";
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

  // The unique constraint on User.mobile only catches byte-identical values,
  // so "+919876543210" and "9876543210" would both be accepted for the same
  // person. Numbers are stored normalised (see normalizeMobile) and checked
  // here so the second one is rejected with a clear message instead.
  private async assertMobileAvailable(mobile: string, excludeUserId?: string) {
    const existing = await this.prisma.user.findFirst({
      // endsWith, not equals: rows created before normalisation may still
      // hold "+91…" / "091…" variants of the same 10 digits.
      where: { mobile: { endsWith: mobile }, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
      select: { empId: true, firstName: true, lastName: true },
    });
    if (existing) {
      throw new ConflictException(
        `This mobile number is already assigned to ${existing.firstName} ${existing.lastName} (${existing.empId}).`,
      );
    }
  }

  /**
   * Extra portals a User may switch into. WEAVER needs a linked Weaver row
   * (only provisioned when it is the primary role) and SUPERADMIN is never
   * handed out as a side-grant, so both are refused; the primary role is
   * dropped as a duplicate.
   *
   * A weaver is also refused in the other direction: their portal is scoped to
   * their own batches and payments (see weaver-scope.ts), and a second portal
   * would put staff-wide data behind the same login.
   */
  private sanitizeAdditionalRoles(primary: UserRole, roles: UserRole[] | undefined): UserRole[] | undefined {
    if (roles === undefined) return undefined;
    const invalid = roles.filter((r) => r === UserRole.WEAVER || r === UserRole.SUPERADMIN);
    if (invalid.length) {
      throw new BadRequestException(`${invalid.join(", ")} cannot be assigned as an additional portal.`);
    }
    const extras = [...new Set(roles.filter((r) => r !== primary))];
    if (primary === UserRole.WEAVER && extras.length) {
      throw new BadRequestException("A weaver cannot be given a second portal.");
    }
    return extras;
  }

  async create(dto: CreateUserDto) {
    const additionalRoles = this.sanitizeAdditionalRoles(dto.role, dto.additionalRoles) ?? [];
    const mobile = normalizeMobile(dto.mobile);
    await this.assertMobileAvailable(mobile);
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
                  phone: mobile,
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
            mobile,
            email: dto.email,
            role: dto.role,
            additionalRoles,
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
        include: { portalAccess: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { portalAccess: true } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findOne(id);
    const additionalRoles = this.sanitizeAdditionalRoles(
      dto.role ?? existing.role,
      // A primary-role change alone must still drop that role from the extras.
      dto.additionalRoles ?? (dto.role ? existing.additionalRoles : undefined),
    );

    const mobile = dto.mobile === undefined ? undefined : normalizeMobile(dto.mobile);
    if (mobile !== undefined) {
      await this.assertMobileAvailable(mobile, id);
    }

    // A revoked portal must not leave its access level behind: re-granting it
    // later would silently restore a restriction nobody chose this time.
    const keep =
      additionalRoles === undefined
        ? undefined
        : new Set<UserRole>([dto.role ?? existing.role, ...additionalRoles]);

    try {
      const [updated] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id },
          data: {
            ...dto,
            ...(mobile === undefined ? {} : { mobile }),
            ...(additionalRoles === undefined ? {} : { additionalRoles }),
          },
          include: { portalAccess: true },
        }),
        ...(keep
          ? [
              this.prisma.userPortalAccess.deleteMany({
                where: { userId: id, role: { notIn: [...keep] } },
              }),
            ]
          : []),
      ]);
      return keep ? this.findOne(id) : updated;
    } catch (error) {
      throw this.mapPrismaError(error);
    }
  }

  /**
   * Sets the access level for one or more of this person's portals.
   *
   * The primary role's level stays on `User.accessLevel` — that is what an
   * account with a single portal has always used, and what the login token
   * falls back to. Every other portal gets a `UserPortalAccess` row, and a
   * level equal to the fallback is stored rather than inferred so that later
   * changing the primary role's level does not silently move the others too.
   *
   * A role the person isn't assigned is rejected: an access level on a portal
   * they cannot open is dead data that would quietly take effect if the portal
   * were ever granted.
   */
  async setPortalAccessLevels(id: string, levels: PortalAccessLevelDto[]) {
    const user = await this.findOne(id);
    const assigned = new Set<UserRole>([user.role, ...user.additionalRoles]);

    const unassigned = levels.filter((l) => !assigned.has(l.role));
    if (unassigned.length) {
      throw new BadRequestException(
        `${unassigned.map((l) => l.role).join(", ")} is not a portal assigned to this user.`,
      );
    }

    const primary = levels.find((l) => l.role === user.role);
    const extras = levels.filter((l) => l.role !== user.role);

    await this.prisma.$transaction([
      ...(primary
        ? [this.prisma.user.update({ where: { id }, data: { accessLevel: primary.accessLevel } })]
        : []),
      ...extras.map((l) =>
        this.prisma.userPortalAccess.upsert({
          where: { userId_role: { userId: id, role: l.role } },
          create: { userId: id, role: l.role, accessLevel: l.accessLevel },
          update: { accessLevel: l.accessLevel },
        }),
      ),
    ]);

    return this.findOne(id);
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
