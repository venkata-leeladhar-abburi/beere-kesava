import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService, businessSegment, nameSegment } from '../id-generator/id-generator.service';
import { CreateDesignDispatchDto } from './dto/create-design-dispatch.dto';
import { UpdateDesignDispatchDto } from './dto/update-design-dispatch.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../common/pagination';
import { DesignDispatch } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DesignDispatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateDesignDispatchDto) {
    // recipientId is a Weaver.id for weavers, but only a free-text loom label
    // for factory looms (see DesignLibraryContext.tsx) — resolve to the
    // recipient's real Tier-1 code where possible, falling back to a segment
    // derived from the human-entered name so the id is never left unscoped.
    let parentCode: string;
    if (dto.recipientType === 'WEAVER') {
      const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.recipientId } });
      parentCode = weaver?.code ?? nameSegment(dto.recipientName, 'Dispatch');
    } else {
      const loom = await this.prisma.factoryLoom.findFirst({
        where: { OR: [{ id: dto.recipientId }, { loomNumber: dto.recipientId }, { loomNumber: dto.recipientName }] },
      });
      parentCode = loom?.code ?? businessSegment(dto.recipientName, 'Dispatch');
    }
    const id = await this.idGenerator.nextScoped('DISP', parentCode);

    const dispatch = await this.prisma.designDispatch.create({
      data: {
        id,
        recipientType: dto.recipientType,
        recipientId: dto.recipientId,
        recipientName: dto.recipientName,
        instructions: dto.instructions,
        colorSlipImageUrl: dto.colorSlipImageUrl,
        designGraphImageUrl: dto.designGraphImageUrl,
        batches: dto.batches,
      },
    });

    // Only a WEAVER recipient has a portal account to push to — a factory
    // loom is a place, not a login, so those dispatches stay silent.
    if (dto.recipientType === 'WEAVER') {
      await this.notifications.notifyWeaver(dto.recipientId, 'WEAVER_DESIGN_ASSIGNED', {
        designDispatchId: dispatch.id,
        recipientName: dispatch.recipientName,
        instructions: dispatch.instructions,
      });
    }

    return dispatch;
  }

  async findAll(page: number, pageSize: number): Promise<PaginatedResult<DesignDispatch>> {
    const [items, total] = await Promise.all([
      this.prisma.designDispatch.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.designDispatch.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async findByWeaver(weaverId: string) {
    return this.prisma.designDispatch.findMany({
      where: {
        recipientType: 'WEAVER',
        recipientId: weaverId,
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateDesignDispatchDto) {
    await this.ensureExists(id);
    return this.prisma.designDispatch.update({
      where: { id },
      data: {
        instructions: dto.instructions,
        colorSlipImageUrl: dto.colorSlipImageUrl,
        designGraphImageUrl: dto.designGraphImageUrl,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.designDispatch.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(id: string) {
    const dispatch = await this.prisma.designDispatch.findUnique({ where: { id } });
    if (!dispatch) {
      throw new NotFoundException(`Design dispatch ${id} not found`);
    }
    return dispatch;
  }
}
