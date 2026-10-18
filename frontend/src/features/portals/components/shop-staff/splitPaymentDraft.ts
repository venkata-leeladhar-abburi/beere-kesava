/**
 * The payment step's split-payment entry, before it becomes legs.
 * ═══════════════════════════════════════════════════════════════════════════
 * The common case is two methods — part cash, part UPI — and the operator
 * should type one number, not two. So one row at a time is "auto": it has no
 * amount of its own and always shows whatever is left of the bill after the
 * other rows. The newest row the operator has not typed into is the auto one;
 * typing into it makes it an ordinary row. Because the auto amount is derived,
 * not stored, it follows the bill total if prices are edited afterwards.
 */
import {
  legsShortfall,
  paymentMethodLabel,
  type CounterPaymentMethod,
  type PaymentLeg,
} from "../../../../lib/domain/salePayment";

export interface SplitDraftRow {
  method: CounterPaymentMethod;
  /** What the operator typed; null = the auto row, which takes the rest. */
  amount: string | null;
  reference: string;
}

/** Up to 2 decimals, no sign, no grouping — what the amount field accepts. */
const AMOUNT_PATTERN = /^\d+(\.\d{0,2})?$/;

const toPaise = (n: number) => Math.round(n * 100);

/** A typed amount in rupees, or null when it is not a valid amount. */
export function parseAmount(raw: string): number | null {
  const v = raw.replace(/[,\s₹]/g, "");
  if (!AMOUNT_PATTERN.test(v)) return null;
  return Number(v);
}

/** The auto row's amount: what the other rows leave of `total`, never below 0. */
function autoAmount(rows: SplitDraftRow[], total: number): number {
  const others = rows.reduce((sum, r) => {
    if (r.amount === null) return sum;
    return sum + toPaise(parseAmount(r.amount) ?? 0);
  }, 0);
  return Math.max(0, toPaise(total) - others) / 100;
}

/** Every row's amount as it currently stands (the auto row resolved). */
export function rowAmounts(rows: SplitDraftRow[], total: number): (number | null)[] {
  const auto = autoAmount(rows, total);
  return rows.map((r) =>
    r.amount === null ? auto : r.amount.trim() === "" ? 0 : parseAmount(r.amount)
  );
}

/** Adds a method; it becomes the auto row, and the old auto row keeps its value. */
export function addRow(
  rows: SplitDraftRow[],
  method: CounterPaymentMethod,
  total: number
): SplitDraftRow[] {
  if (rows.some((r) => r.method === method)) return rows;
  const auto = autoAmount(rows, total);
  return [
    ...rows.map((r) => (r.amount === null ? { ...r, amount: formatAmount(auto) } : r)),
    { method, amount: null, reference: "" },
  ];
}

export const removeRow = (rows: SplitDraftRow[], method: CounterPaymentMethod) =>
  rows.filter((r) => r.method !== method);

export const setRowAmount = (rows: SplitDraftRow[], method: CounterPaymentMethod, amount: string) =>
  rows.map((r) => (r.method === method ? { ...r, amount } : r));

export const setRowReference = (
  rows: SplitDraftRow[],
  method: CounterPaymentMethod,
  reference: string
) => rows.map((r) => (r.method === method ? { ...r, reference } : r));

/** Sets one row to whatever the bill still needs on top of the others. */
export function fillRemaining(
  rows: SplitDraftRow[],
  method: CounterPaymentMethod,
  total: number
): SplitDraftRow[] {
  const amounts = rowAmounts(rows, total);
  const others = rows.reduce(
    (sum, r, i) => (r.method === method ? sum : sum + toPaise(amounts[i] ?? 0)),
    0
  );
  const rest = Math.max(0, toPaise(total) - others) / 100;
  return setRowAmount(rows, method, formatAmount(rest));
}

/** 600 → "600", 600.5 → "600.50" — how an amount is written back into a field. */
export function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Takes what was already recorded off each row — after a basket partly went
 * through, the retry only has to collect what is left.
 */
export function deductRecorded(
  rows: SplitDraftRow[],
  used: PaymentLeg[],
  total: number
): SplitDraftRow[] {
  const amounts = rowAmounts(rows, total);
  return rows.map((r, i) => {
    const spent = used
      .filter((u) => u.method === r.method)
      .reduce((sum, u) => sum + toPaise(u.amount), 0);
    const left = Math.max(0, toPaise(amounts[i] ?? 0) - spent) / 100;
    return { ...r, amount: formatAmount(left) };
  });
}

export interface SplitCheck {
  legs: PaymentLeg[];
  /** Rupees still to allocate: positive = short, negative = over. */
  shortfall: number;
  /** Why the split can't be used yet, or null when it is ready. */
  problem: string | null;
}

const money = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** The rows as payment legs, plus whether they cover the bill exactly. */
export function checkSplit(rows: SplitDraftRow[], total: number): SplitCheck {
  const amounts = rowAmounts(rows, total);
  const legs: PaymentLeg[] = rows.map((r, i) => ({
    method: r.method,
    amount: amounts[i] ?? 0,
    reference: r.reference.trim() || null,
  }));
  const shortfall = legsShortfall(total, legs);
  const invalid = rows.find((_r, i) => amounts[i] === null);
  const empty = rows.find((_r, i) => amounts[i] === 0);
  let problem: string | null = null;
  if (rows.length < 2) problem = "Pick at least two methods to split the payment";
  else if (invalid) problem = `Enter a valid amount for ${paymentMethodLabel(invalid.method)}`;
  else if (empty) problem = `Enter an amount for ${paymentMethodLabel(empty.method)}, or remove it`;
  else if (shortfall > 0) problem = `${money(shortfall)} still to be allocated`;
  else if (shortfall < 0) problem = `${money(-shortfall)} more than the total — reduce an amount`;
  return { legs, shortfall, problem };
}
