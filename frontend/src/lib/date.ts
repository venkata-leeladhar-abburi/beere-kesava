/**
 * Today's date as YYYY-MM-DD.
 *
 * `new Date().toISOString().split("T")[0]` is scattered across the contexts
 * (FirmsContext, POContext, BulkOrderContext, ...) as an inline expression.
 * Under `noUncheckedIndexedAccess` that indexed split is `string | undefined`
 * to the type system even though it can never actually be empty — `toISOString()`
 * always contains "T". Centralizing it here means the narrowing happens once.
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}
