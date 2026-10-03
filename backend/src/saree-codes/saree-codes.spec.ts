import { invoiceSegment, mergeAliases, planLineRenames, splitPieceCode, supplierPrefix } from "./saree-codes";
import { SareeCodesService } from "./saree-codes.service";

describe("supplierPrefix / invoiceSegment (must match the frontend's buildSareeCode)", () => {
  it("uses the short name, uppercased, letters and digits only", () => {
    expect(supplierPrefix("Saboo Seide", "sabo")).toBe("SABO");
    expect(supplierPrefix("J.M. SILKS", "J.M.")).toBe("JM");
  });

  it("falls back to the first four letters of the name", () => {
    expect(supplierPrefix("JJ SILKS", null)).toBe("JJSI");
    expect(supplierPrefix("JJ SILKS", "")).toBe("JJSI");
    expect(supplierPrefix("A1", null)).toBe("AXXX");
    expect(supplierPrefix("", null)).toBe("SUPP");
  });

  it("trims the invoice number and uses NOINV when blank", () => {
    expect(invoiceSegment("EXTRA ")).toBe("EXTRA");
    expect(invoiceSegment(null)).toBe("NOINV");
  });
});

describe("planLineRenames", () => {
  it("rebuilds codes from the current prefix and invoice, keeping the serial", () => {
    expect(
      planLineRenames(
        [{ id: "a", code: "SABO-EXCHNG-001" }, { id: "b", code: "SABO-EXG-002" }],
        "SABO",
        "EXG",
      ),
    ).toEqual([{ id: "a", oldCode: "SABO-EXCHNG-001", newCode: "SABO-EXG-001" }]);
  });

  it("reads the serial from the end, so an invoice with dashes is fine", () => {
    expect(planLineRenames([{ id: "a", code: "JJSI-INV-2026-12-003" }], "JJ", "INV-2026-12")).toEqual([
      { id: "a", oldCode: "JJSI-INV-2026-12-003", newCode: "JJ-INV-2026-12-003" },
    ]);
  });

  it("leaves a code without a serial alone", () => {
    expect(planLineRenames([{ id: "a", code: "LINE-1" }], "JJ", "5")).toEqual([]);
  });
});

describe("splitPieceCode", () => {
  it("splits off the piece number", () => {
    expect(splitPieceCode("SABO-EXCHNG-001-01")).toEqual({ lineCode: "SABO-EXCHNG-001", pieceSuffix: "01" });
    expect(splitPieceCode("SABO-EXCHNG-001-120")).toEqual({ lineCode: "SABO-EXCHNG-001", pieceSuffix: "120" });
  });
});

describe("mergeAliases", () => {
  it("records old → new", () => {
    expect(mergeAliases([], [{ oldCode: "A", newCode: "B" }], new Set(["B"]))).toEqual({
      upsert: [{ oldCode: "A", newCode: "B" }],
      remove: [],
    });
  });

  it("flattens a chain: A→B then B→C leaves A→C and B→C", () => {
    const r = mergeAliases([{ oldCode: "A", newCode: "B" }], [{ oldCode: "B", newCode: "C" }], new Set(["C"]));
    expect(r.upsert).toEqual(expect.arrayContaining([{ oldCode: "A", newCode: "C" }, { oldCode: "B", newCode: "C" }]));
    expect(r.remove).toEqual([]);
  });

  it("drops an alias whose old code is live again (renamed back)", () => {
    const r = mergeAliases([{ oldCode: "A", newCode: "B" }], [{ oldCode: "B", newCode: "A" }], new Set(["A"]));
    expect(r.remove).toEqual(["A"]);
    expect(r.upsert).toEqual([{ oldCode: "B", newCode: "A" }]);
  });
});

describe("SareeCodesService.resolveMany", () => {
  const prisma = {
    sareeCodeAlias: {
      findMany: jest.fn().mockResolvedValue([{ oldCode: "SABO-EXCHNG-001", newCode: "SABO-EXG-001" }]),
    },
  };
  const service = new SareeCodesService(prisma as never);

  it("maps an old line code and old piece codes to the current ones", async () => {
    await expect(
      service.resolveMany(["SABO-EXCHNG-001", "SABO-EXCHNG-001-02", " sabo-exchng-001-01 ", "OTHER-1-001-01"]),
    ).resolves.toEqual(["SABO-EXG-001", "SABO-EXG-001-02", "SABO-EXG-001-01", "OTHER-1-001-01"]);
  });
});

describe("SareeCodesService.resolve with Redis cache", () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma = { sareeCodeAlias: { findMany } };

  it("serves a hit without touching the database, and fills on a miss", async () => {
    const redis = { enabled: true, get: jest.fn().mockResolvedValueOnce("CACHED").mockResolvedValueOnce(null), set: jest.fn(), del: jest.fn() };
    const service = new SareeCodesService(prisma as never, redis as never);
    await expect(service.resolve("OLD-1")).resolves.toBe("CACHED");
    expect(findMany).not.toHaveBeenCalled();
    await expect(service.resolve("PLAIN-1")).resolves.toBe("PLAIN-1");
    expect(redis.set).toHaveBeenCalledWith("saree-alias:PLAIN-1", "PLAIN-1", 30);
  });

  it("bypasses the cache inside a transaction", async () => {
    const redis = { enabled: true, get: jest.fn(), set: jest.fn(), del: jest.fn() };
    const service = new SareeCodesService(prisma as never, redis as never);
    await service.resolve("X-1", { sareeCodeAlias: { findMany } } as never);
    expect(redis.get).not.toHaveBeenCalled();
  });
});
