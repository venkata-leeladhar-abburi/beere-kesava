/**
 * Cost-price cipher for printed saree tags — "LORD GANESH" maps digits to
 * letters so a tag can print the true buying/cost price without a customer
 * being able to read it at a glance, while staff who know the phrase can
 * decode it back. The selling price is printed in plain rupees; only the
 * cost price goes through this cipher.
 *
 *   1  2  3  4  5  6  7  8  9  0
 *   L  O  R  D  G  A  N  E  S  H
 */
const DIGIT_TO_LETTER: Record<string, string> = {
  "1": "L", "2": "O", "3": "R", "4": "D", "5": "G",
  "6": "A", "7": "N", "8": "E", "9": "S", "0": "H",
};

const LETTER_TO_DIGIT: Record<string, string> = Object.fromEntries(
  Object.entries(DIGIT_TO_LETTER).map(([digit, letter]) => [letter, digit]),
);

/** Encodes a whole-rupee cost price into its cipher letters, e.g. 1234 -> "LORD". */
export function encodeCostCipher(amountInRupees: number): string {
  const digits = String(Math.round(Math.max(0, amountInRupees)));
  return digits
    .split("")
    .map(d => DIGIT_TO_LETTER[d] ?? d)
    .join("");
}

/** Decodes cipher letters back into the rupee amount, e.g. "LORD" -> 1234. Returns null on invalid input. */
export function decodeCostCipher(cipher: string): number | null {
  const letters = cipher.trim().toUpperCase();
  if (!letters) return null;
  let digits = "";
  for (const ch of letters) {
    const digit = LETTER_TO_DIGIT[ch];
    if (digit === undefined) return null;
    digits += digit;
  }
  return Number(digits);
}
