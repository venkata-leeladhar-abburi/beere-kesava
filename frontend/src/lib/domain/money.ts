/**
 * The money system — design-system/06-DOMAIN.md Part E.
 * ═══════════════════════════════════════════════════════════════════════════
 * The sole money formatter — `lib/formatters.ts`'s `formatINR`/
 * `formatINRDecimal` were retired once their last call site migrated here.
 * Money is stored as an integer number of paise, so `1234.567` rupees cannot
 * exist and float drift (`0.1 + 0.2 = 0.30000000000000004`) never reaches a
 * total.
 *
 * `<Money>` (shared/ui/domain/Money.tsx) and feature code both import
 * `formatMoney`/`rupees`/`paise` directly from here.
 */

/** A branded integer — passing a raw `number` where `Paise` is expected is a
 *  compile error, which is the whole point (Part B, M1). */
export type Paise = number & { readonly __brand: "Paise" };

const THOUSAND = 1_000;
const LAKH = 1_00_000; // 100,000
const CRORE = 1_00_00_000; // 10,000,000

/** Rupees (as entered by a human, or read from an API) → branded paise. */
export function rupees(r: number): Paise {
  return Math.round(r * 100) as Paise;
}

/** Paise → plain rupee number, for interop with non-money-aware code (e.g. a
 *  chart axis) that only accepts a `number`. */
export function toRupees(p: Paise): number {
  return p / 100;
}

/** Paise straight from an API/DB field that's already an integer paise count.
 *  Distinguished from `rupees()` so a caller can't accidentally double- or
 *  half-convert depending on what unit the backend actually sent. */
export function paise(p: number): Paise {
  return Math.round(p) as Paise;
}

export function addMoney(...values: Paise[]): Paise {
  return values.reduce((sum, v) => sum + v, 0) as Paise;
}

export function subMoney(a: Paise, b: Paise): Paise {
  return (a - b) as Paise;
}

/** Scale by a plain multiplier (e.g. quantity × unit rate) — the multiplier
 *  itself isn't money, so it stays a `number`. */
export function mulMoney(a: Paise, factor: number): Paise {
  return Math.round(a * factor) as Paise;
}

export function sumMoney(values: Paise[]): Paise {
  return addMoney(...values);
}

export interface MoneyOpts {
  /** Metric-card / chart-axis form: ₹12.4L, ₹5.00Cr. Never used on documents
   *  (Part F.3 — invoices always show the full figure). */
  compact?: boolean;
  /** Explicit decimal places for non-compact form. Screens: 0. Documents: 2.
   *  Defaults to 0 (Part E.3). */
  decimals?: number;
  /** Show a leading + for positive values (deltas). */
  sign?: boolean;
}

const TIERS = [
  { threshold: CRORE, divisor: CRORE, suffix: "Cr" },
  { threshold: LAKH, divisor: LAKH, suffix: "L" },
  { threshold: THOUSAND, divisor: THOUSAND, suffix: "K" },
] as const;

/** Rounds `value` to `d` decimals and reports whether that rounding crossed
 *  a threshold the caller needs to react to (tier promotion, or dropping to
 *  1 decimal instead of 2 — Part E.2's "never let rounding push us into the
 *  next tier's territory"). */
function roundTo(value: number, d: number): number {
  return Number(value.toFixed(d));
}

/**
 * design-system/06-DOMAIN.md Part E.2 — corrected, monotonic compact tiers.
 *
 * The spec's own pseudocode for this function doesn't quite reproduce the
 * spec's own worked examples (₹999 → `₹999`, not `₹999.0`; ₹9,99,999 →
 * `₹10.0L`, not `₹10.00L` — the same class of self-inconsistency the audit
 * calls out in the old implementation). This implementation is built to
 * satisfy the worked-example table exactly, verified in money.test.ts.
 */
export function formatMoney(amount: Paise, opts: MoneyOpts = {}): string {
  const rupeeValue = toRupees(amount);
  const { compact = false, decimals, sign = false } = opts;

  if (compact) {
    const abs = Math.abs(rupeeValue);
    // Minus always shows for negatives (before ₹, never parentheses — Part
    // E.4); `+` only shows for positives, and only when `sign` was asked for.
    const signPrefix = (n: number) => (n < 0 ? "-" : sign && n > 0 ? "+" : "");

    // Below ₹1,000 there is no tier suffix — show the exact rupee amount.
    const tier = TIERS.find((t) => abs >= t.threshold);
    if (!tier) {
      const whole = Math.round(abs);
      return `${signPrefix(rupeeValue)}₹${whole}`;
    }

    let tierIndex = TIERS.indexOf(tier);
    let value = abs / tier.divisor;
    let d = value < 10 ? 2 : 1;
    let shown = roundTo(value, d);

    // Rounding crossed from single- to double-digit within this tier
    // (e.g. 9.99999 → "10.00") — drop to 1 decimal, per the spec's own
    // ₹9,99,999 → `₹10.0L` example, not `₹10.00L`.
    if (d === 2 && shown >= 10) {
      d = 1;
      shown = roundTo(value, d);
    }

    // Rounding crossed into the next tier entirely (e.g. 99.96K → "100.0K",
    // which is ₹1,00,000 and belongs in L, not K) — promote one tier up.
    if (shown >= 100 && tierIndex > 0) {
      tierIndex -= 1;
      const promoted = TIERS[tierIndex];
      value = abs / promoted.divisor;
      d = value < 10 ? 2 : 1;
      shown = roundTo(value, d);
      return `${signPrefix(rupeeValue)}₹${shown.toFixed(d)}${promoted.suffix}`;
    }

    return `${signPrefix(rupeeValue)}₹${shown.toFixed(d)}${tier.suffix}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
    signDisplay: sign ? "exceptZero" : "auto",
  }).format(rupeeValue);
}
