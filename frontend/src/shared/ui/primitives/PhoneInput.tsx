import * as React from "react";

import { Input, type InputProps } from "./Input";

/** Indian mobile numbers are exactly 10 digits — the same length the backend stores. */
export const PHONE_DIGITS = 10;

/**
 * Digits only, capped at 10 — the last 10 if more arrive.
 *
 * Pasting "+91 98765 43210" or "091-9876543210" therefore lands as
 * "9876543210" rather than being truncated from the front into a wrong
 * number. This mirrors normalizeMobile() on the backend (common/phone.util.ts),
 * which keeps the trailing 10 digits so the same person's number can't be
 * stored under several spellings.
 */
export function normalizePhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > PHONE_DIGITS ? digits.slice(-PHONE_DIGITS) : digits;
}

export interface PhoneInputProps extends Omit<InputProps, "value" | "onChange" | "type"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Hides the "+91" prefix for a field that isn't an Indian mobile. */
  showCountryCode?: boolean;
}

/**
 * The one input for a contact mobile number, so every form enforces the same
 * rule: 10 digits, nothing else. Typed on its own, each form let any length
 * and any character through, and an 11- or 12-digit number saved fine and then
 * failed to match on login (AuthService.cleanPhone compares the last 10).
 *
 * `maxLength` alone isn't enough — it caps typing but not a paste, and doesn't
 * stop letters — so the value is normalised on every change instead.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onValueChange, showCountryCode = true, placeholder = "98765 43210", ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      maxLength={PHONE_DIGITS}
      addonLeft={showCountryCode ? "+91" : undefined}
      placeholder={placeholder}
      value={value}
      onChange={e => onValueChange(normalizePhoneInput(e.target.value))}
      {...props}
    />
  );
});
