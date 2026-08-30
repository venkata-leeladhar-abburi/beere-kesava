import { IsDateString, IsOptional } from "class-validator";
import { StatsRange } from "../weavers.service";

/**
 * Optional window for the production/QC aggregates. Omitting both bounds
 * gives all-time figures, which is what every caller got before the window
 * existed — so the default stays backwards-compatible.
 */
export class WeaverStatsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  range(): StatsRange | undefined {
    if (!this.from && !this.to) return undefined;
    return {
      from: this.from ? new Date(this.from) : undefined,
      to: this.to ? new Date(this.to) : undefined,
    };
  }
}
