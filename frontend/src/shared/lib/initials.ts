/**
 * Single source of truth for avatar initials.
 *
 * Profile pips are fixed-diameter circles, so anything longer than two glyphs
 * overflows and gets clipped mid-word ("Ramarao Abburi" rendering as "AMARA").
 * The backend's `initials` column is not reliably two letters — several rows
 * hold a whole first name — so trimming at the render boundary is the only
 * place that can guarantee it for every page at once.
 *
 * Accepts either a full name or an already-abbreviated string:
 *   "Ramarao Abburi" → "RA"     (first + last initial)
 *   "Swarna Rajasekhar Rao" → "SR"  (first + last, middle names ignored)
 *   "RAMARAO"        → "RA"     (already-joined initials, just capped)
 *   ""/undefined     → fallback (default "?")
 */
export function toInitials(nameOrInitials?: string | null, fallback = "?"): string {
  if (!nameOrInitials) return fallback;
  const raw = nameOrInitials.trim();
  // Preserve deliberate placeholders like "—" rather than mangling them.
  if (raw === "—" || raw === "-") return raw;

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
