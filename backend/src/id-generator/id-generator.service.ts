import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Generates collision-safe, DB-side sequential business IDs (EMP-NNN, PO-2026-NNN, ...).
 * Uses an atomic INSERT ... ON CONFLICT DO UPDATE so concurrent requests for the
 * same prefix never receive the same sequence number.
 * See Backend_Architecture_Design.pdf §6.1 — IDs must never be invented client-side.
 */
@Injectable()
export class IdGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async next(prefix: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO "IdCounter" (prefix, value)
      VALUES (${prefix}, 1)
      ON CONFLICT (prefix) DO UPDATE SET value = "IdCounter".value + 1
      RETURNING value;
    `;
    return rows[0].value;
  }

  async nextFormatted(prefix: string, padLength = 3): Promise<string> {
    const value = await this.next(prefix);
    return `${prefix}-${String(value).padStart(padLength, "0")}`;
  }
}
