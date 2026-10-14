import { HttpStatus } from "@nestjs/common";
import type { CookieOptions } from "express";
import { AppException } from "../common/errors";
import { AccessLevel, ActiveStatus, Prisma, UserRole } from "../generated/prisma/client";
import type { PrismaService } from "../prisma/prisma.service";
import { accessLevelFor, rolesOf } from "../users/portal-access";
import type { AuthenticatedUser, JwtPayload } from "./strategies/jwt.strategy";

/**
 * Server-side sessions.
 *
 * Tokens have no expiry (a product decision, see auth.module.ts), so the token
 * alone can never be taken back. Each one therefore names an AuthSession row
 * (`sid`) and every request re-reads that row together with the account
 * behind it. That one lookup is what makes all of these take effect on the
 * very next request rather than at the next login:
 *
 *   - signing out, or an admin ending a session (lost phone)
 *   - deactivating the account
 *   - removing the portal the token was issued for
 *   - changing the portal's access level
 *
 * It replaces the user-exists lookup JwtStrategy already did per request, so
 * it costs no extra round trip.
 */

/** httpOnly cookie that carries the token when the frontend runs in cookie mode. */
export const SESSION_COOKIE = "bk_session";

/**
 * The frontend sends this on every cookie-authenticated request. A cross-site
 * page cannot set a custom header without a CORS preflight, which the origin
 * allow-list refuses, so its presence proves the request came from our app.
 */
export const CSRF_HEADER = "x-bk-csrf";

/** The client asks for cookie delivery on login with `X-Auth-Mode: cookie`. */
export const AUTH_MODE_HEADER = "x-auth-mode";

export const SessionEndReason = {
  LOGOUT: "LOGOUT",
  REVOKED: "REVOKED",
  DEACTIVATED: "DEACTIVATED",
} as const;
export type SessionEndReason = (typeof SessionEndReason)[keyof typeof SessionEndReason];

// lastSeenAt is for the "active sessions" list, not an audit trail, so it is
// refreshed at most this often rather than costing a write on every request.
const LAST_SEEN_REFRESH_MS = 5 * 60_000;

/**
 * AUTH_SESSION_EXPIRED, not AUTH_REQUIRED: the frontend tears the session
 * down and shows the "signed out" screen only for this code. AUTH_REQUIRED
 * with a session present is treated as a transient blip and left alone.
 */
export function sessionEnded(message: string): AppException {
  return new AppException(HttpStatus.UNAUTHORIZED, "AUTH_SESSION_EXPIRED", message);
}

const DEACTIVATED_MESSAGE = "This account has been deactivated. Contact your administrator.";

export async function createSession(
  prisma: PrismaService,
  owner: { userId: string } | { weaverId: string },
  device?: string,
): Promise<string> {
  const row = await prisma.authSession.create({ data: { ...owner, device }, select: { id: true } });
  return row.id;
}

export async function revokeSessions(
  prisma: PrismaService,
  where: Prisma.AuthSessionWhereInput,
  reason: SessionEndReason,
): Promise<number> {
  const { count } = await prisma.authSession.updateMany({
    where: { ...where, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return count;
}

/**
 * Turns a verified token into req.user, or throws if its session is no longer
 * good. Role and access level come from the database, not the token: the
 * token only says which portal the session is in.
 */
export async function resolveSession(
  prisma: PrismaService,
  payload: JwtPayload,
): Promise<AuthenticatedUser> {
  // Tokens issued before sessions existed carry no sid and cannot be revoked,
  // so they are retired outright: one extra sign-in per device, once.
  if (!payload.sid) {
    throw sessionEnded("Please sign in again.");
  }

  const session = await prisma.authSession.findUnique({
    where: { id: payload.sid },
    include: { user: { include: { portalAccess: true } }, weaver: true },
  });
  if (!session || session.revokedAt) {
    throw sessionEnded("You were signed out on this device. Please sign in again.");
  }

  let resolved: AuthenticatedUser;
  if (session.user) {
    const user = session.user;
    if (user.id !== payload.sub) {
      throw sessionEnded("Please sign in again.");
    }
    if (user.status !== ActiveStatus.ACTIVE) {
      throw sessionEnded(DEACTIVATED_MESSAGE);
    }
    if (!rolesOf(user).includes(payload.role)) {
      throw sessionEnded("Your access has changed. Please sign in again.");
    }
    resolved = {
      id: user.id,
      sessionId: session.id,
      mobile: payload.mobile,
      role: payload.role,
      name: `${user.firstName} ${user.lastName}`,
      accessLevel: accessLevelFor(user, payload.role),
      weaverId: user.linkedWeaverId ?? null,
    };
  } else if (session.weaver) {
    const weaver = session.weaver;
    if (weaver.id !== payload.sub || payload.role !== UserRole.WEAVER) {
      throw sessionEnded("Please sign in again.");
    }
    if (weaver.status !== ActiveStatus.ACTIVE) {
      throw sessionEnded(DEACTIVATED_MESSAGE);
    }
    resolved = {
      id: weaver.id,
      sessionId: session.id,
      mobile: payload.mobile,
      role: UserRole.WEAVER,
      name: weaver.name,
      accessLevel: AccessLevel.FULL_ACCESS,
      weaverId: weaver.id,
    };
  } else {
    throw sessionEnded("Please sign in again.");
  }

  if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_REFRESH_MS) {
    // Best-effort: a failed bookkeeping write must not fail the request.
    void prisma.authSession
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  return resolved;
}

/** Reads one cookie from a raw Cookie header (no cookie-parser dependency). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Host-only, so it is sent to the API's own host and nowhere else. SameSite
 * Lax means the browser withholds it from cross-site POSTs and cross-site
 * fetches, which is why cookie mode needs the frontend and API on the same
 * site (e.g. app.example.com + api.example.com): see docs/DEPLOY_RUNBOOK.md.
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Sessions end on logout or revocation, not on a clock. 400 days is the
    // longest lifetime browsers will honour.
    maxAge: 400 * 24 * 60 * 60 * 1000,
  };
}
