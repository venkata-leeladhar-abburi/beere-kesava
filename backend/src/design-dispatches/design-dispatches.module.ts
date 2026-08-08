import { Module } from '@nestjs/common';
import { DesignDispatchesService } from './design-dispatches.service';
import { DesignDispatchesController } from './design-dispatches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IdGeneratorModule } from '../id-generator/id-generator.module';

@Module({
  imports: [PrismaModule, IdGeneratorModule],
  controllers: [DesignDispatchesController],
  providers: [DesignDispatchesService],
})
export class DesignDispatchesModule {}
