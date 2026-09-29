/**
 * Canonical form of a mobile number: digits only, last 10 kept.
 *
 * The same person's number reaches us in several shapes ("9876543210",
 * "+91 98765 43210", "091-9876543210"). Stored verbatim they are distinct
 * values, so User.mobile's @unique constraint lets the same real number be
 * assigned to two different admins — while login (AuthService.cleanPhone,
 * which normalises the same way) then resolves that number to whichever row
 * it happens to match first. Normalising on write is what keeps the unique
 * constraint meaningful.
 */
export function normalizeMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * DTO transform for an optional contact phone: blank becomes "not given"
 * (undefined, so the column stays null rather than holding ""), anything
 * else is stored in the canonical last-10-digits form. Non-strings pass
 * through untouched so @IsString still rejects them.
 */
export function normalizeOptionalMobile({ value }: { value: unknown }): unknown {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? undefined : normalizeMobile(value);
}
