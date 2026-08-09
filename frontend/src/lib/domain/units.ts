/**
 * Quantities & units — design-system/06-DOMAIN.md Part F.1.
 * ═══════════════════════════════════════════════════════════════════════════
 * Weight and length auto-promote to the next unit past 1,000 base units
 * (grams → kg, metres → km); count units (sarees, batches, looms, …)
 * pluralise instead and never promote. `<Quantity>` (shared/ui/domain) is
 * the only consumer that should need this directly.
 */

const WEIGHT_BASE_UNIT = "g";
const LENGTH_BASE_UNIT = "m";

/** Units that never pluralise even at count > 1 (they're a measure, not a
 *  countable noun) — e.g. yarn count in denier. */
const INVARIANT_UNITS = new Set(["denier", "kg", "km", "m", "g"]);

export interface FormattedQuantity {
  value: number;
  unit: string;
  decimals: number;
}

/** Simple English pluralisation covering the domain's actual nouns
 *  (saree → sarees, batch → batches, loom → looms, weaver → weavers). Not a
 *  general-purpose NLP pluraliser — extend the exception list below if a
 *  new irregular noun shows up. */
const IRREGULAR_PLURALS: Record<string, string> = {
  loom: "looms",
};

export function pluralize(noun: string, count: number): string {
  if (count === 1) return noun;
  if (IRREGULAR_PLURALS[noun]) return IRREGULAR_PLURALS[noun];
  if (/[sxz]$|[cs]h$/.test(noun)) return `${noun}es`;
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}s`;
}

/**
 * Resolves a raw value + base unit into its display form: promotes weight/
 * length past 1,000 base units, pluralises count nouns, applies the
 * per-unit decimal rule from Part F.1's table.
 */
export function resolveQuantity(value: number, unit: string): FormattedQuantity {
  if (unit === WEIGHT_BASE_UNIT) {
    if (Math.abs(value) >= 1000) return { value: value / 1000, unit: "kg", decimals: 2 };
    return { value, unit: "g", decimals: 0 };
  }

  if (unit === LENGTH_BASE_UNIT) {
    if (Math.abs(value) >= 1000) return { value: value / 1000, unit: "km", decimals: 1 };
    return { value, unit: "m", decimals: 1 };
  }

  if (INVARIANT_UNITS.has(unit)) {
    return { value, unit, decimals: 0 };
  }

  // Count / yarn-count style unit — pluralise, no promotion, 0 decimals.
  return { value, unit: pluralize(unit, value), decimals: 0 };
}

/** `formatQuantity(1240, "g")` → `"1.24 kg"`; `formatQuantity(18, "saree")`
 *  → `"18 sarees"`. Non-JSX convenience wrapper around `resolveQuantity`
 *  for contexts that need a plain string (CSV export, aria-label, toast). */
export function formatQuantity(value: number, unit: string): string {
  const q = resolveQuantity(value, unit);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: q.decimals,
    maximumFractionDigits: q.decimals,
  }).format(q.value);
  return `${formatted} ${q.unit}`;
}
