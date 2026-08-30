import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { MaterialIssuesController } from "./material-issues.controller";
import { MaterialIssuesService } from "./material-issues.service";

@Module({
  imports: [NotificationsModule],
  controllers: [MaterialIssuesController],
  providers: [MaterialIssuesService],
  exports: [MaterialIssuesService],
})
export class MaterialIssuesModule {}
