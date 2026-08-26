/**
 * The machine-readable error vocabulary — design-system/10-UI-STATES.md.
 *
 * The frontend decides which UI state to render from this code, never from
 * the human-readable `message`. That indirection is the whole point: copy
 * changes, translations and message rewording must never silently change
 * which screen the user sees. HTTP status alone is not enough either —
 * 401 covers both "you were never signed in" and "your session just
 * expired", which are different screens with different recovery actions.
 *
 * Codes are append-only. Never rename or repurpose one; the frontend's
 * copy map and its tests are keyed on these exact strings.
 */
export const ERROR_CODES = [
  "AUTH_REQUIRED",
  "AUTH_SESSION_EXPIRED",
  "AUTH_INVALID_CREDENTIALS",
  "FORBIDDEN_ROLE",
  "FORBIDDEN_SCOPE",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "CONFLICT",
  "RATE_LIMITED",
  "UPSTREAM_UNAVAILABLE",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Fallback mapping for the ~247 bare `NotFoundException` / `BadRequestException`
 * throws already in the services. They keep working untouched and get a
 * sensible code; the typed exceptions below are for new code and for
 * opportunistic migration where the default is too coarse.
 */
export function defaultCodeForStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
    case 422:
      return "VALIDATION_FAILED";
    case 401:
      return "AUTH_REQUIRED";
    case 403:
      return "FORBIDDEN_ROLE";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    case 502:
    case 503:
    case 504:
      return "UPSTREAM_UNAVAILABLE";
    default:
      return statusCode >= 500 ? "INTERNAL" : "VALIDATION_FAILED";
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}
