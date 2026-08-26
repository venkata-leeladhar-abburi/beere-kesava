/**
 * The single ErrorCode → user-facing copy map. No screen writes its own
 * error string for a backend/network failure — every one of them routes
 * through this file, via ErrorState or the toast helper below.
 * design-system/10-UI-STATES.md.
 */
import type { ErrorCode } from "../../api/errors";
import { isApiError } from "../../api/client";

export interface ErrorCopy {
  title: string;
  description: string;
  /** Retrying the same request again is worth offering. */
  retryable: boolean;
}

const COPY: Record<ErrorCode, ErrorCopy> = {
  AUTH_REQUIRED: {
    title: "Please sign in",
    description: "You need to be signed in to see this.",
    retryable: false,
  },
  AUTH_SESSION_EXPIRED: {
    title: "Your session has expired",
    description: "Sign in again to pick up where you left off.",
    retryable: false,
  },
  AUTH_INVALID_CREDENTIALS: {
    title: "That didn't work",
    description: "Check your details and try again.",
    retryable: false,
  },
  FORBIDDEN_ROLE: {
    title: "You don't have access to this",
    description: "This part of the app isn't available for your role.",
    retryable: false,
  },
  FORBIDDEN_SCOPE: {
    title: "This isn't yours to view",
    description: "This record belongs to a different account.",
    retryable: false,
  },
  NOT_FOUND: {
    title: "We couldn't find that",
    description: "It may have been moved or deleted.",
    retryable: false,
  },
  VALIDATION_FAILED: {
    title: "Some details need fixing",
    description: "Check the highlighted fields and try again.",
    retryable: false,
  },
  CONFLICT: {
    title: "That's out of date",
    description: "Someone else may have changed this. Refresh and try again.",
    retryable: true,
  },
  RATE_LIMITED: {
    title: "Slow down a moment",
    description: "Too many requests in a row — try again shortly.",
    retryable: true,
  },
  UPSTREAM_UNAVAILABLE: {
    title: "The server is having trouble",
    description: "This isn't your connection — try again in a moment.",
    retryable: true,
  },
  INTERNAL: {
    title: "Something went wrong on our end",
    description: "We've logged it. Try again in a moment.",
    retryable: true,
  },
  NETWORK_OFFLINE: {
    title: "Couldn't reach the server",
    description: "Check your connection and try again.",
    retryable: true,
  },
  NETWORK_TIMEOUT: {
    title: "That took too long",
    description: "The request timed out. Try again.",
    retryable: true,
  },
};

const FALLBACK: ErrorCopy = {
  title: "Something went wrong",
  description: "Please try again.",
  retryable: true,
};

export function copyForError(error: unknown): ErrorCopy {
  if (isApiError(error)) return COPY[error.code] ?? FALLBACK;
  return FALLBACK;
}

/** Short single-line form for toasts (mutations only — see 10-UI-STATES.md). */
export function toastMessageForError(error: unknown): string {
  if (isApiError(error) && error.message) return error.message;
  return copyForError(error).title;
}
