/**
 * External-purchase saree codes — the server's copy of the frontend's
 * supplierPrefix / buildSareeCode (frontend/src/features/suppliers/contexts/
 * supplier-types.ts). The two must produce the same code for the same inputs:
 * the frontend names a new line, this side re-names it when the short name or
 * invoice number it was built from changes. saree-codes.spec.ts pins both to
 * the same examples.
 *
 *   line code   {PREFIX}-{INVOICE}-{SERIAL}     RAVI-34-003
 *   piece code  {line code}-{PIECE}             RAVI-34-003-01
 */

/** Supplier segment: the short name, uppercased, letters and digits only;
 *  with no short name, the first four letters of the name (padded with X). */
export function supplierPrefix(name: string | null | undefined, shortName: string | null | undefined): string {
  const short = (shortName || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (short) return short;
  const letters = (name || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters.slice(0, 4) || "SUPP").padEnd(4, "X");
}

/** Invoice segment: the invoice number as typed, trimmed; NOINV when blank. */
export function invoiceSegment(invoiceNumber: string | null | undefined): string {
  return (invoiceNumber || "").trim() || "NOINV";
}

/** The serial a line code ends with ("RAVI-INV-2026-12-003" → "003"). The
 *  invoice is free text with its own dashes, so it is read from the end. */
export function lineSerial(lineCode: string): string | null {
  return lineCode.match(/-(\d{3,4})$/)?.[1] ?? null;
}

/** Splits a piece code into its line code and piece-number suffix. */
export function splitPieceCode(code: string): { lineCode: string; pieceSuffix: string } | null {
  const m = code.match(/^(.+)-(\d{2,})$/);
  return m ? { lineCode: m[1], pieceSuffix: m[2] } : null;
}

export interface LineRename {
  id: string;
  oldCode: string;
  newCode: string;
}

/**
 * Which of a purchase's lines need a new code for the given supplier prefix
 * and invoice number. The serial is kept — it's printed on the tag and is
 * the line's position in the purchase. A line whose code isn't in the
 * standard shape (no trailing serial) is left alone rather than guessed at.
 */
export function planLineRenames(
  lines: { id: string; code: string }[],
  prefix: string,
  invoiceNumber: string | null | undefined,
): LineRename[] {
  const inv = invoiceSegment(invoiceNumber);
  const out: LineRename[] = [];
  for (const l of lines) {
    const serial = lineSerial(l.code);
    if (!serial) continue;
    const next = `${prefix}-${inv}-${serial}`;
    if (next !== l.code) out.push({ id: l.id, oldCode: l.code, newCode: next });
  }
  return out;
}

/**
 * Collapses alias chains. `existing` maps old → current code for aliases
 * already recorded; `renames` are the codes changing now. Returns every
 * alias row that should exist afterwards for the codes involved: each
 * renamed code points at its new code, and anything that pointed at a
 * renamed code now points at that code's new one (so A→B then B→C leaves
 * A→C and B→C, never a two-hop chain). A code that is live again after the
 * change can't also be an alias, so those are dropped.
 */
export function mergeAliases(
  existing: { oldCode: string; newCode: string }[],
  renames: { oldCode: string; newCode: string }[],
  liveCodes: Set<string>,
): { upsert: { oldCode: string; newCode: string }[]; remove: string[] } {
  const next = new Map(renames.map((r) => [r.oldCode, r.newCode]));
  const result = new Map<string, string>();
  for (const a of existing) result.set(a.oldCode, next.get(a.newCode) ?? a.newCode);
  for (const r of renames) result.set(r.oldCode, r.newCode);
  const upsert: { oldCode: string; newCode: string }[] = [];
  const remove: string[] = [];
  for (const [oldCode, newCode] of result) {
    if (liveCodes.has(oldCode) || oldCode === newCode) remove.push(oldCode);
    else upsert.push({ oldCode, newCode });
  }
  return { upsert, remove };
}
