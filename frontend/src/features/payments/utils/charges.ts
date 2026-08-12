import { WeaverRecord } from "../types";

// Historical placeholder rates — kept only as a last-resort fallback for the
// (now unused) sb/hz/ps/bs/st design-type breakdown. Real making charges
// come from WeaverRecord.earnedAmount (server-computed off the actual
// SareeTypeRate catalog); this should never be hit once earnings load.
export const RATES = { sb: 450, hz: 680, ps: 280, bs: 1200, st: 380 };

export function calcCharges(w: WeaverRecord) {
  if (w.uploadedAmount !== undefined) return w.uploadedAmount;
  if (w.earnedAmount !== undefined) return w.earnedAmount;
  return w.sb * RATES.sb + w.hz * RATES.hz + w.ps * RATES.ps + w.bs * RATES.bs + w.st * RATES.st;
}

export function calcCompletedSarees(w: WeaverRecord) {
  if (w.uploadedNoOfSarees !== undefined) return w.uploadedNoOfSarees;
  if (w.completedSarees !== undefined) return w.completedSarees;
  return w.sb + w.hz + w.ps + w.bs + w.st;
}

export function calcDeduction(w: WeaverRecord) {
  if (w.uploadedDeduction !== undefined) return w.uploadedDeduction;
  if (w.accruedDeduction !== undefined) return w.accruedDeduction;
  return w.advance;
}

export function calcNet(w: WeaverRecord) {
  return calcCharges(w) - calcDeduction(w);
}
