import { HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AppException } from "../../common/errors";
import { UserRole, AccessLevel } from "../../generated/prisma/client";
import { JWT_SECRET } from "../jwt-secret";
import { PrismaService } from "../../prisma/prisma.service";
import { CSRF_HEADER, SESSION_COOKIE, readCookie, resolveSession } from "../session";

export interface JwtPayload {
  sub: string | undefined;
  mobile: string;
  role: UserRole;
  name: string;
  accessLevel?: AccessLevel;
  weaverId?: string | null;
  /** AuthSession.id. Absent only on tokens issued before sessions existed. */
  sid?: string;
}

export interface AuthenticatedUser {
  id: string | undefined;
  /** The AuthSession this request belongs to: what logout and revocation end. */
  sessionId?: string;
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

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function cookieToken(req: Request): string | null {
  return readCookie(req.headers.cookie, SESSION_COOKIE) ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Bearer first: scripts, integration tests and bearer-mode clients send
      // the header; cookie-mode browsers send the httpOnly cookie instead.
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), cookieToken]),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
      passReqToCallback: true,
    });
  }

  // Whatever is returned here becomes req.user. Account status, role and
  // access level are re-read from the database here on every request; see
  // auth/session.ts for why.
  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
    // A cookie rides along on any request the browser makes to this host, so
    // a cookie-authenticated write must also prove it came from our own app.
    // Bearer requests need no such check: only our own script can set that
    // header.
    const viaCookie = !req.headers.authorization;
    if (viaCookie && !SAFE_METHODS.has(req.method) && !req.headers[CSRF_HEADER]) {
      throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE", "Request blocked: missing CSRF header.");
    }
    return resolveSession(this.prisma, payload);
  }
}
