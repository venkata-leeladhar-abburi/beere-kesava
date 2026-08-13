import { WeaverRecord } from "../types";

// Historical placeholder rates — kept only as a last-resort fallback for the
// (now unused) sb/hz/ps/bs/st design-type breakdown. Real making charges
// come from WeaverRecord.earnedAmount (server-computed off the actual
// SareeTypeRate catalog); this should never be hit once earnings load.
export const RATES = { sb: 450, hz: 680, ps: 280, bs: 1200, st: 380 };

export function calcCharges(w: WeaverRecord) {
  // Gross charges = what the weaver earned (real QC-record production),
  // never what's been paid so far — amountPaid is often a partial/advance
  // payment, and showing it as "Gross Charges" made a weaver who'd only
  // been paid ₹1,000 of a real ₹6,800 owed look like they only earned
  // ₹1,000. uploadedAmount is a last-resort fallback only for a legacy
  // weaver with an uploaded payment but literally no QC production rows.
  if (w.earnedAmount !== undefined) return w.earnedAmount;
  if (w.uploadedAmount !== undefined) return w.uploadedAmount;
  return w.sb * RATES.sb + w.hz * RATES.hz + w.ps * RATES.ps + w.bs * RATES.bs + w.st * RATES.st;
}

export function calcCompletedSarees(w: WeaverRecord) {
  if (w.uploadedNoOfSarees !== undefined) return w.uploadedNoOfSarees;
  if (w.completedSarees !== undefined) return w.completedSarees;
  return w.sb + w.hz + w.ps + w.bs + w.st;
}

export function calcDeduction(w: WeaverRecord) {
  // Real QC-record deduction (SEMI/DEFECTIVE withholding) takes priority —
  // same reasoning as calcCharges above. uploadedDeduction only reflects
  // whatever was typed into the payment sheet's "deduction" column, which is
  // routinely left blank/0 and would otherwise mask a real deduction that
  // already exists on the weaver's QC records.
  if (w.accruedDeduction !== undefined) return w.accruedDeduction;
  if (w.uploadedDeduction !== undefined) return w.uploadedDeduction;
  return w.advance;
}

/** Everything actually transferred to this weaver so far — never just the latest payment. */
export function calcPaid(w: WeaverRecord) {
  return w.totalPaid ?? 0;
}

// What's still owed: earned charges, minus quality-withheld deductions,
// minus whatever's already been paid across every payment on file.
export function calcNet(w: WeaverRecord) {
  return calcCharges(w) - calcDeduction(w) - calcPaid(w);
}
