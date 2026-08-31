import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { StorageService } from "../common/storage/storage.service";
import { deductStock, restoreStock } from "../common/raw-material-stock.util";
import { toGrams } from "../common/weight-units.util";
import {
  JariGrade,
  MaterialIssueStatus,
  MaterialReturnStatus,
  MaterialType,
  NotificationTargetType,
  Prisma,
  SignatureMethod,
  WarpSubtype,
} from "../generated/prisma/client";
import { IdGeneratorService, businessSegment, nameSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaterialReturnDto } from "./dto/create-material-return.dto";
import { GetOutstandingQueryDto } from "./dto/get-outstanding-query.dto";
import { ListMaterialReturnsQueryDto } from "./dto/list-material-returns-query.dto";

const MRR_ID_PREFIX_BASE = "MRR";

const includeItems = { items: true } satisfies Prisma.MaterialReturnRecordInclude;

export interface OutstandingGroup {
  materialType: string;
  warpSubtype: string | null;
  jariType: string | null;
  jariGrade: string | null;
  jariColor: string | null;
  // Provenance of the material still outstanding. Issues carry a GRN link
  // (grnBatchId = the parent receipt, grnItem.itemCode = the exact received
  // line), so an outstanding balance can be traced back to the stock it came
  // from. Null for rows issued before GRN linkage existed.
  grnBatchId: string | null;
  grnItemCode: string | null;
  // Human label for the received line: GrnItem.description, falling back to
  // its name. Lets the panel show "Resham Warp · Gold 2-ply" instead of just
  // a material type.
  description: string | null;
  // The unit the material was issued in ("KG", "REELS", …). Grams are the
  // arithmetic currency; this is what the quantity should be displayed as.
  unit: string;
  // Every material-issue record that contributed to this line, so the panel
  // can show which handover(s) the outstanding weight came from.
  issueIds: string[];
  issuedGrams: number;
  returnedGrams: number;
  outstandingGrams: number;
}

// Identity of a material *variant* — type plus whatever sub-attributes
// distinguish two lines of that type. Returns are recorded at this
// granularity (MaterialReturnItem carries no GRN link), so it is the level
// at which returned weight can be matched back to issued weight.
function variantKey(item: { materialType: string; warpSubtype: string | null; jariType: string | null; jariGrade: string | null; jariColor: string | null }): string {
  return [item.materialType, item.warpSubtype, item.jariType, item.jariGrade, item.jariColor].join("|");
}

// Identity of a specific issued line: the variant plus the GRN line it was
// drawn from. Finer than variantKey, so one variant can span several GRN
// receipts and each keeps its own provenance.
function grnLineKey(item: { materialType: string; warpSubtype: string | null; jariType: string | null; jariGrade: string | null; jariColor: string | null; grnBatchId: string | null; grnItemId: string | null }): string {
  return [variantKey(item), item.grnBatchId ?? "", item.grnItemId ?? ""].join("#");
}

