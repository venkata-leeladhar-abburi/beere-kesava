import { IsNumber, IsOptional, IsUUID, Min } from "class-validator";

/**
 * PATCH /qc/:id/deduction — revises the amount withheld from a weaver for a
 * defect after the verdict was recorded.
 *
 * Entering a deduction at inspection time is optional (see
 * WorkerQCInspectionScreen: whether a defect costs the weaver anything is a
 * judgement call, often made after talking to them), so it has to be
 * addable and editable afterwards from Defective History.
 *
 * `IsNumber` rather than CreateQcRecordDto's `IsInt`: a deduction is money,
 * and the inspection screen's own input accepts paise (step 0.01).
 */
export class UpdateQcDeductionDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  // Clamped server-side to [0, makingCharge] — the same bound computeQcPayment
  // applies at creation, so an edit can't push payable negative or above the
  // saree's making charge.
  @IsNumber()
  @Min(0)
  deduction!: number;
}
