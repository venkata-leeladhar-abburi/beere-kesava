/**
 * The single source of truth for the JWT signing/verification secret.
 *
 * Three separate places need this value — AuthModule's JwtModule.register(),
 * JwtStrategy's secretOrKey, and NotificationsModule's own JwtModule (the
 * websocket gateway verifies the same tokens). Each used to inline
 * `process.env.JWT_SECRET || "<committed fallback>"`. Two problems with that:
 *
 *   1. The fallback is committed source. Anyone with repo access could forge
 *      a token for any role against a deploy that was missing the env var.
 *   2. The production guard lived in auth.module.ts, so it only ran if that
 *      module happened to be imported first. NotificationsModule imports
 *      JwtModule directly and would have silently accepted the fallback on
 *      its own. Putting the check here makes it run for whichever consumer
 *      loads first, in every import order.
 *
 * Resolved at module load, not per-request, because JwtModule.register() and
 * PassportStrategy's super() both read it synchronously at import time — see
 * the comment atop src/main.ts about why dotenv/config must precede all of it.
 */

/**
 * Stable so that dev/test tokens survive a server restart. Safe only because
 * it can never be reached in production — see the guard below.
 */
const DEV_FALLBACK_SECRET = "beere-kesava-dev-only-insecure-secret";

/** Long enough that a brute-force against HS256 is not the weak link. */
const MIN_PRODUCTION_SECRET_LENGTH = 32;

function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;

  if (process.env.NODE_ENV !== "production") {
    return configured || DEV_FALLBACK_SECRET;
  }

  if (!configured) {
    throw new Error(
      "JWT_SECRET must be set in production — refusing to start with the dev fallback secret. " +
        "Set it in the Render dashboard (see render.yaml).",
    );
  }

  // A deploy that copied the placeholder out of .env.example, or the old
  // committed fallback, is no better than having set nothing at all.
  if (configured === DEV_FALLBACK_SECRET || configured === "beere-kesava-secret-key-2026") {
    throw new Error(
      "JWT_SECRET is set to a known development value — refusing to start. Generate a real one, " +
        "e.g. `node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"`.",
    );
  }

  if (configured.length < MIN_PRODUCTION_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production ` +
        `(got ${configured.length}) — refusing to start.`,
    );
  }

  return configured;
}

export const JWT_SECRET = resolveJwtSecret();
