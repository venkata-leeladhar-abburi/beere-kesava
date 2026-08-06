import { NotFoundException } from "@nestjs/common";
import { VendorBillStatus } from "../generated/prisma/client";
import { VendorBillsService } from "./vendor-bills.service";

describe("VendorBillsService.recomputeStatus", () => {
  let prisma: any;
  let auditLog: any;
  let service: VendorBillsService;

  beforeEach(() => {
    prisma = {
      vendorBill: { findUnique: jest.fn(), update: jest.fn() },
      vendorPayment: { aggregate: jest.fn() },
    };
    auditLog = { recordAction: jest.fn() };
    service = new VendorBillsService(prisma, auditLog);
  });

  it("throws NotFoundException for an unknown bill id", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue(null);

    await expect(service.recomputeStatus("missing")).rejects.toThrow(NotFoundException);
  });

  it("marks PAID when paid total >= bill amount", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue({
      id: "b1",
      amount: 1000,
      dueDate: null,
      status: VendorBillStatus.PENDING,
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });

    await service.recomputeStatus("b1");

    expect(prisma.vendorBill.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { status: VendorBillStatus.PAID },
    });
  });

  it("marks PARTIAL when some but not all has been paid", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue({
      id: "b2",
      amount: 1000,
      dueDate: null,
      status: VendorBillStatus.PENDING,
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 400 } });

    await service.recomputeStatus("b2");

    expect(prisma.vendorBill.update).toHaveBeenCalledWith({
      where: { id: "b2" },
      data: { status: VendorBillStatus.PARTIAL },
    });
  });

  it("marks OVERDUE when nothing paid and the due date has passed", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue({
      id: "b3",
      amount: 1000,
      dueDate: new Date(Date.now() - 86_400_000),
      status: VendorBillStatus.PENDING,
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    await service.recomputeStatus("b3");

    expect(prisma.vendorBill.update).toHaveBeenCalledWith({
      where: { id: "b3" },
      data: { status: VendorBillStatus.OVERDUE },
    });
  });

  it("marks PENDING when nothing paid and the due date has not passed (or is unset)", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue({
      id: "b4",
      amount: 1000,
      dueDate: new Date(Date.now() + 86_400_000),
      status: VendorBillStatus.OVERDUE, // simulate a stale status
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    await service.recomputeStatus("b4");

    expect(prisma.vendorBill.update).toHaveBeenCalledWith({
      where: { id: "b4" },
      data: { status: VendorBillStatus.PENDING },
    });
  });

  it("skips the write entirely when the computed status is unchanged", async () => {
    prisma.vendorBill.findUnique.mockResolvedValue({
      id: "b5",
      amount: 1000,
      dueDate: null,
      status: VendorBillStatus.PAID,
    });
    prisma.vendorPayment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });

    await service.recomputeStatus("b5");

    expect(prisma.vendorBill.update).not.toHaveBeenCalled();
  });
});
