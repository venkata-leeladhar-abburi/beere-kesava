/**
 * Amount in words — design-system/07-DOCUMENTS.md Part I.4.
 * Indian convention (lakh/crore, not million). Always derived from integer
 * paise, never a float — always ends with "Only".
 */
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} Hundred${rest ? " " + twoDigits(rest) : ""}`;
}

/** Rupees only (no paise), Indian lakh/crore grouping, in words. */
export function rupeesInWords(rupees: number): string {
  if (rupees === 0) return "Zero";
  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1_000);
  const hundred = rupees % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
}

/**
 * Full amount-in-words line for a document, from integer paise —
 * "Rupees One Lakh Five Thousand Eight Hundred Forty Only" or, with paise,
 * "...and Fifty Paise Only".
 */
export function amountInWords(amountPaise: number): string {
  const rupees = Math.floor(amountPaise / 100);
  const paise = amountPaise % 100;
  const rupeeWords = rupeesInWords(rupees);
  if (paise === 0) return `Rupees ${rupeeWords} Only`;
  return `Rupees ${rupeeWords} and ${twoDigits(paise)} Paise Only`;
}
