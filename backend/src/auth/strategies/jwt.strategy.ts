import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRole, AccessLevel } from "../../generated/prisma/client";
import { JWT_SECRET } from "../jwt-secret";
import { PrismaService } from "../../prisma/prisma.service";

export interface JwtPayload {
  sub: string | undefined;
  mobile: string;
  role: UserRole;
  name: string;
  accessLevel?: AccessLevel;
  weaverId?: string | null;
}

export interface AuthenticatedUser {
  id: string | undefined;
  mobile: string;
  role: UserRole;
  name: string;
  accessLevel?: AccessLevel;
  /**
   * Real Weaver.id for WEAVER-role sessions — distinct from `id` (the
   * User.id). Weaver-scoped queries (batches, payments, ...) are FK'd to
   * Weaver.id, so they must scope on this, never on `id`.
   */
  weaverId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  // Whatever is returned here becomes req.user.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.sub) {
      // `sub` is User.id whenever a User row exists for this session (including
      // linked-weaver User rows with role=WEAVER); only the weaver-only fallback
      // login path puts a real Weaver.id in `sub`. Check User first, then Weaver.
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        const weaver = await this.prisma.weaver.findUnique({ where: { id: payload.sub } });
        if (!weaver) {
          throw new UnauthorizedException("Session invalid or user no longer exists");
        }
      }
    }

    return {
      id: payload.sub,
      mobile: payload.mobile,
      role: payload.role,
      name: payload.name,
      accessLevel: payload.accessLevel,
      weaverId: payload.weaverId ?? null,
    };
  }
}
