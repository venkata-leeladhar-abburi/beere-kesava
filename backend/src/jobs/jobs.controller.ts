import { createHash, timingSafeEqual } from "crypto";
import {
  Controller,
  Headers,
  HttpCode,
  NotFoundException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../auth/decorators/public.decorator";
import { JobScheduler } from "./job-scheduler.service";

/** Compared as SHA-256 digests so the comparison is constant-time at any length. */
function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * The external trigger for scheduled jobs, called by
 * .github/workflows/scheduler.yml. Public to the JWT guard (a workflow has no
 * user session) and authenticated by a shared secret instead. With
 * JOBS_TRIGGER_SECRET unset the route answers 404, as if it did not exist.
 */
@Controller("jobs")
export class JobsController {
  constructor(private readonly scheduler: JobScheduler) {}

  @Public()
  @SkipThrottle()
  @HttpCode(200)
  @Post("tick")
  tick(@Headers("x-jobs-secret") secret?: string) {
    const expected = process.env.JOBS_TRIGGER_SECRET;
    if (!expected) throw new NotFoundException();
    if (!secretMatches(secret, expected)) throw new UnauthorizedException("Invalid jobs secret.");
    return this.scheduler.tick("external");
  }
}
