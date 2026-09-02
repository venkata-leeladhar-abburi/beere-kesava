import { Module } from '@nestjs/common';
import { DesignDispatchesService } from './design-dispatches.service';
import { DesignDispatchesController } from './design-dispatches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IdGeneratorModule } from '../id-generator/id-generator.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, IdGeneratorModule, NotificationsModule],
  controllers: [DesignDispatchesController],
  providers: [DesignDispatchesService],
})
export class DesignDispatchesModule {}
