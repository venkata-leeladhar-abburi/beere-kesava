import { describe, expect, it } from "vitest";
import type { BackendNotification } from "@/shared/api/notifications";
import { toUnifiedNotif } from "./notifFormat";

function notif(type: string, payload: Record<string, unknown> = {}): BackendNotification {
  return {
    id: "n1",
    type,
    payload,
    createdAt: new Date().toISOString(),
    readAt: null,
  } as BackendNotification;
}

/**
 * Every type the backend emits, paired with the tab it must appear under.
 * This is the regression guard for the routing bug this table was written to
 * fix: SHOP_DISPATCH_INCOMING_STOCK used to land under Raw Materials & Stock
 * (its name contains "STOCK", which the keyword fallback tested before
 * "DISPATCH"), and SHOP_RECEIPT_DISCREPANCY_ALERT matched no keyword at all
 * and fell through to Production.
 */
const ROUTING: Array<[string, string]> = [
  ["WEAVER_WARP_REQUEST_RAISED", "weaver"],
  ["WEAVER_WARP_REQUEST_APPROVED", "weaver"],
  ["WEAVER_WARP_REQUEST_REJECTED", "weaver"],
  ["WEAVER_RATE_REQUEST_RAISED", "weaver"],
  ["WEAVER_RATE_REQUEST_APPROVED", "weaver"],
  ["WEAVER_RATE_REQUEST_REJECTED", "weaver"],
  ["WEAVER_PAYMENT_PAID", "weaver"],
  ["WEAVER_DESIGN_ASSIGNED", "weaver"],
  ["WEAVER_LOOM_ROW_ASSIGNED", "weaver"],
  ["WEAVER_DEACTIVATED", "weaver"],
  ["BATCH_QC_FAILED", "production"],
  ["BATCH_QC_SEMI_DEFECT", "production"],
  ["BATCH_FINALIZED", "production"],
  ["BATCH_ROW_RECEIVED", "production"],
  ["BATCH_TALLY_MISMATCH", "production"],
  ["BATCH_DELIVERY_OVERDUE", "production"],
  ["FINISHING_SENT", "production"],
  ["FINISHING_RETURN_RECEIVED", "production"],
  ["FINISHING_RETURN_DAMAGED", "production"],
  ["po_stock_received", "material"],
  ["material_signature_request", "material"],
  ["MATERIAL_SIGNATURE_COMPLETED", "material"],
  ["RAW_MATERIAL_LOW_STOCK", "material"],
  ["RAW_MATERIAL_OUT_OF_STOCK", "material"],
  ["PURCHASE_REQUEST_RAISED", "material"],
  ["PURCHASE_REQUEST_APPROVED", "material"],
  ["PURCHASE_REQUEST_REJECTED", "material"],
  ["PURCHASE_ORDER_RAISED", "material"],
  ["GRN_QUANTITY_MISMATCH", "material"],
  ["SUPPLIER_RETURN_RAISED", "material"],
  ["SUPPLIER_RETURN_DECIDED", "material"],
  ["VENDOR_ADDED", "material"],
  ["VENDOR_STATUS_CHANGED", "material"],
  ["VENDOR_REACTIVATED", "material"],
  ["VENDOR_REMOVED", "material"],
  ["SUPPLIER_ADDED", "material"],
  ["SUPPLIER_STATUS_CHANGED", "material"],
  ["SUPPLIER_REACTIVATED", "material"],
  ["SUPPLIER_REMOVED", "material"],
  ["invoice_overdue", "payment"],
  ["bulk_order_payment_overdue", "payment"],
  ["INVOICE_CREATED", "payment"],
  ["INVOICE_PAYMENT_RECEIVED", "payment"],
  ["INVOICE_PAID", "payment"],
  ["VENDOR_BILL_CREATED", "payment"],
  ["VENDOR_BILL_MISMATCH", "payment"],
  ["VENDOR_PAYMENT_PAID", "payment"],
  ["SUPPLIER_PAYMENT_PAID", "payment"],
  ["BULK_ORDER_PAYMENT_RECEIVED", "payment"],
  ["PAYMENT_IMPORT_COMPLETED", "payment"],
  ["SHOP_DISPATCH_INCOMING_STOCK", "dispatch"],
  ["SHOP_DISPATCH_RECEIVED", "dispatch"],
  ["SHOP_RECEIPT_DISCREPANCY_ALERT", "dispatch"],
  ["SHOP_DISPATCH_UNCONFIRMED", "dispatch"],
  ["SHOP_SALE_RECORDED", "retail"],
  ["RETAIL_BILL_RECORDED", "retail"],
  ["RETAIL_SALE_RECORDED", "retail"],
  ["WHOLESALE_SALE_RECORDED", "wholesale"],
  ["WHOLESALE_DISPATCH_RECORDED", "wholesale"],
  ["SHOP_SALE_RETURNED", "dispatch"],
  ["SHOP_RETURN_TO_INVENTORY", "dispatch"],
  ["SHOP_STOCK_LOW", "dispatch"],
  ["BULK_ORDER_PLACED", "dispatch"],
];

