import { describe, expect, test } from "vitest";
import { addMoney, formatMoney, mulMoney, rupees, subMoney, toRupees } from "./money";

describe("formatMoney compact — design-system/06-DOMAIN.md Part E.2 worked examples", () => {
  test.each([
    [999, "₹999"],
    [50_000, "₹50.0K"],
    [1_00_000, "₹1.00L"],
    [9_99_999, "₹10.0L"],
    [10_00_000, "₹10.0L"], // was ₹1.00L under the old 10× bug
    [50_00_000, "₹50.0L"], // was ₹5.00L
    [1_00_00_000, "₹1.00Cr"], // was ₹10.00L (no crore tier at all)
    [5_00_00_000, "₹5.00Cr"], // was ₹50.00L
  ])("₹%i → %s", (rupeeAmount, expected) => {
    expect(formatMoney(rupees(rupeeAmount), { compact: true })).toBe(expected);
  });

  test("is monotonic across every K/L/Cr tier boundary", () => {
    let prevAbs = -Infinity;
    for (let r = 0; r <= 20_00_00_000; r += 997) {
      const shown = formatMoney(rupees(r), { compact: true });
      const numeric = Number(shown.replace(/[₹,+]/g, "").replace(/[KLCr]+$/, ""));
      const suffix = shown.match(/[A-Za-z]+$/)?.[0] ?? "";
      const magnitude = suffix === "Cr" ? numeric * 1e7 : suffix === "L" ? numeric * 1e5 : suffix === "K" ? numeric * 1e3 : numeric;
      // Allow rounding slack within a single step, but the displayed
      // magnitude must never decrease as the true value increases.
      expect(magnitude).toBeGreaterThanOrEqual(prevAbs - 1);
      prevAbs = magnitude;
    }
  });

  test("negative amounts mirror the positive formatting", () => {
    expect(formatMoney(rupees(-50_00_000), { compact: true })).toBe("-₹50.0L");
  });
});

describe("formatMoney non-compact", () => {
  test("defaults to 0 decimals (table/list precision)", () => {
    expect(formatMoney(rupees(8_400))).toBe("₹8,400");
  });

  test("2 decimals for document precision", () => {
    expect(formatMoney(rupees(9_912), { decimals: 2 })).toBe("₹9,912.00");
  });

  test("one formatter, no floating-point drift", () => {
    // The old features/payments/utils/format.ts bare toLocaleString("en-IN")
    // rendered up to 3 decimals of rupees for non-integer amounts.
    expect(formatMoney(rupees(1_234.567))).toBe("₹1,235");
  });

  test("sign display for deltas", () => {
    expect(formatMoney(rupees(1_200), { sign: true })).toBe("+₹1,200");
    expect(formatMoney(rupees(-1_200), { sign: true })).toBe("-₹1,200");
  });
});

describe("Paise arithmetic — no float rupee arithmetic (Part B, M1)", () => {
  test("rupees/toRupees round-trip", () => {
    expect(toRupees(rupees(1_234.5))).toBeCloseTo(1_234.5);
  });

  test("addMoney sums without float drift", () => {
    // 0.1 + 0.2 !== 0.3 in float rupees; in integer paise it's exact.
    expect(addMoney(rupees(0.1), rupees(0.2))).toBe(rupees(0.3));
  });

  test("subMoney and mulMoney", () => {
    expect(subMoney(rupees(100), rupees(40))).toBe(rupees(60));
    expect(mulMoney(rupees(100), 3)).toBe(rupees(300));
  });
});
