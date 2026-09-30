import { describe, expect, it } from "vitest";
import { billGstFromSales, saleGstAmount, saleGstRate, saleTaxable } from "./saleGst";

describe("sale GST read-back", () => {
  it("treats a sale without GST as untaxed", () => {
    const s = { amount: "1500.00", gstRate: null, gstAmount: null };
    expect(saleGstRate(s)).toBeNull();
    expect(saleGstAmount(s)).toBe(0);
    expect(saleTaxable(s)).toBe(1500);
    expect(billGstFromSales([s])).toBeUndefined();
  });

  it("takes the tax back out of the amount to get the taxable value", () => {
    expect(saleTaxable({ amount: "1382.08", gstAmount: "148.08" })).toBe(1234);
  });

  it("totals a bill's GST on paise and keeps both GSTINs", () => {
    const bill = billGstFromSales([
      { amount: "1050.10", gstRate: "5.00", gstAmount: "50.10", customerGstin: "36AAACR5055K1Z5", sellerGstin: "37AABCB1234C1Z5" },
      { amount: "735.20", gstRate: "5.00", gstAmount: "35.20" },
    ]);
    expect(bill).toEqual({ rate: 5, amount: 85.3, customerGstin: "36AAACR5055K1Z5", sellerGstin: "37AABCB1234C1Z5" });
  });
});