@Injectable()
export class MaterialReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateMaterialReturnDto) {
    if ((dto.weaverId && dto.factoryLoomId) || (!dto.weaverId && !dto.factoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    // A deduction with no stated reason leaves whoever pays the weaver out
    // unable to explain why the amount was withheld.
    if (dto.deductionAmount && dto.deductionAmount > 0 && !dto.deductionReason?.trim()) {
      throw new BadRequestException("deductionReason is required when deductionAmount is set");
    }

    // Jari is always counted in Reels/Buns, never a weight unit — same rule
    // enforced on issue (see MaterialIssuesService.create).
    for (const item of dto.items) {
      if (item.materialType === "JARI" && !["REEL", "REELS", "BUN", "BUNS"].includes(item.unit.trim().toUpperCase())) {
        throw new BadRequestException(`Jari must be returned in Reels or Buns, not "${item.unit}"`);
      }
    }

    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receivedById } });
    if (!receiver) {
      throw new NotFoundException(`User ${dto.receivedById} not found`);
    }
    let weaver: { code: string | null; firstName: string } | null = null;
    if (dto.weaverId) {
      weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
      if (!weaver) {
        throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
      }
    }
    let loom: { code: string | null; loomNumber: string } | null = null;
    if (dto.factoryLoomId) {
      loom = await this.prisma.factoryLoom.findUnique({ where: { id: dto.factoryLoomId } });
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

    const parentCode = weaver
      ? weaver.code ?? nameSegment(weaver.firstName, "Weaver")
      : loom!.code ?? businessSegment(loom!.loomNumber, "Loom");
    const id = await this.idGenerator.nextScoped(MRR_ID_PREFIX_BASE, parentCode);

    // Record and stock restoration are one unit of work — a failure between
    // them used to leave a return recorded whose material never came back.
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.materialReturnRecord.create({
        data: {
          id,
          weaverId: dto.weaverId,
          factoryLoomId: dto.factoryLoomId,
          loomNumber: dto.loomNumber ? String(dto.loomNumber) : undefined,
          batchId: dto.batchId,
          receivedById: dto.receivedById,
          signatureMethod: dto.signatureMethod,
          deductionAmount: dto.deductionAmount,
          deductionReason: dto.deductionReason,
          notes: dto.notes,
          items: { create: dto.items },
        },
        include: includeItems,
      });

      // Restore returned material quantities back into RawMaterialStock —
      // the inverse of MaterialIssuesService.create's deduction.
      await restoreStock(tx, dto.items);
      return created;
    });

    // Remote signature: no phone/SMS involved — the weaver approves this
    // in-app, on their own portal's Return Materials page. Push them an
    // in-app notification pointing at the record instead of texting anyone.
    if (dto.signatureMethod === SignatureMethod.REMOTE && dto.weaverId) {
      const linkedUser = await this.prisma.user.findUnique({ where: { linkedWeaverId: dto.weaverId } });
      if (linkedUser) {
        await this.notifications.create({
          targetType: NotificationTargetType.USER,
          userId: linkedUser.id,
          type: "material_signature_request",
          payload: { recordId: record.id, recordKind: "RETURN" },
        });
      }
    }

    return record;
  }

  // `scopedWeaverId` is passed by the controller only when the caller's role
  // is WEAVER, forcing results down to that weaver's own returns and
  // overriding any weaverId/factoryLoomId the caller might have supplied —
  // mirrors BatchesService.findAll's weaver scoping, so a WEAVER token can
  // never see another weaver's (or a factory loom's) return history.
  async findAll(
    query: ListMaterialReturnsQueryDto,
    scopedWeaverId?: string,
  ): Promise<
    PaginatedResult<Prisma.MaterialReturnRecordGetPayload<{ include: typeof includeItems }>>
  > {
    const where: Prisma.MaterialReturnRecordWhereInput = {
      status: query.status,
      weaverId: scopedWeaverId ?? query.weaverId,
      factoryLoomId: scopedWeaverId ? undefined : query.factoryLoomId,
      batchId: query.batchId,
    };

    const [items, total] = await Promise.all([
      this.prisma.materialReturnRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { receivedAt: "desc" },
        include: includeItems,
      }),
      this.prisma.materialReturnRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  // Same weaver-scoping as findAll — a WEAVER token requesting a return that
  // isn't theirs gets a 404, not a 403, so it doesn't leak the record's
  // existence (same reasoning as BatchesService.findOne).
  async findOne(id: string, scopedWeaverId?: string) {
    const record = await this.prisma.materialReturnRecord.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!record || (scopedWeaverId && record.weaverId !== scopedWeaverId)) {
      throw new NotFoundException(`Material return ${id} not found`);
    }
    return record;
  }

  async sign(id: string, signature: Express.Multer.File) {
    const record = await this.findOne(id);
    if (record.status !== MaterialReturnStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Material return must be PENDING_SIGNATURE to be signed (currently ${record.status})`,
      );
    }
    const updated = await this.prisma.materialReturnRecord.update({
      where: { id },
      data: {
        status: MaterialReturnStatus.APPROVED,
        signatureCaptured: true,
        signatureTimestamp: new Date(),
        signatureUrl: await this.storage.upload(signature, "signatures"),
      },
      include: includeItems,
    });

    const recipient = record.weaverId
      ? (await this.prisma.weaver.findUnique({ where: { id: record.weaverId } }))?.name
      : record.factoryLoomId
        ? (await this.prisma.factoryLoom.findUnique({ where: { id: record.factoryLoomId } }))?.loomNumber
        : undefined;

    await this.auditLog.recordAction({
      actorId: record.receivedById,
      module: "MATERIALS",
      action: `Approved return ${id} from ${recipient ?? "recipient"}`,
      entityType: "MaterialReturnRecord",
      entityId: id,
    });

    return updated;
  }

  async cancel(id: string) {
    const record = await this.findOne(id);
    if (record.status === MaterialReturnStatus.APPROVED) {
      throw new BadRequestException("An approved material return cannot be cancelled");
    }
    return this.prisma.materialReturnRecord.update({
      where: { id },
      data: { status: MaterialReturnStatus.CANCELLED },
      include: includeItems,
    });
  }

  // Hard-deletes the record (items cascade) and reverses the stock that was
  // restored on create — mirrors MaterialIssuesService.remove's reversal.
  async remove(id: string) {
    const record = await this.findOne(id);

    // Reverse and delete together, so a failed delete can't take the material
    // back out of stock twice.
    await this.prisma.$transaction(async (tx) => {
      await deductStock(tx, record.items);
      await tx.materialReturnRecord.delete({ where: { id } });
    });
  }

  // Issued (non-cancelled) minus already-approved-returned, grouped by
  // material line, in grams — the real backend counterpart to the frontend's
  // previously-mocked WeaverMaterialSummary calc.
  // `scopedWeaverId` (WEAVER callers only, see findAll) forces the lookup to
  // the caller's own weaver record, ignoring whatever weaverId/factoryLoomId
  // they passed — this is also how a weaver's own outstanding balance gets
  // exposed to the weaver portal.
  async getOutstanding(query: GetOutstandingQueryDto, scopedWeaverId?: string): Promise<OutstandingGroup[]> {
    const effectiveWeaverId = scopedWeaverId ?? query.weaverId;
    const effectiveFactoryLoomId = scopedWeaverId ? undefined : query.factoryLoomId;

    if ((effectiveWeaverId && effectiveFactoryLoomId) || (!effectiveWeaverId && !effectiveFactoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    const recipientWhere = effectiveWeaverId ? { weaverId: effectiveWeaverId } : { factoryLoomId: effectiveFactoryLoomId };
    // Loom/batch narrowing is applied to issues and returns alike, so a
    // scoped balance stays "issued here minus returned here". Scoping only
    // one side would make a batch look permanently outstanding (its returns
    // filtered out) or over-returned.
    const scopeWhere = {
      ...(query.loomNumber ? { loomNumber: query.loomNumber } : {}),
      ...(query.batchId ? { batchId: query.batchId } : {}),
    };

    const [issues, returns] = await Promise.all([
      this.prisma.materialIssueRecord.findMany({
        where: { ...recipientWhere, ...scopeWhere, status: { not: MaterialIssueStatus.CANCELLED } },
        include: { items: { include: { grnItem: true } } },
        orderBy: { issuedAt: "asc" },
      }),
      this.prisma.materialReturnRecord.findMany({
        where: { ...recipientWhere, ...scopeWhere, status: MaterialReturnStatus.APPROVED },
        include: includeItems,
      }),
    ]);

    // Pass 1 — issued weight, at GRN-line granularity so provenance survives.
    const groups = new Map<string, OutstandingGroup>();

    for (const issue of issues) {
      for (const item of issue.items) {
        const key = grnLineKey(item);
        const grams = toGrams(Number(item.quantity), item.unit);
        const existing = groups.get(key);
        if (existing) {
          existing.issuedGrams += grams;
          if (!existing.issueIds.includes(issue.id)) {
            existing.issueIds.push(issue.id);
          }
        } else {
          groups.set(key, {
            materialType: item.materialType,
            warpSubtype: item.warpSubtype,
            jariType: item.jariType,
            jariGrade: item.jariGrade,
            jariColor: item.jariColor,
            grnBatchId: item.grnBatchId,
            grnItemCode: item.grnItem?.itemCode ?? null,
            description: item.grnItem?.description ?? item.grnItem?.name ?? null,
            unit: item.unit,
            issueIds: [issue.id],
            issuedGrams: grams,
            returnedGrams: 0,
            outstandingGrams: 0,
          });
        }
      }
    }

    // Pass 2 — returned weight. MaterialReturnItem carries no GRN link, so a
    // return can only be matched to the *variant* it belongs to, not to the
    // exact receipt it originally came from. Total returned per variant is
    // therefore drawn down across that variant's GRN lines, oldest-issued
    // first (`issues` is ordered by issuedAt), which is the same FIFO
    // convention createAutoReturnForReceipt uses. Any excess a variant's
    // lines cannot absorb — a return logged with no matching issue, or more
    // returned than was ever issued — has no outstanding weight behind it by
    // definition, and drops out with the `outstandingGrams > 0` filter below.
    // Returns are now recorded at the material-type level only (no subtype/
    // color selection on the Return Materials form), so they can only be
    // matched back to issued lines by materialType — pooled across every
    // variant of that type, oldest-issued line drawn down first.
    const returnedByType = new Map<string, number>();
    for (const ret of returns) {
      for (const item of ret.items) {
        const key = item.materialType;
        const grams = toGrams(Number(item.quantity), item.unit);
        returnedByType.set(key, (returnedByType.get(key) ?? 0) + grams);
      }
    }

    for (const [materialType, totalReturned] of returnedByType) {
      let remaining = totalReturned;
      const lines = Array.from(groups.values()).filter((g) => g.materialType === materialType);

      for (const line of lines) {
        if (remaining <= 0) {
          break;
        }
        const draw = Math.min(line.issuedGrams - line.returnedGrams, remaining);
        if (draw > 0) {
          line.returnedGrams += draw;
          remaining -= draw;
        }
      }
    }

    return Array.from(groups.values())
      .map((g) => ({ ...g, outstandingGrams: g.issuedGrams - g.returnedGrams }))
      .filter((g) => g.outstandingGrams > 0)
      .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
  }

  // Auto-close-out for the material weight declared "still with the weaver"
  // when Worker Staff receives a saree (see BatchesService.receiveRow): the
  // saree's declared per-material weight is only accepted if the weaver's
  // outstanding balance for that material can cover it, and on success that
  // amount is drawn down from outstanding via a synthetic, already-approved
  // MaterialReturnRecord — no separate physical handover/signature, since the
  // material never left the saree. Unlike a manual return, this does NOT
  // restore RawMaterialStock: the material is consumed into the finished
  // saree, not handed back to the warehouse.
  async createAutoReturnForReceipt(params: {
    weaverId: string;
    batchId: string;
    receivedById: string;
    requests: { materialType: MaterialType; grams: number }[];
  }) {
    const groups = await this.getOutstanding({ weaverId: params.weaverId });

    const itemsToCreate: Prisma.MaterialReturnItemCreateWithoutReturnInput[] = [];

    for (const req of params.requests) {
      if (req.grams <= 0) {
        continue;
      }
      const matchingGroups = groups
        .filter((g) => g.materialType === req.materialType)
        .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
      const totalOutstanding = matchingGroups.reduce((sum, g) => sum + g.outstandingGrams, 0);

      if (totalOutstanding < req.grams) {
        throw new BadRequestException(
          `Weaver does not have enough outstanding ${req.materialType} material to return ` +
            `(has ${totalOutstanding}g, saree requires ${req.grams}g) — request material from admin.`,
        );
      }

      let remaining = req.grams;
      for (const group of matchingGroups) {
        if (remaining <= 0) {
          break;
        }
        const draw = Math.min(group.outstandingGrams, remaining);
        itemsToCreate.push({
          materialType: group.materialType as MaterialType,
          warpSubtype: group.warpSubtype as WarpSubtype | null,
          quantity: draw,
          unit: "G",
          jariType: group.jariType,
          jariGrade: group.jariGrade as JariGrade | null,
          jariColor: group.jariColor,
        });
        remaining -= draw;
      }
    }

    if (itemsToCreate.length === 0) {
      return null;
    }

    const weaver = await this.prisma.weaver.findUnique({ where: { id: params.weaverId } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${params.weaverId} not found`);
    }
    const parentCode = weaver.code ?? nameSegment(weaver.firstName, "Weaver");
    const id = await this.idGenerator.nextScoped(MRR_ID_PREFIX_BASE, parentCode);

    return this.prisma.materialReturnRecord.create({
      data: {
        id,
        weaverId: params.weaverId,
        batchId: params.batchId,
        receivedById: params.receivedById,
        status: MaterialReturnStatus.APPROVED,
        signatureCaptured: false,
        notes: "Auto-recorded: material weight returned with received saree",
        items: { create: itemsToCreate },
      },
      include: includeItems,
    });
  }

  // Same auto-close-out as createAutoReturnForReceipt above, but driven by
  // the saree's plain received weight instead of a per-material (warp/
  // resham/jari) split. Worker Staff's receive screen frequently enters only
  // the weight and skips the split panel, which meant the weight-only path
  // never drew down the weaver's outstanding balance at all — "Submitted"
  // stayed at 0 and "Outstanding" never moved from the full issued amount.
  // This pools the weight across whichever material types the weaver has
  // outstanding (largest first) rather than requiring the caller to say
  // which type the weight belongs to.
  async createAutoReturnForReceiptByWeight(params: {
    weaverId: string;
    batchId: string;
    receivedById: string;
    grams: number;
  }) {
    if (params.grams <= 0) {
      return null;
    }

    const groups = (await this.getOutstanding({ weaverId: params.weaverId }))
      .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
    const totalOutstanding = groups.reduce((sum, g) => sum + g.outstandingGrams, 0);

    if (totalOutstanding < params.grams) {
      throw new BadRequestException(
        `This weaver doesn't have that much material outstanding ` +
          `(has ${totalOutstanding}g outstanding, saree weighs ${params.grams}g) — ` +
          `check the entered weight or request more material from admin.`,
      );
    }

    const itemsToCreate: Prisma.MaterialReturnItemCreateWithoutReturnInput[] = [];
    let remaining = params.grams;
    for (const group of groups) {
      if (remaining <= 0) {
        break;
      }
      const draw = Math.min(group.outstandingGrams, remaining);
      if (draw <= 0) {
        continue;
      }
      itemsToCreate.push({
        materialType: group.materialType as MaterialType,
        warpSubtype: group.warpSubtype as WarpSubtype | null,
        quantity: draw,
        unit: "G",
        jariType: group.jariType,
        jariGrade: group.jariGrade as JariGrade | null,
        jariColor: group.jariColor,
      });
      remaining -= draw;
    }

    if (itemsToCreate.length === 0) {
      return null;
    }

    const weaver = await this.prisma.weaver.findUnique({ where: { id: params.weaverId } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${params.weaverId} not found`);
    }
    const parentCode = weaver.code ?? nameSegment(weaver.firstName, "Weaver");
    const id = await this.idGenerator.nextScoped(MRR_ID_PREFIX_BASE, parentCode);

    return this.prisma.materialReturnRecord.create({
      data: {
        id,
        weaverId: params.weaverId,
        batchId: params.batchId,
        receivedById: params.receivedById,
        status: MaterialReturnStatus.APPROVED,
        signatureCaptured: false,
        notes: "Auto-recorded: saree received weight drawn down from outstanding material",
        items: { create: itemsToCreate },
      },
      include: includeItems,
    });
  }
}
