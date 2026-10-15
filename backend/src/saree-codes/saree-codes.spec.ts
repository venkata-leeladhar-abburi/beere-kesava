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
      findMany: jest.fn().mockResolvedValue([
        { oldCode: "SABO-EXCHNG-001", newCode: "SABO-EXG-001" },
        { oldCode: "RML-EXOL-001", newCode: "RML-EXOL1-001" },
      ]),
    },
    // RML-EXOL-001 still belongs to another purchase's line.
    purchaseSareeLine: { findMany: jest.fn().mockResolvedValue([{ code: "RML-EXOL-001" }]) },
  };
  const service = new SareeCodesService(prisma as never);

  it("maps an old line code and old piece codes to the current ones", async () => {
    await expect(
      service.resolveMany(["SABO-EXCHNG-001", "SABO-EXCHNG-001-02", " sabo-exchng-001-01 ", "OTHER-1-001-01"]),
    ).resolves.toEqual(["SABO-EXG-001", "SABO-EXG-001-02", "SABO-EXG-001-01", "OTHER-1-001-01"]);
  });

  it("ignores an alias whose old code is still a live line", async () => {
    await expect(service.resolveMany(["RML-EXOL-001-08", "rml-exol-001"])).resolves.toEqual([
      "RML-EXOL-001-08",
      "rml-exol-001",
    ]);
  });
});

describe("SareeCodesService.recodePurchases", () => {
  // Purchase P2 (invoice EXOL1) re-coded off RML-EXOL-001, which purchase P1
  // still uses — plus duplicate-code checks on what's left.
  function txWith(lines: { id: string; code: string; purchaseId: string }[]) {
    const upsert = jest.fn();
    const deleteMany = jest.fn();
    const tx = {
      purchase: { findMany: jest.fn().mockResolvedValue([]) },
      purchaseSareeLine: {
        findMany: jest.fn(({ where }: { where: { purchaseId?: { in: string[] }; code?: { in: string[] } } }) =>
          Promise.resolve(
            lines.filter((l) =>
              where.purchaseId ? where.purchaseId.in.includes(l.purchaseId) : where.code ? where.code.in.includes(l.code) : true,
            ),
          ),
        ),
        findFirst: jest.fn(
          ({ where }: { where: { id: { notIn: string[] }; code?: { in: string[] }; OR?: { code: { equals: string } }[] } }) =>
            Promise.resolve(
              lines.find(
                (l) =>
                  !where.id.notIn.includes(l.id) &&
                  (where.code
                    ? where.code.in.includes(l.code)
                    : where.OR!.some((o) => o.code.equals.toUpperCase() === l.code.toUpperCase())),
              ) ?? null,
            ),
        ),
      },
      sareeCodeAlias: { findMany: jest.fn().mockResolvedValue([]), upsert, deleteMany },
    };
    return { tx, upsert, deleteMany };
  }

  it("records no alias for an old code another purchase still uses", async () => {
    const { tx, upsert } = txWith([
      { id: "a", code: "RML-EXOL-001", purchaseId: "P1" },
      { id: "b", code: "RML-EXOL1-001", purchaseId: "P2" },
    ]);
    const service = new SareeCodesService({} as never);
    jest.spyOn(service, "planPurchases").mockResolvedValue([
      { id: "b", oldCode: "RML-EXOL-001", newCode: "RML-EXOL1-001", purchaseId: "P2" },
    ]);
    // The rewrite itself is SQL; the lines above already show "b" at its new code.
    jest.spyOn(service as never, "rewrite").mockResolvedValue(undefined as never);
    await service.recodePurchases(tx as never, ["P2"]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses a purchase whose codes another purchase already has", async () => {
    const { tx } = txWith([
      { id: "a", code: "PSG-EXOL-001", purchaseId: "P1" },
      { id: "b", code: "PSG-EXOL-001", purchaseId: "P2" },
    ]);
    const service = new SareeCodesService({} as never);
    await expect(service.recodePurchases(tx as never, ["P2"])).rejects.toThrow(
      "Saree code PSG-EXOL-001 is already used by purchase P1",
    );
  });

  it("refuses two lines with the same code inside one purchase", async () => {
    const { tx } = txWith([
      { id: "a", code: "PSG-X-001", purchaseId: "P1" },
      { id: "b", code: "psg-x-001", purchaseId: "P1" },
    ]);
    const service = new SareeCodesService({} as never);
    await expect(service.recodePurchases(tx as never, ["P1"])).rejects.toThrow("Two sarees in this purchase");
  });

  it("accepts a purchase whose codes are its own", async () => {
    const { tx } = txWith([
      { id: "a", code: "PSG-EXOL-001", purchaseId: "P1" },
      { id: "b", code: "PSG-EXOL1-001", purchaseId: "P2" },
    ]);
    const service = new SareeCodesService({} as never);
    await expect(service.recodePurchases(tx as never, ["P2"])).resolves.toEqual([]);
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

describe("SareeCodesService.assertCodesFree (before new lines are written)", () => {
  const service = new SareeCodesService({} as never);
  const clientFinding = (hit: { code: string; purchaseId: string } | null) => ({
    purchaseSareeLine: { findFirst: jest.fn().mockResolvedValue(hit) },
  });

  it("refuses a code another purchase already has", async () => {
    const client = clientFinding({ code: "PSG-EXOL-001", purchaseId: "P1" });
    await expect(service.assertCodesFree(client as never, ["PSG-EXOL-001"])).rejects.toThrow(
      "Saree code PSG-EXOL-001 is already used by purchase P1",
    );
  });

  it("refuses two new lines with the same code, or one matching a kept line", async () => {
    const client = clientFinding(null);
    await expect(service.assertCodesFree(client as never, ["A-1-001", "a-1-001"])).rejects.toThrow(
      "Two sarees in this purchase",
    );
    await expect(
      service.assertCodesFree(client as never, ["A-1-002"], { purchaseId: "P2", keptCodes: ["A-1-002"] }),
    ).rejects.toThrow("Two sarees in this purchase");
  });

  it("looks only outside the purchase being edited", async () => {
    const client = clientFinding(null);
    await service.assertCodesFree(client as never, ["A-1-003"], { purchaseId: "P2", keptCodes: ["A-1-001"] });
    expect(client.purchaseSareeLine.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ purchaseId: { not: "P2" } }) }),
    );
  });
});
