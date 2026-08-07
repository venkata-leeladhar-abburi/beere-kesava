/**
 * Gap-filling ID helper for human-facing identity IDs (weaver/staff/admin
 * codes) — deliberately the opposite of IdGeneratorService's atomic,
 * never-reused counters used for business/transaction IDs (PO-2026-NNN,
 * BATCH-NNN, etc). Here, deleting a record frees its number for reuse by
 * the next record of the same kind, so the id always reflects "how many of
 * this kind currently exist" rather than "how many have ever existed".
 *
 * Not perfectly race-safe under concurrent creates (two simultaneous
 * requests could compute the same lowest gap) — acceptable for this scale
 * of internal admin tool; a unique constraint on the target column still
 * guarantees no duplicate ever gets persisted, just a possible retry.
 */

/** Smallest positive integer (>=1) not present in `used`. */
export function nextAvailableSequenceNumber(used: Iterable<number>): number {
  const usedSet = new Set(used);
  let n = 1;
  while (usedSet.has(n)) n++;
  return n;
}

export function formatSequenceId(prefix: string, n: number, width = 3): string {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

/** Extracts the numeric suffix from ids matching exactly `${prefix}-NNN`; anything else (legacy/seed ids) is ignored. */
export function extractSequenceNumbers(ids: string[], prefix: string): number[] {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  return ids
    .map((id) => re.exec(id)?.[1])
    .filter((v): v is string => !!v)
    .map(Number);
}

export function nextSequenceId(existingIds: string[], prefix: string, width = 3): string {
  const used = extractSequenceNumbers(existingIds, prefix);
  return formatSequenceId(prefix, nextAvailableSequenceNumber(used), width);
}
