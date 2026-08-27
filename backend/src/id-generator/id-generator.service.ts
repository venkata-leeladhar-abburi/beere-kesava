import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** Every business ID in the system pads its sequence to this many digits. */
export const ID_PAD_LENGTH = 3;

/**
 * Indian financial year code for a date — "2627" for 1 Apr 2026 to 31 Mar 2027.
 * Mirrors the frontend's financialYearCode (lib/domain/codes.ts) so a year-scoped
 * id reads the same on both sides.
 */
export function financialYearCode(date: Date = new Date()): string {
  const year = date.getMonth() >= 3 /* April */ ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(year).slice(2)}${String(year + 1).slice(2)}`;
}

/** Strips anything that can't appear in an id segment and capitalises the word. */
function cleanWord(word: string): string {
  const stripped = word.replace(/[^A-Za-z0-9]/g, "");
  return stripped ? stripped[0].toUpperCase() + stripped.slice(1) : "";
}

/**
 * Turns a person's name into the name segment of a business ID: first word only.
 * "padma veni" -> "Padma", "Shiva Traders & Co" -> "Shiva".
 * Used where the id carries a first name (weavers, retail customers).
 * Falls back to `fallback` when the name has no usable characters, so a code is
 * never generated with an empty segment (which would produce ids like "-001").
 */
export function nameSegment(name: string, fallback = "Unknown"): string {
  return cleanWord(name.trim().split(/\s+/)[0] ?? "") || fallback;
}

/**
 * Turns a full business name into one compact segment, keeping every word and
 * capitalising each: "Sree ganesh silks" -> "SreeGaneshSilks". Used where the
 * whole business name is part of the id (suppliers, vendors, wholesale customers).
 */
export function businessSegment(name: string, fallback = "Unknown"): string {
  return name.trim().split(/\s+/).map(cleanWord).join("") || fallback;
}

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

  async nextFormatted(prefix: string, padLength = ID_PAD_LENGTH): Promise<string> {
    const value = await this.next(prefix);
    return `${prefix}-${String(value).padStart(padLength, "0")}`;
  }

  /**
   * "<segment>-NNN", where the sequence is one counter shared across the whole
   * entity type rather than per name — e.g.
   * nextNamed("SUPPLIER", businessSegment("Shiva Traders")) yields
   * "ShivaTraders-001", and the next supplier of any name gets "-002".
   *
   * `counterKey` names the counter row, so it stays stable even though the
   * visible prefix changes with each record's own name.
   */
  async nextNamed(counterKey: string, segment: string, padLength = ID_PAD_LENGTH): Promise<string> {
    const value = await this.next(counterKey);
    return `${segment}-${String(value).padStart(padLength, "0")}`;
  }

  /**
   * Sequence scoped to a single parent record, for composite transaction ids that
   * embed the parent's own code — e.g. nextScoped("ORD", "SreeGanesh-001") yields
   * "ORD-SreeGanesh-001-001", then "-002" for that same customer's next order,
   * while a different customer's first order still starts at "-001".
   *
   * The counter row is keyed "<prefix>:<parentCode>" so each parent gets its own
   * independent sequence, reusing the same atomic upsert (and the same IdCounter
   * table) as the global counters above — no separate storage or locking needed.
   * The ":" separator is deliberate: it cannot appear in a generated code, so a
   * scoped counter key can never collide with a plain global prefix.
   */
  async nextScoped(prefix: string, parentCode: string, padLength = ID_PAD_LENGTH): Promise<string> {
    const value = await this.next(`${prefix}:${parentCode}`);
    return `${prefix}-${parentCode}-${String(value).padStart(padLength, "0")}`;
  }
}
