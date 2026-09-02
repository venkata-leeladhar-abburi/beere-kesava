import { BadRequestException, NotFoundException } from "@nestjs/common";
import { QcService } from "./qc.service";
import { QcResult } from "../generated/prisma/client";

/**
 * updateDeduction is the only path that rewrites a weaver's pay after the
 * verdict is in, so its two guards matter: payable must stay inside
 * [0, makingCharge], and a PASSED record must not be editable at all —
 * otherwise a full making charge could be zeroed out of someone's payment
 * with no defect on record to justify it.
 */
describe("QcService.updateDeduction", () => {
  let prisma: any;
  let auditLog: any;
  let service: QcService;

  const record = (overrides: Record<string, unknown> = {}) => ({
    id: "qc-1",
    sareeId: "RAMESH-L1-B0007-001",
    result: QcResult.SEMI,
    makingCharge: 1000,
    deduction: 0,
    payable: 1000,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      qcRecord: {
        findUnique: jest.fn().mockResolvedValue(record()),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...record(), ...data })),
      },
    };
    auditLog = { recordAction: jest.fn() };
    const notifications = { notifyRole: jest.fn() };
    service = new QcService(prisma, auditLog, notifications as any);
  });

  it("recomputes payable from the new deduction", async () => {
    await service.updateDeduction("qc-1", { deduction: 250 });

    expect(prisma.qcRecord.update.mock.calls[0][0].data).toEqual({ deduction: 250, payable: 750 });
  });

  it("clamps a deduction above the making charge instead of paying a negative amount", async () => {
    await service.updateDeduction("qc-1", { deduction: 5000 });

    expect(prisma.qcRecord.update.mock.calls[0][0].data).toEqual({ deduction: 1000, payable: 0 });
  });

  it("allows clearing a deduction back to zero", async () => {
    prisma.qcRecord.findUnique.mockResolvedValue(record({ deduction: 400, payable: 600 }));

    await service.updateDeduction("qc-1", { deduction: 0 });

    expect(prisma.qcRecord.update.mock.calls[0][0].data).toEqual({ deduction: 0, payable: 1000 });
  });

  it("edits a DEFECTIVE record too — whether a defect costs the weaver is a judgement call", async () => {
    prisma.qcRecord.findUnique.mockResolvedValue(
      record({ result: QcResult.DEFECTIVE, deduction: 1000, payable: 0 }),
    );

    await service.updateDeduction("qc-1", { deduction: 300 });

    expect(prisma.qcRecord.update.mock.calls[0][0].data).toEqual({ deduction: 300, payable: 700 });
  });

  it("refuses to touch a PASSED record", async () => {
    prisma.qcRecord.findUnique.mockResolvedValue(record({ result: QcResult.PASSED }));

    await expect(service.updateDeduction("qc-1", { deduction: 100 })).rejects.toThrow(BadRequestException);
    expect(prisma.qcRecord.update).not.toHaveBeenCalled();
  });

  it("404s on an unknown record rather than creating one", async () => {
    prisma.qcRecord.findUnique.mockResolvedValue(null);

    await expect(service.updateDeduction("nope", { deduction: 100 })).rejects.toThrow(NotFoundException);
    expect(prisma.qcRecord.update).not.toHaveBeenCalled();
  });

  it("records the change in the audit log with both the old and new amount", async () => {
    prisma.qcRecord.findUnique.mockResolvedValue(record({ deduction: 100 }));

    await service.updateDeduction("qc-1", { deduction: 250, actorId: "u-1" });

    expect(auditLog.recordAction).toHaveBeenCalledWith(
      expect.objectContaining({ oldValue: "100", newValue: "250", module: "QC" }),
    );
  });
});
