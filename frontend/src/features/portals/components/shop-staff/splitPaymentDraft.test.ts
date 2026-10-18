import { describe, expect, it } from "vitest";
import {
  addRow,
  checkSplit,
  deductRecorded,
  fillRemaining,
  parseAmount,
  removeRow,
  rowAmounts,
  setRowAmount,
  type SplitDraftRow,
} from "./splitPaymentDraft";

describe("split payment entry", () => {
  it("fills the newest untouched method with the balance", () => {
    let rows: SplitDraftRow[] = [{ method: "cash", amount: "", reference: "" }];
    rows = addRow(rows, "upi", 1600);
    rows = setRowAmount(rows, "cash", "600");
    expect(rowAmounts(rows, 1600)).toEqual([600, 1000]);
    expect(checkSplit(rows, 1600)).toMatchObject({ shortfall: 0, problem: null });
  });

  it("keeps the balance row in step when the bill total changes", () => {
    const rows = setRowAmount(
      addRow([{ method: "cash", amount: "", reference: "" }], "upi", 1600),
      "cash",
      "600"
    );
    expect(rowAmounts(rows, 2000)).toEqual([600, 1400]);
  });

  it("fixes the old balance row's value when another method is added", () => {
    let rows = addRow([], "cash", 1600); // cash is the balance: 1600
    rows = addRow(rows, "upi", 1600); // cash keeps 1600, upi takes the rest: 0
    expect(rows[0]!.amount).toBe("1600");
    expect(checkSplit(rows, 1600).problem).toBe("Enter an amount for UPI, or remove it");
    rows = setRowAmount(rows, "cash", "1000");
    expect(rowAmounts(rows, 1600)).toEqual([1000, 600]);
  });

  it("needs at least two methods", () => {
    expect(checkSplit(addRow([], "cash", 1600), 1600).problem).toBe(
      "Pick at least two methods to split the payment"
    );
  });

  it("reports what is short or over", () => {
    let rows: SplitDraftRow[] = [
      { method: "cash", amount: "600", reference: "" },
      { method: "upi", amount: "900", reference: "" },
    ];
    expect(checkSplit(rows, 1600)).toMatchObject({
      shortfall: 100,
      problem: "₹100 still to be allocated",
    });
    rows = setRowAmount(rows, "upi", "1100");
    expect(checkSplit(rows, 1600).problem).toBe("₹100 more than the total — reduce an amount");
    rows = setRowAmount(rows, "upi", "1.2.3");
    expect(checkSplit(rows, 1600).problem).toBe("Enter a valid amount for UPI");
  });

  it("can make any row the balance", () => {
    const rows: SplitDraftRow[] = [
      { method: "cash", amount: "600", reference: "" },
      { method: "card", amount: "", reference: "" },
    ];
    expect(rowAmounts(fillRemaining(rows, "card", 1600), 1600)).toEqual([600, 1000]);
  });

  it("drops a method cleanly", () => {
    const rows = addRow([{ method: "cash", amount: "600", reference: "" }], "upi", 1600);
    expect(removeRow(rows, "cash").map((r) => r.method)).toEqual(["upi"]);
  });

  it("takes what already went through off each method before a retry", () => {
    const rows: SplitDraftRow[] = [
      { method: "cash", amount: "600", reference: "" },
      { method: "upi", amount: null, reference: "T9" },
    ];
    const left = deductRecorded(
      rows,
      [
        { method: "cash", amount: 375 },
        { method: "upi", amount: 625 },
      ],
      1600
    );
    expect(left).toEqual([
      { method: "cash", amount: "225", reference: "" },
      { method: "upi", amount: "375", reference: "T9" },
    ]);
  });

  it("parses amounts the way the field accepts them", () => {
    expect(parseAmount("1,000.50")).toBe(1000.5);
    expect(parseAmount("₹ 600")).toBe(600);
    expect(parseAmount("10.123")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});
