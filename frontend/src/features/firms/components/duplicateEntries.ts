import type { FirmPayment } from "../../../shared/api/firms";
import type { FinancialEntry, MiscEntry } from "../contexts/FirmsContext";

/**
 * Legacy-duplicate detection for manual firm entries.
 *
 * Before payments were auto-tracked against a firm, the only way to get a
 * vendor/weaver/customer payment onto a firm's ledger was to type it in by
 * hand. Those hand-typed rows still exist — and now that the same payment is
 * also pulled in automatically, both count, silently doubling the firm's
 * expense figure.
 *
 * This flags the overlap; it never removes anything. A match is a *suspicion*
 * shown to the user, because two genuinely separate payments of the same
 * amount to the same party in the same week are perfectly possible — only a
 * person can tell those apart, so only a person deletes.
 */

/** Same amount to the paise, and within this many days of the payment. */
const DAY_WINDOW = 3;
const MS_PER_DAY = 86_400_000;

function daysApart(a: string, b: string): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return Number.POSITIVE_INFINITY;
  return Math.abs(ta - tb) / MS_PER_DAY;
}

function sameAmount(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

/** Loose containment both ways — "Sree Ganesha Silks" vs "Vendor payment — Sree Ganesha Silks (PO-2026-001)". */
function mentionsParty(text: string, party: string): boolean {
  const haystack = text.toLowerCase();
  const needle = party.trim().toLowerCase();
  if (needle.length < 3) return false;
  if (haystack.includes(needle)) return true;
  // Fall back to the party's most distinctive word, so "Sree Ganesha Silks
  // Pvt Ltd" still matches a description that wrote it as "Sree Ganesha".
  const longest = needle.split(/\s+/).filter(w => w.length >= 4).sort((a, b) => b.length - a.length)[0];
  return longest ? haystack.includes(longest) : false;
}

export interface DuplicateMatch {
  /** The auto-tracked payment this manual entry appears to restate. */
  payment: FirmPayment;
}

/**
 * Maps manual entry id → the auto-tracked payment it looks like a duplicate
 * of. An entry qualifies only when amount, direction, date proximity AND the
 * party name all line up — three of four would flag far too much.
 */
export function findDuplicateEntries(
  entries: (FinancialEntry | MiscEntry)[],
  payments: FirmPayment[],
  direction: "INCOME" | "EXPENSE",
): Map<string, DuplicateMatch> {
  const matches = new Map<string, DuplicateMatch>();
  const candidates = payments.filter(p => p.direction === direction);
  if (candidates.length === 0) return matches;

  // One payment can only explain one manual entry — otherwise a single ₹2,000
  // payment would flag every ₹2,000 entry in the same week.
  const claimed = new Set<string>();

  for (const entry of entries) {
    const hit = candidates.find(p =>
      !claimed.has(p.id) &&
      sameAmount(p.amount, entry.amount) &&
      daysApart(p.date, entry.date) <= DAY_WINDOW &&
      mentionsParty(entry.description, p.party),
    );
    if (hit) {
      claimed.add(hit.id);
      matches.set(entry.id, { payment: hit });
    }
  }

  return matches;
}
