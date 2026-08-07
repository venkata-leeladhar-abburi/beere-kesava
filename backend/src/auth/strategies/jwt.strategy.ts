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
}

export interface AuthenticatedUser {
  id: string | undefined;
  mobile: string;
  role: UserRole;
  name: string;
  accessLevel?: AccessLevel;
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
    };
  }
}
