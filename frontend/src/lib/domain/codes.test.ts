/**
 * Each expectation here is a code the backend actually mints — the service
 * that produces it is named in the comment, so a divergence between registry
 * and generator shows up as a failing test rather than a wrong badge.
 */
import { describe, it, expect } from "vitest";
import { ENTITY_CODES, getEntitySpec, parseCode, parseAnyCode, isValidCode, financialYearCode } from "./codes";

describe("named entity codes", () => {
  // suppliers.service.ts:22 — nextNamed("SUPPLIER", businessSegment(name))
  it("parses a supplier code as segment + serial", () => {
    expect(parseCode("supplier", "SreeDurga-001")).toEqual({
      type: "supplier", segment: "SreeDurga", serial: 1, valid: true,
    });
  });

  // weavers.service.ts:83 — nextNamed("WEAVER", nameSegment(firstName))
  it("parses a weaver code", () => {
    expect(parseCode("weaver", "Padma-012").serial).toBe(12);
  });

  // factory-looms.service.ts:31 — the segment is the literal word "Loom"
  it("parses a factory loom code", () => {
    expect(parseCode("loom", "Loom-001").valid).toBe(true);
  });

  // sales.service.ts:406 — nextNamed("RET", …), so a sale return is shaped
  // exactly like a supplier code and only context separates them.
  it("parses a sale return code, which is indistinguishable from a supplier's", () => {
    expect(parseCode("saleReturn", "SreeDurga-004").serial).toBe(4);
    expect(isValidCode("supplier", "SreeDurga-004")).toBe(true);
  });

  it("rejects the old UUID-slice badge", () => {
    expect(isValidCode("supplier", "SUP-7141A9E5")).toBe(false);
  });

  it("rejects a code whose serial is under the pad width", () => {
    expect(isValidCode("supplier", "SreeDurga-1")).toBe(false);
  });

  it("accepts a counter that has grown past the pad width", () => {
    expect(parseCode("weaver", "Padma-1024").serial).toBe(1024);
  });
});

describe("prefixed codes", () => {
  // batches.service.ts:53 — nextFormatted("BATCH")
  it("parses a batch code", () => {
    expect(parseCode("batch", "BATCH-086")).toEqual({ type: "batch", serial: 86, valid: true });
  });

  // payments.service.ts:45 — nextFormatted("REFERENCE")
  it("parses a generic payment reference", () => {
    expect(isValidCode("payment", "REFERENCE-118")).toBe(true);
  });

  // firms.service.ts:26 — nextFormatted("FIRM")
  it("parses a firm code", () => {
    expect(parseCode("firm", "FIRM-002").serial).toBe(2);
  });

  // users.service.ts:18 — one prefix per role
  it("accepts every role prefix an employee code can carry", () => {
    for (const code of ["SUPER-001", "ADMIN-002", "STAFF-003", "SHOP-004", "ACCT-005", "FIN-006"]) {
      expect(isValidCode("employee", code)).toBe(true);
    }
  });

  it("rejects an unknown role prefix", () => {
    expect(isValidCode("employee", "MANAGER-001")).toBe(false);
  });
});

