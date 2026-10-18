/**
 * How a counter sale was paid — one method, or a bill split across several.
 * ═══════════════════════════════════════════════════════════════════════════
 * A single-method sale stores its method and reference on the SaleRecord
 * itself (`paymentMethod` / `paymentRef`). A bill paid with more than one
 * method — part cash, part UPI — is recorded with `paymentMethod: "split"`,
 * and each saree on it carries its share of every method in `payments`; the
 * shares add up to the saree's `amount` exactly.
 *
 * Everything here reads both shapes the same way, as a list of legs, so a
 * screen never has to care which kind of sale it is looking at. Decimals
 * arrive as strings (Prisma Decimal), so all sums are on integer paise.
 */
import { formatMoneyExact, rupees } from "./money";

/** Methods the counter takes. */
export const COUNTER_PAYMENT_METHODS = ["cash", "upi", "card", "other"] as const;
export type CounterPaymentMethod = (typeof COUNTER_PAYMENT_METHODS)[number];

/** `paymentMethod` on a sale whose bill was paid with several methods. */
export const SPLIT_PAYMENT = "split";

/** One method's share of what was paid. */
export interface PaymentLeg {
  method: string;
  /** Rupees. */
  amount: number;
  reference?: string | null;
}

/** The payment fields a stored sale carries. */
export interface SalePaymentFields {
  amount: string | number;
  paymentMethod: string | null;
  paymentRef: string | null;
  payments?: { method: string; amount: string | number; reference?: string | null }[] | null;
}

const toPaise = (v: string | number | null | undefined) => Math.round((Number(v ?? 0) || 0) * 100);

const LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  other: "Other",
  split: "Split",
};

