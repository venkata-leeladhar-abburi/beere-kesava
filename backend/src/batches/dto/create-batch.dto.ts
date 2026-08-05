import { IsDateString, IsInt, Min } from "class-validator";

export class CreateBatchDto {
  @IsInt()
  @Min(1)
  totalCount!: number;

  @IsDateString()
  dueDate!: string;
}
