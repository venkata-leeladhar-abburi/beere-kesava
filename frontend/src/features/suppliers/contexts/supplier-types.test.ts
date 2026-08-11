import { describe, it, expect } from "vitest";
import {
  parseINR,
  supplierPrefix,
  buildSareeCode,
  buildSareePieceCode,
  pieceCodeFromLineCode,
  computeFinalAmount,
  totalPieces,
  lineBuying,
  lineSelling,
  lineProfit,
  expandSareePieces,
  purchaseTotals,
  initialsOf,
  type SareeTag,
} from "./supplier-types";

describe("parseINR", () => {
  it("parses a formatted rupee string back into a number", () => {
    expect(parseINR("₹1,20,000")).toBe(120000);
  });

  it("returns 0 for empty, null, or unparsable input", () => {
    expect(parseINR(undefined)).toBe(0);
    expect(parseINR(null)).toBe(0);
    expect(parseINR("")).toBe(0);
    expect(parseINR("—")).toBe(0);
  });
});

describe("supplierPrefix / buildSareeCode", () => {
  it("takes the first 4 letters, uppercased, padded with X", () => {
    expect(supplierPrefix("Ravi Silks")).toBe("RAVI");
    expect(supplierPrefix("AB")).toBe("ABXX");
    expect(supplierPrefix("")).toBe("SUPP");
  });

  it("builds a supplier-invoice-serial line code, serial padded to 3 digits", () => {
    expect(buildSareeCode("Ravi Silks", 1, "34")).toBe("RAVI-34-001");
  });

  it("falls back to NOINV when no invoice number is given", () => {
    expect(buildSareeCode("Ravi Silks", 1, "")).toBe("RAVI-NOINV-001");
  });
});

describe("piece codes", () => {
  it("appends a 2-digit piece number onto the end of the line code", () => {
    expect(buildSareePieceCode("Ravi Silks", 1, 3, "34")).toBe("RAVI-34-001-03");
  });

  it("derives the same piece code from an existing line code", () => {
    expect(pieceCodeFromLineCode("RAVI-34-001", 3)).toBe("RAVI-34-001-03");
  });
});

describe("pricing math", () => {
  it("computeFinalAmount applies the markup percentage across quantity", () => {
    expect(computeFinalAmount(1000, 20, 2)).toBe(2400); // (1000 + 200) * 2
  });

  it("computeFinalAmount defaults quantity to 1 and treats non-positive quantity as 1", () => {
    expect(computeFinalAmount(1000, 20)).toBe(1200);
    expect(computeFinalAmount(1000, 20, 0)).toBe(1200);
  });

  const line = { price: 500, sellPercent: 20, quantity: 3 };

  it("lineBuying multiplies price by quantity", () => {
    expect(lineBuying(line)).toBe(1500);
  });

  it("lineSelling applies the markup across all pieces", () => {
    expect(lineSelling(line)).toBe(1800); // (500 + 100) * 3
  });

  it("lineProfit is selling minus buying", () => {
    expect(lineProfit(line)).toBe(300);
  });

  it("totalPieces sums quantities, defaulting missing quantity to 1", () => {
    const sarees = [{ quantity: 2 }, { quantity: undefined }, { quantity: 3 }] as SareeTag[];
    expect(totalPieces(sarees)).toBe(6);
  });

  it("purchaseTotals rolls buying/selling/profit/pieces across all lines", () => {
    const lines = [
      { price: 500, sellPercent: 20, quantity: 2 },
      { price: 1000, sellPercent: 10, quantity: 1 },
    ];
    const totals = purchaseTotals(lines);
    expect(totals.pieces).toBe(3);
    expect(totals.buying).toBe(2000);   // 500*2 + 1000*1
    expect(totals.selling).toBe(2300);  // (500+100)*2 + (1000+100)*1
    expect(totals.profit).toBe(300);
  });
});

describe("expandSareePieces", () => {
  it("expands a multi-quantity line into one row per physical piece", () => {
    const line: SareeTag = {
      id: "RAVI-34-001",
      weight: "800g",
      date: "01 Jun 2026",
      sareeType: "Plain Silk",
      color: "Cream",
      price: 500,
      sellPercent: 20,
      quantity: 3,
      finalAmount: 1800,
      notes: "",
    };
    const pieces = expandSareePieces([line]);
    expect(pieces).toHaveLength(3);
    expect(pieces[0].id).toBe("RAVI-34-001-01");
    expect(pieces[1].id).toBe("RAVI-34-001-02");
    expect(pieces[2].id).toBe("RAVI-34-001-03");
    // Each expanded piece is priced individually, not multiplied by quantity again.
    pieces.forEach(p => {
      expect(p.quantity).toBe(1);
      expect(p.finalAmount).toBe(600); // 500 + 20%
      expect(p.lineQuantity).toBe(3);
    });
  });
});

describe("initialsOf", () => {
  it("takes the first letter of up to two words, uppercased", () => {
    expect(initialsOf("Ravi Silks")).toBe("RS");
    expect(initialsOf("Kanchipuram")).toBe("K");
  });

  it("falls back to SU for empty input", () => {
    expect(initialsOf("")).toBe("SU");
  });
});
