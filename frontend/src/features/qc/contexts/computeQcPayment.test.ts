import { describe, it, expect } from "vitest";
import { computeQcPayment } from "./QcContext";

describe("computeQcPayment", () => {
  it("passed sarees earn the full making charge with no deduction", () => {
    expect(computeQcPayment("passed", 450)).toEqual({ deduction: 0, payable: 450 });
  });

  it("defective sarees withhold the entire making charge regardless of semiDeduction", () => {
    expect(computeQcPayment("defective", 680, 100)).toEqual({ deduction: 680, payable: 0 });
  });

  it("semi-approved sarees withhold exactly the entered deduction", () => {
    expect(computeQcPayment("semi", 450, 120)).toEqual({ deduction: 120, payable: 330 });
  });

  it("clamps a semi deduction above the making charge to the making charge", () => {
    expect(computeQcPayment("semi", 450, 900)).toEqual({ deduction: 450, payable: 0 });
  });

  it("clamps a negative semi deduction to zero", () => {
    expect(computeQcPayment("semi", 450, -50)).toEqual({ deduction: 0, payable: 450 });
  });

  it("defaults semiDeduction to 0 when omitted", () => {
    expect(computeQcPayment("semi", 450)).toEqual({ deduction: 0, payable: 450 });
  });
});
