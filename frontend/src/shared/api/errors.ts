/**
 * The frontend half of the error contract — mirrors
 * backend/src/common/errors/error-codes.ts, and must stay in sync with it.
 *
 * Every UI state decision in the app is made from `ErrorCode`, never from a
 * message string. See design-system/10-UI-STATES.md.
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
  /**
   * Client-side only — the request never reached the server, so the backend
   * could not have produced a code. Covers offline, DNS failure, CORS
   * rejection, and our own timeout.
   */
  "NETWORK_OFFLINE",
  "NETWORK_TIMEOUT",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

/** Mirror of backend defaultCodeForStatus, for responses predating the code field. */
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
