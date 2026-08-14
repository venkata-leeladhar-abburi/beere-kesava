import { NotFoundException } from "@nestjs/common";
import { RateRequestsService } from "./rate-requests.service";

describe("RateRequestsService.approve", () => {
  let prisma: any;
  let idGenerator: any;
  let auditLog: any;
  let service: RateRequestsService;

  beforeEach(() => {
    idGenerator = { nextFormatted: jest.fn() };
    auditLog = { recordAction: jest.fn() };
    prisma = {
      rateChangeRequest: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new RateRequestsService(prisma, idGenerator, auditLog);
  });

  it("throws NotFoundException when the rate change request doesn't exist", async () => {
    prisma.rateChangeRequest.findUnique.mockResolvedValue(null);

    await expect(service.approve("missing")).rejects.toThrow(NotFoundException);
  });

  it("updates both the request status and the SareeTypeRate catalog inside the same transaction", async () => {
    const existing = {
      id: "RCR-1",
      sareeTypeCode: "ST-001",
      status: "PENDING",
      newMakingCharge: 150,
      newRetailPrice: 2500,
      newWholesalePrice: 2000,
    };
    prisma.rateChangeRequest.findUnique.mockResolvedValue(existing);

    let capturedTx: any;
    prisma.$transaction.mockImplementation((fn: any) => {
      const tx = {
        rateChangeRequest: {
          update: jest.fn().mockResolvedValue({ ...existing, status: "APPROVED" }),
        },
        sareeTypeRate: { update: jest.fn().mockResolvedValue({}) },
      };
      capturedTx = tx;
      return fn(tx);
    });

    const result = await service.approve("RCR-1", "admin-1");

    expect(capturedTx.rateChangeRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "RCR-1" },
        data: expect.objectContaining({ status: "APPROVED", decidedById: "admin-1" }),
      }),
    );
    expect(capturedTx.sareeTypeRate.update).toHaveBeenCalledWith({
      where: { code: "ST-001" },
      data: {
        makingCharge: 150,
        retailPrice: 2500,
        wholesalePrice: 2000,
      },
    });
    expect(result.status).toBe("APPROVED");

    expect(auditLog.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        module: "RATE_REQUESTS",
        oldValue: "PENDING",
        newValue: "APPROVED",
      }),
    );
  });

  it("passes decidedById: null when no approver id is given", async () => {
    const existing = {
      id: "RCR-2",
      sareeTypeCode: "ST-002",
      status: "PENDING",
      newMakingCharge: 100,
      newRetailPrice: 1000,
      newWholesalePrice: 900,
    };
    prisma.rateChangeRequest.findUnique.mockResolvedValue(existing);

    let capturedTx: any;
    prisma.$transaction.mockImplementation((fn: any) => {
      capturedTx = {
        rateChangeRequest: { update: jest.fn().mockResolvedValue(existing) },
        sareeTypeRate: { update: jest.fn().mockResolvedValue({}) },
      };
      return fn(capturedTx);
    });

    await service.approve("RCR-2");

    expect(capturedTx.rateChangeRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ decidedById: null }) }),
    );
  });
});
