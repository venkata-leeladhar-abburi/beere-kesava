import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "../strategies/jwt.strategy";

/**
 * Pulls the authenticated user (populated by JwtStrategy.validate) off the
 * request. Equivalent to `@Req() req` + `req.user`, but typed and terser.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
