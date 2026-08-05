import { Module } from "@nestjs/common";
import { MaterialIssuesController } from "./material-issues.controller";
import { MaterialIssuesService } from "./material-issues.service";

@Module({
  controllers: [MaterialIssuesController],
  providers: [MaterialIssuesService],
  exports: [MaterialIssuesService],
})
export class MaterialIssuesModule {}
