import { IsString, Matches, MaxLength } from "class-validator";

export class SetSareePhotoDto {
  /**
   * The path POST /uploads/photo returned ("/uploads/photos/<uuid>.jpg").
   * Nothing else is accepted: an inline base64 data URL is what made list
   * endpoints time out before photos moved to R2, and an arbitrary absolute
   * URL would put a third-party image into inventory.
   */
  @IsString()
  @MaxLength(200)
  @Matches(/^\/uploads\/photos\/[\w.-]+$/, {
    message: "photoUrl must be a path returned by POST /uploads/photo",
  })
  photoUrl!: string;
}
