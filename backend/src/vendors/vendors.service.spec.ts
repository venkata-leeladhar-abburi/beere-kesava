import { ConflictException } from "@nestjs/common";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { VendorsService } from "./vendors.service";

describe("VendorsService duplicate guard", () => {
  const prisma = { vendor: { findFirst: jest.fn(), create: jest.fn() } };
  const idGenerator = { nextNamed: jest.fn().mockResolvedValue("ShivaTraders-001") };
  const service = new VendorsService(prisma as never, {} as never, idGenerator as never);

  const dto = { name: "Shiva Traders", phone: "+91 98765 43210" } as CreatePartyDto;

  beforeEach(() => jest.clearAllMocks());

  it("rejects a vendor whose phone is already on file, in any format", async () => {
    prisma.vendor.findFirst.mockResolvedValue({ name: "Shiva Traders", code: "ShivaTraders-001" });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.vendor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: { endsWith: "9876543210" } } }),
    );
    expect(prisma.vendor.create).not.toHaveBeenCalled();
  });

  it("falls back to a name match when no phone was given", async () => {
    prisma.vendor.findFirst.mockResolvedValue(null);
    prisma.vendor.create.mockResolvedValue({});

    await service.create({ name: "Shiva Traders" });
    expect(prisma.vendor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: { equals: "Shiva Traders", mode: "insensitive" } } }),
    );
    expect(prisma.vendor.create).toHaveBeenCalled();
  });

  it("creates when nothing matches", async () => {
    prisma.vendor.findFirst.mockResolvedValue(null);
    prisma.vendor.create.mockResolvedValue({ id: "v1" });

    await expect(service.create(dto)).resolves.toEqual({ id: "v1" });
    expect(prisma.vendor.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: "ShivaTraders-001" }) }),
    );
  });
});
