import { IsEmail, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Min } from "class-validator";

export class CreateWeaverDto {
  // The acting user's id, for the action feed. Still passed explicitly by
  // the client rather than read off the authenticated request (req.user) -
  // that consolidation is separate cleanup, not part of the RBAC guards
  // this controller now carries (see weavers.controller.ts).
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  initials?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  village?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  cluster?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  looms?: number;

  @IsString()
  photoUrl!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: "phone must be a valid phone number" })
  phone!: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNo?: string;

  @IsOptional()
  @IsString()
  ifsc?: string;
}
