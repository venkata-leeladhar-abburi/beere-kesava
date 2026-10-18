import { describe, expect, it } from "vitest";
import {
  allocateLegs,
  billLegs,
  legsMatchTotal,
  legsShortfall,
  legsSummary,
  mergeLegs,
  paymentMethodLabel,
  saleLegs,
  salePaymentText,
} from "./salePayment";

const sum = (xs: number[]) => xs.reduce((a, b) => a + Math.round(b * 100), 0) / 100;

describe("paymentMethodLabel", () => {
  it("names the counter methods and split", () => {
    expect(paymentMethodLabel("upi")).toBe("UPI");
    expect(paymentMethodLabel("cash")).toBe("Cash");
    expect(paymentMethodLabel("split")).toBe("Split");
    expect(paymentMethodLabel("bank_transfer")).toBe("Bank Transfer");
    expect(paymentMethodLabel(null)).toBe("");
  });
});

describe("saleLegs", () => {
  it("reads a single-method sale as one leg for its whole amount", () => {
    expect(saleLegs({ amount: "1600.00", paymentMethod: "upi", paymentRef: "T1" })).toEqual([
      { method: "upi", amount: 1600, reference: "T1" },
    ]);
  });

  it("reads a split sale from its payment rows, cash first", () => {
    expect(
      saleLegs({
        amount: "1600.00",
        paymentMethod: "split",
        paymentRef: null,
        payments: [
          { method: "upi", amount: "1000.00", reference: "T9" },
          { method: "cash", amount: "600.00" },
        ],
      })
    ).toEqual([
      { method: "cash", amount: 600, reference: null },
      { method: "upi", amount: 1000, reference: "T9" },
    ]);
  });

  it("gives no legs when no method was recorded", () => {
    expect(saleLegs({ amount: "500", paymentMethod: null, paymentRef: null })).toEqual([]);
  });
});

describe("billLegs / mergeLegs", () => {
  it("sums each method across the sarees of a bill, in paise", () => {
    const legs = billLegs([
      {
        amount: "0.30",
        paymentMethod: "split",
        paymentRef: null,
        payments: [
          { method: "cash", amount: "0.10" },
          { method: "upi", amount: "0.20", reference: "T9" },
        ],
      },
      {
        amount: "0.30",
        paymentMethod: "split",
        paymentRef: null,
        payments: [
          { method: "cash", amount: "0.20" },
          { method: "upi", amount: "0.10", reference: "T9" },
        ],
      },
    ]);
    expect(legs).toEqual([
      { method: "cash", amount: 0.3, reference: null },
      { method: "upi", amount: 0.3, reference: "T9" },
    ]);
  });

  it("keeps distinct references once each", () => {
    expect(
      mergeLegs([
        { method: "upi", amount: 1, reference: "A" },
        { method: "upi", amount: 1, reference: "B" },
        { method: "upi", amount: 1, reference: "A" },
      ])
    ).toEqual([{ method: "upi", amount: 3, reference: "A, B" }]);
  });
});

describe("legsSummary / salePaymentText", () => {
  it("names a single method, and amounts for a split", () => {
    expect(legsSummary([{ method: "cash", amount: 1600 }])).toBe("Cash");
    expect(
      legsSummary([
        { method: "cash", amount: 600 },
        { method: "upi", amount: 1000 },
      ])
    ).toBe("Cash ₹600 + UPI ₹1,000");
    expect(legsSummary([], "Counter")).toBe("Counter");
  });

  it("falls back to 'Split' for a split sale whose rows were not loaded", () => {
    expect(salePaymentText({ amount: 1, paymentMethod: "split", paymentRef: null })).toBe("Split");
  });
});

describe("allocateLegs", () => {
  const legs = [
    { method: "cash", amount: 600 },
    { method: "upi", amount: 1000, reference: "T9" },
  ];

  it("gives a single saree the whole split", () => {
    expect(allocateLegs([1600], legs)).toEqual([
      [
        { method: "cash", amount: 600, reference: null },
        { method: "upi", amount: 1000, reference: "T9" },
      ],
    ]);
  });

  it("gives every saree the bill's mix, adding up both ways exactly", () => {
    const lines = [999, 333.33, 267.67];
    const out = allocateLegs(lines, legs);
    out.forEach((shares, i) => expect(sum(shares.map((s) => s.amount))).toBe(lines[i]));
    for (const leg of legs) {
      expect(
        sum(out.flatMap((s) => s.filter((x) => x.method === leg.method).map((x) => x.amount)))
      ).toBe(leg.amount);
    }
    for (const s of out.flat()) expect(s.amount).toBeGreaterThan(0);
  });

  it("never goes negative on awkward splits", () => {
    const awkward = [
      { method: "cash", amount: 0.01 },
      { method: "upi", amount: 2.99 },
      { method: "card", amount: 7 },
    ];
    const lines = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const out = allocateLegs(lines, awkward);
    out.forEach((shares) => expect(sum(shares.map((s) => s.amount))).toBe(1));
    for (const s of out.flat()) expect(s.amount).toBeGreaterThan(0);
    expect(
      sum(
        out
          .flat()
          .filter((s) => s.method === "cash")
          .map((s) => s.amount)
      )
    ).toBe(0.01);
  });

  it("leaves a free saree with no legs", () => {
    const out = allocateLegs([0, 1600], legs);
    expect(out[0]).toEqual([]);
    expect(sum(out[1]!.map((s) => s.amount))).toBe(1600);
  });
});

describe("legsShortfall / legsMatchTotal", () => {
  it("reports what is left to allocate, to the paisa", () => {
    expect(legsShortfall(1600, [{ method: "cash", amount: 600 }])).toBe(1000);
    expect(legsShortfall(1600, [{ method: "cash", amount: 1700 }])).toBe(-100);
    expect(
      legsMatchTotal(0.3, [
        { method: "cash", amount: 0.1 },
        { method: "upi", amount: 0.2 },
      ])
    ).toBe(true);
  });
});
