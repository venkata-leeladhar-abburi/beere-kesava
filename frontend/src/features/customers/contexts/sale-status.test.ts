import { describe, it, expect } from "vitest";
import { resolveSaleStatus } from "./sale-status";
import { rankSellers, isOutstanding } from "./sales-seed";
import type { UnifiedSaree } from "./sales-types";
import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";
import type { WholesaleDispatchPiece } from "../../../shared/api/dispatch";

const dispatch = (overrides: Partial<WholesaleDispatchPiece> = {}): WholesaleDispatchPiece => ({
  sareeId: "SKL-0001-01",
  dispatchId: "d1",
  dispatchDate: "2026-10-01T00:00:00.000Z",
  invoiceNumber: "INV-ACME-001",
  customerName: "Acme Silks",
  amount: 4200,
  ...overrides,
});

const ret = (returnDate: string, restocked = false): BackendSaleReturn => ({
  returnRef: "RET-1",
  sareeId: "SKL-0001-01",
  reason: "Damaged",
  refundAmount: "4200",
  restocked,
  returnDate,
});

const sale = (saleDate: string): BackendSaleRecord => ({
  saleRef: "RETAIL-RAVI-001",
  sareeId: "SKL-0001-01",
  channel: "RETAIL",
  customerId: "c1",
  amount: "5000",
  saleDate,
  paymentMethod: null,
  paymentRef: null,
});

describe("resolveSaleStatus", () => {
  it("leaves a piece with no sale, return or dispatch unsold", () => {
    expect(resolveSaleStatus(undefined, undefined, undefined)).toEqual({
      status: "unsold",
      sale: null,
    });
  });

  it("counts a piece on a wholesale dispatch as a wholesale sale at its share of the subtotal", () => {
    const { status, sale: info } = resolveSaleStatus(undefined, undefined, dispatch());
    expect(status).toBe("wholesale");
    expect(info).toMatchObject({
      saleRef: "INV-ACME-001",
      channel: "wholesale",
      customer: "Acme Silks",
      amount: 4200,
    });
  });

  it("falls back to the dispatch id when no invoice was raised", () => {
    const { sale: info } = resolveSaleStatus(undefined, undefined, dispatch({ invoiceNumber: null }));
    expect(info?.saleRef).toBe("d1");
  });

  it("does not count a piece the buyer sent back off the dispatch as sold", () => {
    const { status } = resolveSaleStatus(
      undefined,
      ret("2026-10-05T00:00:00.000Z"),
      dispatch()
    );
    expect(status).toBe("returned");
  });

  it("counts a piece that was returned and restocked earlier, then dispatched", () => {
    const { status } = resolveSaleStatus(
      sale("2026-08-01T00:00:00.000Z"),
      ret("2026-08-10T00:00:00.000Z", true),
      dispatch()
    );
    expect(status).toBe("wholesale");
  });

  it("keeps the existing sale and return rules when there is no dispatch", () => {
    expect(resolveSaleStatus(sale("2026-08-01T00:00:00.000Z"), undefined, undefined).status).toBe(
      "retail"
    );
    expect(
      resolveSaleStatus(
        sale("2026-08-01T00:00:00.000Z"),
        ret("2026-08-10T00:00:00.000Z"),
        undefined
      ).status
    ).toBe("returned");
  });
});

describe("rankSellers with wholesale-dispatched external pieces", () => {
  function externalPiece(sareeId: string, d?: WholesaleDispatchPiece, r?: BackendSaleReturn) {
    const { status, sale: info } = resolveSaleStatus(undefined, r, d);
    return {
      sareeId,
      origin: "external",
      supplier: "SRI SAKTHILAKSHMI",
      supplierLocation: "Dharmavaram",
      purchaseId: "p1",
      batchId: null,
      designCode: "",
      sareeTypeCode: "",
      sareeTypeName: "Silk",
      weight: "",
      qcDate: "",
      costPrice: 3000,
      sellPercent: 20,
      finalAmount: 3600,
      status,
      sale: info,
      ret: r
        ? {
            returnRef: r.returnRef,
            date: "",
            reason: "",
            refundAmount: Number(r.refundAmount),
            restocked: r.restocked,
          }
        : null,
      returnedToSupplier: false,
      ageDays: 0,
    } satisfies UnifiedSaree;
  }

  it("moves dispatched pieces from Outstanding into Wholesale and revenue", () => {
    const sarees = [
      externalPiece("SKL-0001-01", dispatch({ sareeId: "SKL-0001-01" })),
      externalPiece("SKL-0001-02", dispatch({ sareeId: "SKL-0001-02" })),
      // Sent back by the buyer and not yet restocked — neither sold nor stock.
      externalPiece(
        "SKL-0001-03",
        dispatch({ sareeId: "SKL-0001-03" }),
        ret("2026-10-05T00:00:00.000Z")
      ),
      externalPiece("SKL-0001-04"),
    ];

    const [row] = rankSellers(sarees, "external");
    expect(row).toMatchObject({
      name: "SRI SAKTHILAKSHMI",
      produced: 4,
      wholesale: 2,
      sold: 2,
      returned: 1,
      outstanding: 1,
      sellThroughPct: 50,
    });
    expect(row.revenue).toBe(4200 * 2 - 4200);
    expect(sarees.filter(isOutstanding).map((s) => s.sareeId)).toEqual(["SKL-0001-04"]);
  });
});
