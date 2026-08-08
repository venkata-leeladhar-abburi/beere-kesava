import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRole, AccessLevel } from "../../generated/prisma/client";

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
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "beere-kesava-secret-key-2026",
    });
  }

  // Whatever is returned here becomes req.user.
  validate(payload: JwtPayload): AuthenticatedUser {
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
