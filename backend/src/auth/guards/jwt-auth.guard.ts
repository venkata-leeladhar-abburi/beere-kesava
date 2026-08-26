import { ExecutionContext, Injectable } from "@nestjs/common";
import { AppException } from "../../common/errors";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Registered globally (see AuthModule) so every route requires a valid JWT
 * by default. Routes (or whole controllers) annotated with @Public() are
 * skipped — used for /auth/request-otp, /auth/verify-otp, and /health.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Splits the two very different 401s that passport reports identically.
   *
   * An expired token means the user *was* signed in and their work is
   * probably still on screen — they get a "session expired" screen that
   * returns them where they were. A missing/garbage token means they were
   * never signed in and belong at /login. Sending the first case to /login
   * silently discards whatever they had open, which is what the app did
   * before this split existed.
   */
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
  ): TUser {
    if (err || !user) {
      const isExpired =
        info instanceof Error && info.name === "TokenExpiredError";

      throw new AppException(
        401,
        isExpired ? "AUTH_SESSION_EXPIRED" : "AUTH_REQUIRED",
        isExpired ? "Your session has expired. Please sign in again." : "Authentication required.",
      );
    }

    return user;
  }
}
