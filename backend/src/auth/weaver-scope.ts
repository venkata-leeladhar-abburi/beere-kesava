import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "../generated/prisma/client";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";

/**
 * Resolves the Weaver.id a request must be scoped to, or `undefined` for
 * roles that legitimately see everything.
 *
 * Weaver-owned data (batches, payments, material issues, warp requests) is
 * FK'd to Weaver.id — NOT to User.id, which is what the JWT `sub` carries.
 * Callers must always scope on this, never on `user.id`.
 *
 * A WEAVER session with no weaverId (an unlinked user, or a token issued
 * before weaverId was added to the payload) is rejected rather than left
 * unscoped: silently returning `undefined` would drop the WHERE clause and
 * expose every weaver's records.
 */
export function resolveWeaverScope(user: AuthenticatedUser): string | undefined {
  if (user.role !== UserRole.WEAVER) return undefined;
  return requireWeaverId(user);
}

/**
 * The caller's own Weaver.id, or a 403. Use when the id is required
 * outright (e.g. stamping ownership on a record the weaver is creating),
 * rather than as an optional filter.
 */
export function requireWeaverId(user: AuthenticatedUser): string {
  if (!user.weaverId) {
    throw new ForbiddenException(
      "This weaver login isn't linked to a weaver record. Please sign in again.",
    );
  }
  return user.weaverId;
}
