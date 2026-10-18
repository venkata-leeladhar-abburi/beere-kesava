import { describe, it, expect } from "vitest";
import { toInHouseSaree } from "./in-house-saree";
import { rankSellers, isOutstanding } from "./sales-seed";
import type { WovenSaree } from "../../../shared/api/inventory";
import type { BackendSaleRecord, BackendSaleReturn } from "../../../shared/api/sales";
import type { WholesaleDispatchPiece } from "../../../shared/api/dispatch";

const woven = (sareeId: string, overrides: Partial<WovenSaree> = {}): WovenSaree => ({
  sareeId,
  source: "outsourced",
  weaverName: "Rama Rao",
  weaverId: "wv-1",
  weaverCode: "Ramarao-001",
  loomNumber: "2",
  designCode: "D-01",
  sareeTypeCode: "ST-01",
  sareeTypeLabel: "ST-01 · Kanchi Silk",
  qcDate: "2026-09-05T00:00:00.000Z",
  saleRef: null,
  customer: null,
  ...overrides,
});

const loomSaree = (sareeId: string) =>
  woven(sareeId, { source: "factory", weaverName: null, weaverId: null, loomNumber: "Loom-002" });

const sale = (sareeId: string, channel: "RETAIL" | "WHOLESALE" = "RETAIL"): BackendSaleRecord => ({
  saleRef: `SALE-${sareeId}`,
  sareeId,
  channel,
  customerId: "c1",
  amount: "6000",
  saleDate: "2026-09-20T00:00:00.000Z",
  paymentMethod: null,
  paymentRef: null,
});

const ret = (sareeId: string, restocked: boolean): BackendSaleReturn => ({
  returnRef: `RET-${sareeId}`,
  sareeId,
  reason: "Colour mismatch",
  refundAmount: "6000",
  restocked,
  returnDate: "2026-09-25T00:00:00.000Z",
});

const dispatch = (sareeId: string): WholesaleDispatchPiece => ({
  sareeId,
  dispatchId: "d1",
  dispatchDate: "2026-10-01T00:00:00.000Z",
  invoiceNumber: "INV-ACME-001",
  customerName: "Acme Silks",
  amount: 4200,
});

describe("toInHouseSaree", () => {
  it("leaves a woven saree with no sale or wholesale dispatch unsold", () => {
    const s = toInHouseSaree(woven("A"), undefined, undefined, undefined);
    expect(s).toMatchObject({ origin: "weaver", weaverId: "wv-1", weaverLoom: 2, status: "unsold" });
    expect(s.sale).toBeNull();
    expect(isOutstanding(s)).toBe(true);
  });

  it("counts a saree sold at the counter as a retail sale", () => {
    const s = toInHouseSaree(woven("A"), sale("A"), undefined, undefined);
    expect(s.status).toBe("retail");
    expect(s.sale).toMatchObject({ saleRef: "SALE-A", channel: "retail", amount: 6000 });
  });

  it("counts a saree on a WHOLESALE dispatch as a wholesale sale", () => {
    const s = toInHouseSaree(loomSaree("A"), undefined, undefined, dispatch("A"));
    expect(s).toMatchObject({ origin: "factoryLoom", factoryLoomId: "Loom-002", status: "wholesale" });
    expect(s.sale).toMatchObject({ channel: "wholesale", customer: "Acme Silks", amount: 4200 });
  });

  it("keeps a customer return, restocked or not, as a return", () => {
    const s = toInHouseSaree(woven("A"), sale("A"), ret("A", true), undefined);
    expect(s.status).toBe("returned");
    expect(s.ret).toMatchObject({ returnRef: "RET-A", refundAmount: 6000, restocked: true });
    expect(isOutstanding(s)).toBe(true);
  });
});

describe("rankSellers with sold and dispatched in-house sarees", () => {
  it("gives weavers their real sold, retail and wholesale counts", () => {
    const sarees = [
      // Still in the factory, or moved to our own shop by a SHOP dispatch and
      // not sold there yet: both are stock, so neither has a sale here.
      toInHouseSaree(woven("A"), undefined, undefined, undefined),
      toInHouseSaree(woven("B"), undefined, undefined, undefined),
      toInHouseSaree(woven("C"), sale("C"), undefined, undefined),
      toInHouseSaree(woven("D"), undefined, undefined, dispatch("D")),
      toInHouseSaree(woven("E"), sale("E"), ret("E", false), undefined),
    ];

    const [row] = rankSellers(sarees, "weaver");
    expect(row).toMatchObject({
      key: "wv-1",
      name: "Rama Rao",
      produced: 5,
      sold: 2,
      retail: 1,
      wholesale: 1,
      returned: 1,
      outstanding: 2,
      sellThroughPct: 40,
    });
    expect(row.revenue).toBe(6000 + 4200 - 6000);
  });

  it("gives factory looms their sold counts too", () => {
    const sarees = [
      toInHouseSaree(loomSaree("A"), sale("A"), undefined, undefined),
      toInHouseSaree(loomSaree("B"), undefined, undefined, dispatch("B")),
      toInHouseSaree(loomSaree("C"), undefined, undefined, undefined),
    ];

    const [row] = rankSellers(sarees, "factoryLoom");
    expect(row).toMatchObject({
      key: "Loom-002",
      produced: 3,
      sold: 2,
      retail: 1,
      wholesale: 1,
      outstanding: 1,
    });
  });
});
