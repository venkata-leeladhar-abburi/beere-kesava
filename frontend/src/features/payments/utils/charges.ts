import { WeaverRecord } from "../types";

export const RATES = { sb: 450, hz: 680, ps: 280, bs: 1200, st: 380 };

export function calcCharges(w: WeaverRecord) {
  if (w.uploadedAmount !== undefined) return w.uploadedAmount;
  return w.sb * RATES.sb + w.hz * RATES.hz + w.ps * RATES.ps + w.bs * RATES.bs + w.st * RATES.st;
}

export function calcNet(w: WeaverRecord) {
  const charges = calcCharges(w);
  const deduction = w.uploadedDeduction !== undefined ? w.uploadedDeduction : w.advance;
  return charges - deduction;
}