/** "upi" → "UPI", "split" → "Split", "bank_transfer" → "Bank Transfer"; "" for none. */
export function paymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? "").trim().toLowerCase();
  if (!m) return "";
  return (
    LABELS[m] ??
    m
      .split(/[\s_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export const isSplitPayment = (method: string | null | undefined) =>
  (method ?? "").trim().toLowerCase() === SPLIT_PAYMENT;

/** Cash, UPI, Card, Other, then anything else alphabetically. */
function methodOrder(a: string, b: string): number {
  const ia = COUNTER_PAYMENT_METHODS.indexOf(a as CounterPaymentMethod);
  const ib = COUNTER_PAYMENT_METHODS.indexOf(b as CounterPaymentMethod);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

/**
 * How one stored sale was paid, as legs. A split sale is its `payments`; a
 * single-method sale is one leg for its whole amount; a sale with no method
 * recorded (older rows) is no legs at all.
 */
export function saleLegs(sale: SalePaymentFields): PaymentLeg[] {
  if (sale.payments && sale.payments.length > 0) {
    return sale.payments
      .map((p) => ({
        method: p.method,
        amount: toPaise(p.amount) / 100,
        reference: p.reference ?? null,
      }))
      .sort((a, b) => methodOrder(a.method, b.method));
  }
  const method = (sale.paymentMethod ?? "").trim().toLowerCase();
  if (!method || method === SPLIT_PAYMENT) return [];
  return [{ method, amount: toPaise(sale.amount) / 100, reference: sale.paymentRef ?? null }];
}

/**
 * Legs summed by method — a whole bill's split from its sarees' shares.
 * References for one method are kept once each, comma-separated.
 */
export function mergeLegs(legs: PaymentLeg[]): PaymentLeg[] {
  const byMethod = new Map<string, { paise: number; refs: string[] }>();
  for (const leg of legs) {
    const key = leg.method.trim().toLowerCase();
    const entry = byMethod.get(key) ?? { paise: 0, refs: [] };
    entry.paise += toPaise(leg.amount);
    const ref = leg.reference?.trim();
    if (ref) for (const r of ref.split(/,\s*/)) if (!entry.refs.includes(r)) entry.refs.push(r);
    byMethod.set(key, entry);
  }
  return [...byMethod]
    .map(([method, e]) => ({ method, amount: e.paise / 100, reference: e.refs.join(", ") || null }))
    .sort((a, b) => methodOrder(a.method, b.method));
}

/** The whole bill's legs, from every sale on it. */
export const billLegs = (sales: SalePaymentFields[]): PaymentLeg[] =>
  mergeLegs(sales.flatMap(saleLegs));

const money = (n: number) => formatMoneyExact(rupees(n));

/**
 * "Cash", or "Cash ₹600 + UPI ₹1,000" when there is more than one leg.
 * `fallback` when there are no legs at all (no method recorded).
 */
export function legsSummary(legs: PaymentLeg[], fallback = "—"): string {
  if (legs.length === 0) return fallback;
  if (legs.length === 1) return paymentMethodLabel(legs[0]!.method);
  return legs.map((l) => `${paymentMethodLabel(l.method)} ${money(l.amount)}`).join(" + ");
}

/** How one stored sale was paid, in words — see `legsSummary`. */
export const salePaymentText = (sale: SalePaymentFields, fallback = "—"): string =>
  isSplitPayment(sale.paymentMethod) && !sale.payments?.length
    ? "Split"
    : legsSummary(saleLegs(sale), fallback);

/**
 * Shares a bill's split out across its sarees, so each saree can be recorded
 * with what was paid for it in each method.
 *
 * Every saree gets the same mix as the bill (a ₹1,000 saree on a bill paid
 * 40% cash carries ₹400 cash), worked on paise so nothing is lost to
 * rounding: each saree's shares add up to its amount exactly, and each
 * method's shares add up to that method's total exactly. Requires the legs
 * to add up to the line amounts — check with `legsMatchTotal` first.
 *
 * A saree takes from a method at most what the method still has left, so no
 * share is ever negative. Zero shares are dropped.
 */
export function allocateLegs(lineAmounts: number[], legs: PaymentLeg[]): PaymentLeg[][] {
  const remaining = legs.map((l) => toPaise(l.amount));
  let remainingTotal = remaining.reduce((a, b) => a + b, 0);
  return lineAmounts.map((amount, i) => {
    const linePaise = toPaise(amount);
    const isLast = i === lineAmounts.length - 1;
    let shares: number[];
    if (isLast || remainingTotal <= 0) {
      shares = isLast ? [...remaining] : remaining.map(() => 0);
    } else {
      // Largest remainder: floor every exact share, then hand the paise left
      // over to the largest fractions. Since the line never exceeds what is
      // left, a share never exceeds its method's remainder.
      const exact = remaining.map((r) => (r * linePaise) / remainingTotal);
      shares = exact.map(Math.floor);
      let left = linePaise - shares.reduce((a, b) => a + b, 0);
      const byFraction = exact
        .map((x, j) => ({ j, f: x - Math.floor(x) }))
        .sort((a, b) => b.f - a.f || a.j - b.j);
      for (const { j } of byFraction) {
        if (left <= 0) break;
        if (shares[j]! < remaining[j]!) {
          shares[j]! += 1;
          left -= 1;
        }
      }
    }
    shares.forEach((s, j) => {
      remaining[j]! -= s;
    });
    remainingTotal -= shares.reduce((a, b) => a + b, 0);
    return legs
      .map((l, j) => ({
        method: l.method,
        amount: shares[j]! / 100,
        reference: l.reference ?? null,
      }))
      .filter((l) => l.amount > 0);
  });
}

/** Paise still to be allocated: positive = short, negative = over, 0 = exact. */
export const legsShortfall = (total: number, legs: PaymentLeg[]): number =>
  (toPaise(total) - legs.reduce((sum, l) => sum + toPaise(l.amount), 0)) / 100;

/** True when the legs add up to `total` to the paisa. */
export const legsMatchTotal = (total: number, legs: PaymentLeg[]): boolean =>
  toPaise(total) === legs.reduce((sum, l) => sum + toPaise(l.amount), 0);
