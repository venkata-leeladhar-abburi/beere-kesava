import { describe, expect, it } from "vitest";
import { groupIntoBills, type SaleLineRow } from "./allSalesModel";

type Line = Omit<SaleLineRow, "billRef">;

const T0 = new Date("2026-09-30T10:00:00+05:30").getTime();

function line(saleRef: string, offsetSec: number, over: Partial<Line> = {}): Line {
  const time = T0 + offsetSec * 1000;
  return {
    key: saleRef,
    saleRef,
    sareeId: `S-${saleRef}`,
    date: new Date(time).toISOString(),
    time,
    customerId: "c1",
    customer: "vasudev",
    customerPhone: null,
    customerAddress: null,
    customerCode: null,
    channel: "RETAIL",
    channelLabel: "Retail",
    sareeType: "YESNA SOFT SILK",
    design: null,
    payKey: "cash",
    pay: "Cash",
    payRef: null,
    billId: null,
    amount: 1000,
    taxable: 1000,
    gstRate: null,
    gst: 0,
    customerGstin: null,
    sellerGstin: null,
    soldById: "u1",
    soldBy: "Staff",
    returned: false,
    returnRef: null,
    refund: 0,
    ...over,
  };
}

describe("groupIntoBills", () => {
  it("puts one checkout's sarees on one bill numbered by the first sale", () => {
    const { bills, lines } = groupIntoBills([line("R-002", 4), line("R-001", 0), line("R-003", 9)]);
    expect(bills).toHaveLength(1);
    expect(bills[0].billRef).toBe("R-001");
    expect(bills[0].pieces).toBe(3);
    expect(bills[0].total).toBe(3000);
    expect(lines.every((l) => l.billRef === "R-001")).toBe(true);
  });

  it("splits sales far apart in time into separate bills", () => {
    const { bills } = groupIntoBills([line("R-001", 0), line("R-002", 60 * 60)]);
    expect(bills.map((b) => b.billRef)).toEqual(["R-001", "R-002"]);
  });

  it("never merges different customers, payments or cashiers", () => {
    const { bills } = groupIntoBills([
      line("R-001", 0),
      line("R-002", 1, { customerId: "c2", customer: "other" }),
      line("R-003", 2, { payKey: "upi", pay: "UPI" }),
      line("R-004", 3, { soldById: "u2" }),
    ]);
    expect(bills).toHaveLength(4);
  });

  it("counts returned sarees on their bill", () => {
    const { bills } = groupIntoBills([
      line("R-001", 0),
      line("R-002", 3, { returned: true, refund: 1000 }),
    ]);
    expect(bills[0].returnedCount).toBe(1);
  });

  it("groups by the stamped bill id, however far apart the sarees were recorded", () => {
    const { bills } = groupIntoBills([
      line("R-001", 0, { billId: "b1" }),
      line("R-002", 60 * 60, { billId: "b1" }),
      line("R-003", 1, { billId: "b2" }),
    ]);
    expect(bills.map((b) => [b.billRef, b.pieces])).toEqual([
      ["R-001", 2],
      ["R-003", 1],
    ]);
  });

  it("totals a GST bill on paise and carries its rate and GSTINs", () => {
    const gstLine = (
      ref: string,
      sec: number,
      taxable: number,
      gst: number,
      over: Partial<Line> = {}
    ) => line(ref, sec, { billId: "b1", amount: taxable + gst, taxable, gstRate: 5, gst, ...over });
    const { bills } = groupIntoBills([
      gstLine("R-001", 0, 1000.1, 50.1, {
        customerGstin: "36AAACR5055K1Z5",
        sellerGstin: "37AABCB1234C1Z5",
      }),
      gstLine("R-002", 1, 700.2, 35.2),
    ]);
    expect(bills[0]).toMatchObject({
      total: 1785.6,
      gst: 85.3,
      gstRate: 5,
      customerGstin: "36AAACR5055K1Z5",
      sellerGstin: "37AABCB1234C1Z5",
    });
  });
});