describe("notification routing", () => {
  it.each(ROUTING)("files %s under the %s tab", (type, category) => {
    expect(toUnifiedNotif(notif(type)).category).toBe(category);
  });

  it("gives every known type a described title rather than the raw type name", () => {
    for (const [type] of ROUTING) {
      const { title, body } = toUnifiedNotif(notif(type));
      expect(title).not.toBe(type);
      expect(body.length).toBeGreaterThan(0);
    }
  });

  it("still renders an unknown type instead of dropping it", () => {
    const unified = toUnifiedNotif(notif("Something_nobody_has_described", { a: 1 }));
    expect(unified.title).toBe("Something Nobody Has Described");
    expect(unified.body).toBe("A: 1");
  });
});

describe("notification content", () => {
  it("reads the overdue payload the backend actually sends", () => {
    const unified = toUnifiedNotif(
      notif("invoice_overdue", { invoiceNumber: "INV-Ravi-004", outstanding: 12500 }),
    );
    expect(unified.title).toContain("INV-Ravi-004");
    expect(unified.body).toContain("12,500");
    expect(unified.priority).toBe("critical");
  });

  it("marks a consignment shortage critical, not informational", () => {
    const unified = toUnifiedNotif(
      notif("SHOP_RECEIPT_DISCREPANCY_ALERT", { received: 8, damaged: 1, missing: 2, code: "SGR-2627-001" }),
    );
    expect(unified.priority).toBe("critical");
    expect(unified.body).toContain("2 missing");
  });
});

describe("sale notifications", () => {
  it("files an older wholesale-channel SHOP_SALE_RECORDED under Wholesale Sales", () => {
    expect(toUnifiedNotif(notif("SHOP_SALE_RECORDED", { channel: "WHOLESALE" })).category).toBe("wholesale");
  });

  it("carries what the admin bill prints for a retail sale", () => {
    const n = toUnifiedNotif(notif("RETAIL_SALE_RECORDED", {
      saleRef: "RETAIL-Chetan-001-001",
      sareeId: "RAMOJI RAO-L1-B001-008",
      customerName: "Chetan",
      sareeType: "KJ-001 · KANJIVARAM",
      source: { kind: "weaver", name: "Ramoji Rao", detail: "Loom 1" },
      rate: 1500,
      discount: 150,
      discountNote: "10%",
      amount: 1350,
      paymentMethod: "cash",
    }));
    const byLabel = Object.fromEntries((n.details ?? []).map(d => [d.label, d.value]));
    expect(byLabel["Saree type"]).toBe("KJ-001 · KANJIVARAM");
    expect(byLabel["Source"]).toBe("Weaver · Ramoji Rao · Loom 1");
    expect(byLabel["Discount"]).toContain("(10%)");
    expect(byLabel["Payment"]).toBe("Cash");
    expect(n.body).toContain("sold to Chetan");
    // Nothing unknown is shown as an empty row.
    expect(byLabel["Phone"]).toBeUndefined();
  });

  it("lists every saree of a wholesale dispatch with its type and source", () => {
    const n = toUnifiedNotif(notif("WHOLESALE_DISPATCH_RECORDED", {
      customerName: "Sree Kesava",
      sareeCount: 2,
      totalAmount: 4000,
      grandTotal: 4200,
      gstPct: 5,
      sarees: [
        { sareeId: "A-01", sareeType: "UP-002 · UPPADA", source: { kind: "external", name: "Sree Lakshmi Silk House", detail: "Invoice INV-9" } },
        { sareeId: "B-02", sareeType: null, source: null },
      ],
    }));
    expect(n.sarees).toEqual([
      { sareeId: "A-01", sareeType: "UP-002 · UPPADA", source: "External purchase · Sree Lakshmi Silk House · Invoice INV-9" },
      { sareeId: "B-02", sareeType: null, source: null },
    ]);
  });

  it("shows a whole counter bill as one notification with every saree priced", () => {
    const n = toUnifiedNotif(notif("RETAIL_BILL_RECORDED", {
      billRef: "RETAIL-Chetan-001-001",
      customerName: "Chetan",
      sareeCount: 2,
      retailTotal: 3000,
      discount: 150,
      total: 2850,
      lines: [
        { sareeId: "A-01", sareeType: "KJ-001 · KANJIVARAM", source: { kind: "factory", name: "Factory Loom FL-03" }, rate: 1500, discount: 150, discountNote: "10%", amount: 1350 },
        { sareeId: "B-02", sareeType: null, source: null, rate: 1500, discount: 0, amount: 1500 },
      ],
    }));
    expect(n.title).toBe("Retail Sale — RETAIL-Chetan-001-001");
    expect(n.body).toBe("2 sarees sold to Chetan for ₹2,850 after ₹150 off.");
    const byLabel = Object.fromEntries((n.details ?? []).map(d => [d.label, d.value]));
    expect(byLabel["Final amount"]).toBe("₹2,850");
    expect(n.sarees?.map(x => x.price)).toEqual(["₹1,500 − ₹150 (10%) = ₹1,350", "₹1,500"]);
    expect(n.sarees?.[0].source).toBe("Factory loom · Factory Loom FL-03");
  });

  it("says when a past bill's rate is the listed price rather than a recorded discount", () => {
    const base = { billRef: "RETAIL-Ruchitha-004-001", sareeCount: 2, retailTotal: 56000, discount: 10000, total: 46000, lines: [] };
    const note = (payload: Record<string, unknown>) =>
      toUnifiedNotif(notif("RETAIL_BILL_RECORDED", payload)).details?.find(d => d.label === "Note");

    expect(note({ ...base, rateFromListedPrice: true })?.value).toContain("listed price");
    expect(note(base)).toBeUndefined();
  });
});
