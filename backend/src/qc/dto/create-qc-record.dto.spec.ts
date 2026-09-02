import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateQcRecordDto } from "./create-qc-record.dto";
import { QcResult } from "../../generated/prisma/client";

/**
 * semiDeduction is money, and the inspection screen's input accepts paise
 * (step 0.01). It was declared @IsInt, so an ordinary amount like 100.50 was
 * rejected with a 400 at the moment a verdict was being recorded — the
 * failure surfaced as "could not save", nowhere near the validation rule that
 * caused it. These pin the decimal contract shared with UpdateQcDeductionDto.
 */
describe("CreateQcRecordDto validation", () => {
  const base = {
    sareeId: "RAMESH-L1-B0007-001",
    inspectedById: "3f7c1b8e-2a4d-4c9e-8b1f-5d6e7a8b9c01",
  };

  const errorsFor = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateQcRecordDto, payload);
    const errors = await validate(dto);
    return errors.map((e) => e.property);
  };

  it("accepts a fractional semi deduction", async () => {
    expect(
      await errorsFor({ ...base, result: QcResult.SEMI, semiDeduction: 100.5 }),
    ).toEqual([]);
  });

  it("still accepts a whole-rupee semi deduction", async () => {
    expect(
      await errorsFor({ ...base, result: QcResult.SEMI, semiDeduction: 250 }),
    ).toEqual([]);
  });

  it("rejects a negative semi deduction", async () => {
    expect(
      await errorsFor({ ...base, result: QcResult.SEMI, semiDeduction: -1 }),
    ).toContain("semiDeduction");
  });

  it("ignores semiDeduction entirely for a non-SEMI verdict", async () => {
    // ValidateIf short-circuits the rule, so a PASSED verdict carrying no
    // deduction at all is valid.
    expect(await errorsFor({ ...base, result: QcResult.PASSED })).toEqual([]);
  });

  it("still rejects a fractional receivedDaysAgo, which is a day count not money", async () => {
    expect(
      await errorsFor({ ...base, result: QcResult.PASSED, receivedDaysAgo: 2.5 }),
    ).toContain("receivedDaysAgo");
  });
});
