import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get("health")
  async health() {
    // The query time doubles as a quick region check: roughly 60-100 ms means
    // the server sits next to the database (Mumbai); 200+ ms means it is far.
    const start = process.hrtime.bigint();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
    return { status: "ok", database: "connected", dbMs };
  }
}
