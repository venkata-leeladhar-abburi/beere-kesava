import { IdGeneratorService, businessSegment, nameSegment } from "./id-generator.service";

describe("nameSegment", () => {
  it("keeps only the first word", () => {
    expect(nameSegment("Sree kesava")).toBe("Sree");
    expect(nameSegment("Shiva Traders & Co")).toBe("Shiva");
  });

  it("strips punctuation and capitalises the word", () => {
    expect(nameSegment("O'Brien")).toBe("OBrien");
    expect(nameSegment("  padma  ")).toBe("Padma");
  });

  it("falls back when the name has no usable characters, so ids never start with '-'", () => {
    expect(nameSegment("")).toBe("Unknown");
    expect(nameSegment("!!!")).toBe("Unknown");
    expect(nameSegment("###", "Customer")).toBe("Customer");
  });
});

describe("businessSegment", () => {
  it("joins every word into one compact segment", () => {
    expect(businessSegment("Shiva Traders")).toBe("ShivaTraders");
    expect(businessSegment("Sree Ganesh Silks")).toBe("SreeGaneshSilks");
  });

  it("capitalises each word so casing is consistent however it was typed", () => {
    expect(businessSegment("sree kesava")).toBe("SreeKesava");
    expect(businessSegment("PARVATHI silks")).toBe("PARVATHISilks");
  });

  it("strips punctuation and falls back on empty input", () => {
    expect(businessSegment("A.B. & Sons")).toBe("ABSons");
    expect(businessSegment("   ")).toBe("Unknown");
  });
});

describe("IdGeneratorService", () => {
  let prisma: any;
  let service: IdGeneratorService;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    service = new IdGeneratorService(prisma);
  });

  it("pads global ids to three digits by default", async () => {
    prisma.$queryRaw.mockResolvedValue([{ value: 7 }]);
    await expect(service.nextFormatted("WHL")).resolves.toBe("WHL-007");
  });

  it("does not truncate sequences that outgrow the padding", async () => {
    prisma.$queryRaw.mockResolvedValue([{ value: 1234 }]);
    await expect(service.nextFormatted("WHL")).resolves.toBe("WHL-1234");
  });

  it("builds a scoped id embedding the parent code", async () => {
    prisma.$queryRaw.mockResolvedValue([{ value: 1 }]);
    await expect(service.nextScoped("ORD", "SreeGanesh-001")).resolves.toBe("ORD-SreeGanesh-001-001");
  });

  it("keys the scoped counter per parent so each parent sequences independently", async () => {
    prisma.$queryRaw.mockResolvedValue([{ value: 1 }]);

    await service.nextScoped("ORD", "SreeGanesh-001");
    await service.nextScoped("ORD", "Parvathi-002");

    // The raw query is a tagged template — the interpolated counter key is the
    // first (and only) parameter passed alongside the SQL fragments.
    const keys = prisma.$queryRaw.mock.calls.map((call: unknown[]) => call[1]);
    expect(keys).toEqual(["ORD:SreeGanesh-001", "ORD:Parvathi-002"]);
  });

  it("returns the raw sequence number from next()", async () => {
    prisma.$queryRaw.mockResolvedValue([{ value: 42 }]);
    await expect(service.next("WHL")).resolves.toBe(42);
  });
});
