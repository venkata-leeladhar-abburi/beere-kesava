import { describe, it, expect } from "vitest";
import { matchGrnItemCodes } from "./grnMatching";

type PoItem = Parameters<typeof matchGrnItemCodes>[0][number];
type GrnItem = Parameters<typeof matchGrnItemCodes>[1][number];

const po = (materialType: string, name: string): PoItem => ({
  id: `po-${materialType}-${name}`, materialType, name, description: null,
  quantity: 1, unit: "KG", unitPrice: null, totalPrice: null, invoicedAmount: null,
});

const grn = (materialType: string, name: string, itemCode: string | null, poItemId?: string): GrnItem => ({
  id: `grn-${itemCode ?? name}`, itemCode, poItemId: poItemId ?? null, materialType, name,
  quantity: 1, unit: "KG", unitPrice: "0", totalPrice: "0",
});

describe("matchGrnItemCodes", () => {
  it("gives each ordered material its own receipt line code", () => {
    expect(matchGrnItemCodes(
      [po("WARP", "Warp"), po("RESHAM", "Resham"), po("JARI", "Jari")],
      [
        grn("WARP", "Warp", "GRN-SreeVignesh-004-002-1"),
        grn("RESHAM", "Resham", "GRN-SreeVignesh-004-002-2"),
        grn("JARI", "Jari", "GRN-SreeVignesh-004-002-3"),
      ],
    )).toEqual([
      "GRN-SreeVignesh-004-002-1",
      "GRN-SreeVignesh-004-002-2",
      "GRN-SreeVignesh-004-002-3",
    ]);
  });

  it("matches on material type when the line was renamed on arrival", () => {
    expect(matchGrnItemCodes(
      [po("WARP", "Resham Warp")],
      [grn("WARP", "Warp (2-ply)", "GRN-A-001-1")],
    )).toEqual(["GRN-A-001-1"]);
  });

  it("ignores case and surrounding whitespace when matching names", () => {
    expect(matchGrnItemCodes(
      [po("RESHAM", "  Resham  ")],
      [grn("RESHAM", "resham", "GRN-A-001-2")],
    )).toEqual(["GRN-A-001-2"]);
  });

  it("prefers the name match over an earlier same-type line", () => {
    expect(matchGrnItemCodes(
      [po("JARI", "Gold")],
      [grn("JARI", "Silver", "GRN-A-001-1"), grn("JARI", "Gold", "GRN-A-001-2")],
    )).toEqual(["GRN-A-001-2"]);
  });

  it("never hands one receipt line to two ordered lines", () => {
    expect(matchGrnItemCodes(
      [po("WARP", "Warp"), po("WARP", "Warp")],
      [grn("WARP", "Warp", "GRN-A-001-1")],
    )).toEqual(["GRN-A-001-1", undefined]);
  });

  it("keeps a matched legacy line consumed even though it has no code", () => {
    // The null-code line is the real match for the first order line; without
    // consuming it, the second line's code would leak onto the first.
    expect(matchGrnItemCodes(
      [po("WARP", "Warp"), po("WARP", "Jari Warp")],
      [grn("WARP", "Warp", null), grn("WARP", "Jari Warp", "GRN-A-001-2")],
    )).toEqual([undefined, "GRN-A-001-2"]);
  });

  it("returns no code when the order has not been received", () => {
    expect(matchGrnItemCodes([po("WARP", "Warp")], [])).toEqual([undefined]);
  });

  describe("with the exact poItemId link", () => {
    it("follows the link even when names and order disagree", () => {
      expect(matchGrnItemCodes(
        [po("JARI", "Gold"), po("JARI", "Silver")],
        [
          grn("JARI", "General", "GRN-A-001-1", "po-JARI-Silver"),
          grn("JARI", "General", "GRN-A-001-2", "po-JARI-Gold"),
        ],
      )).toEqual(["GRN-A-001-2", "GRN-A-001-1"]);
    });

    it("does not let a guessed match steal a line another order line owns", () => {
      // Without resolving exact links first, the unlinked "Gold" line would
      // claim receipt line 1 by type — the line explicitly recorded as Silver's.
      expect(matchGrnItemCodes(
        [po("JARI", "Gold"), po("JARI", "Silver")],
        [
          grn("JARI", "General", "GRN-A-001-1", "po-JARI-Silver"),
          grn("JARI", "General", "GRN-A-001-2"),
        ],
      )).toEqual(["GRN-A-001-2", "GRN-A-001-1"]);
    });

    it("still matches by content for receipts recorded before the link existed", () => {
      expect(matchGrnItemCodes(
        [po("WARP", "Warp")],
        [grn("WARP", "Warp", "GRN-A-001-1")],
      )).toEqual(["GRN-A-001-1"]);
    });
  });
});