describe("scoped document codes", () => {
  // invoices.service.ts:44 — nextScoped("INV", customer.code)
  it("splits an invoice into parent code and per-parent serial", () => {
    expect(parseCode("invoice", "INV-Kamala-002-014")).toEqual({
      type: "invoice", segment: "Kamala-002", serial: 14, valid: true,
    });
  });

  // purchase-orders.service.ts:28 / :181 — both scoped on the vendor code
  it("parses purchase orders and goods receipts", () => {
    expect(parseCode("purchaseOrder", "PO-ShivaTraders-001-007").segment).toBe("ShivaTraders-001");
    expect(parseCode("goodsReceipt", "GRN-ShivaTraders-001-007").serial).toBe(7);
  });

  // dispatch.service.ts:127 — the one type scoped on the financial year
  it("accepts a financial year as the challan's scope parent", () => {
    expect(parseCode("challan", "DC-2627-042")).toEqual({
      type: "challan", segment: "2627", serial: 42, valid: true,
    });
  });

  // invoices.service.ts:44 — `customer.code ?? businessSegment(customer.name)`,
  // so a customer predating codes scopes on a bare segment.
  it("accepts a bare name segment as the scope parent", () => {
    expect(parseCode("invoice", "INV-Kamala-014")).toEqual({
      type: "invoice", segment: "Kamala", serial: 14, valid: true,
    });
  });

  it("rejects a parent carrying characters cleanWord would have stripped", () => {
    expect(isValidCode("invoice", "INV-Kamala 002-014")).toBe(false);
    expect(isValidCode("invoice", "INV-Kamala/002-014")).toBe(false);
  });

  it("rejects the pre-migration year-scoped invoice format", () => {
    expect(isValidCode("invoice", "INV-2627-0142")).toBe(false);
  });

  // shop-receipts.service.ts:148 — SGR is FY-scoped, so a name parent is wrong
  // for it, exactly the inverse of the invoice case above.
  it("scopes shop goods receipts on the year and nothing else", () => {
    expect(isValidCode("shopReceipt", "SGR-2627-014")).toBe(true);
    expect(isValidCode("shopReceipt", "SGR-Kamala-002-014")).toBe(false);
  });

  // payments.service.ts:113 / :185
  it("parses party-scoped payment ids", () => {
    expect(parseCode("supplierPayment", "SP-SreeDurga-001-004").segment).toBe("SreeDurga-001");
    expect(parseCode("vendorPayment", "VP-ShivaTraders-001-002").serial).toBe(2);
  });

  // material-issues.service.ts:102 — the parent is a weaver or a factory loom
  it("scopes material movements on either holder", () => {
    expect(isValidCode("materialIssue", "MIR-Padma-001-003")).toBe(true);
    expect(isValidCode("materialReturn", "MRR-Loom-001-003")).toBe(true);
  });

  // rate-requests.service.ts:42 — scoped on the requester's empId
  it("accepts an employee code as the rate request's parent", () => {
    expect(parseCode("rateRequest", "RCR-ACCT-003-002").segment).toBe("ACCT-003");
  });

  // sales.service.ts:172 — one type, one prefix per channel
  it("accepts both sales channel prefixes", () => {
    expect(isValidCode("sale", "RETAIL-Kamala-002-011")).toBe(true);
    expect(isValidCode("sale", "WHOLESALE-SreeDurga-001-004")).toBe(true);
  });

  // supplier-returns.service.ts:73 mints the first form now; the second is
  // legacy data from before that fallback was fixed, still valid as a stored id.
  it("accepts both the current supplier return shape and its legacy UUID parent", () => {
    expect(isValidCode("supplierReturn", "RR-SreeDurga-001-002")).toBe(true);
    expect(isValidCode("supplierReturn", "RR-7141a9e5-2b1c-4d3e-8f90-a1b2c3d4e5f6-002")).toBe(true);
  });

  it("does not tolerate a UUID parent on any other scoped type", () => {
    expect(isValidCode("invoice", "INV-7141a9e5-2b1c-4d3e-8f90-a1b2c3d4e5f6-002")).toBe(false);
  });
});

describe("freeform codes", () => {
  // batches.service.ts:288 — composite, no single parseable serial
  it("accepts a composite saree id and reports no serial", () => {
    const parsed = parseCode("saree", "PADMA-L3-B12-007");
    expect(parsed.valid).toBe(true);
    expect(parsed.serial).toBeNaN();
  });

  it("accepts an operator-typed design code but not an empty one", () => {
    expect(isValidCode("design", "DS-FLORAL-01")).toBe(true);
    expect(isValidCode("design", "   ")).toBe(false);
  });
});

describe("parseAnyCode", () => {
  it("identifies a prefixed type from the code alone", () => {
    expect(parseAnyCode("BATCH-086")?.type).toBe("batch");
  });

  it("identifies a scoped type from the code alone", () => {
    expect(parseAnyCode("INV-Kamala-002-014")?.type).toBe("invoice");
  });

  // GRN and SGR are distinct types; the longest-prefix ordering keeps a
  // shorter prefix from shadowing a longer one that starts the same way.
  it("does not let one prefix shadow another", () => {
    expect(parseAnyCode("GRN-ShivaTraders-001-007")?.type).toBe("goodsReceipt");
    expect(parseAnyCode("SGR-2627-014")?.type).toBe("shopReceipt");
    expect(parseAnyCode("RETAIL-Kamala-002-011")?.type).toBe("sale");
  });

  it("returns null for named codes, which carry no identifying prefix", () => {
    expect(parseAnyCode("SreeDurga-001")).toBeNull();
  });
});

describe("registry integrity", () => {
  it("every spec's own example parses as valid", () => {
    for (const type of Object.keys(ENTITY_CODES) as (keyof typeof ENTITY_CODES)[]) {
      expect({ type, valid: isValidCode(type, getEntitySpec(type).example) })
        .toEqual({ type, valid: true });
    }
  });

  it("only prefixed and scoped types declare a prefix", () => {
    for (const type of Object.keys(ENTITY_CODES) as (keyof typeof ENTITY_CODES)[]) {
      const spec = getEntitySpec(type);
      expect({ type, hasPrefix: Boolean(spec.prefix) })
        .toEqual({ type, hasPrefix: spec.shape === "prefixed" || spec.shape === "scoped" });
    }
  });
});

describe("financialYearCode", () => {
  it("runs April to March", () => {
    expect(financialYearCode(new Date("2026-04-01"))).toBe("2627");
    expect(financialYearCode(new Date("2027-03-31"))).toBe("2627");
    expect(financialYearCode(new Date("2026-03-31"))).toBe("2526");
  });
});
