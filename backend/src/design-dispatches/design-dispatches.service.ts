import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdGeneratorService } from '../id-generator/id-generator.service';
import { CreateDesignDispatchDto } from './dto/create-design-dispatch.dto';
import { PaginatedResult } from '../common/pagination';

@Injectable()
export class DesignDispatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateDesignDispatchDto) {
    const id = await this.idGenerator.nextFormatted('DISP');

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

    return dispatch;
  }

  async findAll(page: number, pageSize: number): Promise<PaginatedResult<any>> {
    const [items, total] = await this.prisma.$transaction([
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
}
