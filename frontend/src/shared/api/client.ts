import { defaultCodeForStatus, isErrorCode, type ErrorCode } from "./errors";
import { notifyRequestSettled, notifyRequestStarted } from "./requestActivity";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Hard ceiling on a single request. Without one, a request to a backend that
 * accepted the connection and then stopped responding hangs forever and the
 * screen shows a skeleton with no end — indistinguishable from a hung app.
 * Generous, because report/export endpoints legitimately take a while.
 */
const REQUEST_TIMEOUT_MS = 30_000;

interface ApiSuccessBody<T> {
  success: true;
  statusCode: number;
  data: T;
}

interface ApiErrorBody {
  success: false;
  statusCode: number;
  code?: string;
  message: string | string[];
  fields?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    /**
     * Machine-readable state selector from the backend. Always populated —
     * falls back to the status default for any response predating the
     * backend's `code` field.
     */
    public readonly code: ErrorCode = defaultCodeForStatus(statusCode),
    /** Per-field validation messages, keyed by the DTO's dotted field path. */
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The request never reached the server. statusCode is 0 because there was no
 * HTTP response — checking `statusCode >= 500` must not treat this as a
 * server error, since the recovery is different (wait for connectivity vs.
 * retry now).
 */
export class NetworkError extends ApiError {
  constructor(code: Extract<ErrorCode, "NETWORK_OFFLINE" | "NETWORK_TIMEOUT">, message: string) {
    super(0, message, code);
    this.name = "NetworkError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error instanceof NetworkError ||
    (isApiError(error) && (error.code === "NETWORK_OFFLINE" || error.code === "NETWORK_TIMEOUT"))
  );
}

/** 401 — not signed in, or the session ended. */
export function isAuthError(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.code === "AUTH_REQUIRED" ||
      error.code === "AUTH_SESSION_EXPIRED" ||
      error.code === "AUTH_INVALID_CREDENTIALS")
  );
}

export function isSessionExpired(error: unknown): boolean {
  return isApiError(error) && error.code === "AUTH_SESSION_EXPIRED";
}

/** 403 — signed in, but not allowed. Renders AccessDeniedState, never /login. */
export function isForbidden(error: unknown): boolean {
  return isApiError(error) && (error.code === "FORBIDDEN_ROLE" || error.code === "FORBIDDEN_SCOPE");
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.code === "NOT_FOUND";
}

export function isValidationError(error: unknown): boolean {
  return isApiError(error) && error.code === "VALIDATION_FAILED";
}

export function isServerError(error: unknown): boolean {
  return isApiError(error) && error.statusCode >= 500;
}

/** Worth retrying automatically: transient by nature. A 4xx never is. */
export function isRetryable(error: unknown): boolean {
  return isNetworkError(error) || isServerError(error) || (isApiError(error) && error.code === "RATE_LIMITED");
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearSession() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("bk_auth_state");
    localStorage.removeItem("bk_original_admin_role");
    sessionStorage.removeItem("token");
  } catch {
    // ignore storage access failures
  }
}

/**
 * Called on a 401 response. Only wipes auth state and bounces to /login when
 * there is genuinely no token to speak of — a session that was never
 * established or has already been cleared elsewhere.
 *
 * Every role/scope failure in this API is a 403 (ForbiddenRoleError,
 * ForbiddenScopeError, requireWeaverId's ForbiddenException — see
 * permissions.guard.ts / weaver-scope.ts) — a 401 can only come from
 * JwtAuthGuard itself rejecting the token outright (jwt-auth.guard.ts). So
 * with a token present, AUTH_REQUIRED can't be "wrong role for this one
 * endpoint": it means the token itself is garbage (bad signature, malformed,
 * or the JWT_SECRET it was signed with no longer matches — e.g. a secret
 * rotation since this browser last logged in). Previously this case did
 * nothing, leaving every query silently failing and the page stuck showing
 * empty/zero state forever with no indication of why. Routed through the
 * same /session-expired screen as AUTH_SESSION_EXPIRED below — the token
 * being outright invalid isn't meaningfully different from it being expired
 * from the user's point of view, and that screen already explains what
 * happened and returns them where they were instead of looking like a
 * random logout.
 */
function handleUnauthorized(code: ErrorCode) {
  if (typeof window === "undefined") return;

  const hasToken = !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

  if (code === "AUTH_SESSION_EXPIRED" || (code === "AUTH_REQUIRED" && hasToken)) {
    clearSession();
    if (window.location.pathname !== "/session-expired") {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/session-expired?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return;
  }

  if (hasToken) return;
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function parseErrorBody(body: unknown, status: number): ApiError {
  const errBody = body as ApiErrorBody | null;
  const message = errBody?.message
    ? Array.isArray(errBody.message)
      ? errBody.message.join(", ")
      : errBody.message
    : `Request failed with status ${status}`;
  const code = isErrorCode(errBody?.code) ? errBody.code : defaultCodeForStatus(status);
  return new ApiError(status, message, code, errBody?.fields);
}

/**
 * Wraps fetch with a timeout and with the activity signal that drives the
 * "still working…" hint. Turns a thrown TypeError (the only thing fetch
 * gives us for a dead network) into a typed NetworkError, so callers never
 * have to guess whether an unknown error was a connectivity problem.
 */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const requestId = notifyRequestStarted();

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    if (controller.signal.aborted) {
      throw new NetworkError("NETWORK_TIMEOUT", "The server took too long to respond.");
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new NetworkError("NETWORK_OFFLINE", "You appear to be offline.");
    }
    throw new NetworkError("NETWORK_OFFLINE", "Could not reach the server.");
  } finally {
    clearTimeout(timeout);
    notifyRequestSettled(requestId);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = parseErrorBody(body, res.status);
    if (res.status === 401) {
      handleUnauthorized(error.code);
    }
    throw error;
  }

  return (body as ApiSuccessBody<T>).data;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  return handleResponse<T>(res);
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  return handleResponse<T>(res);
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
  patch: <T>(path: string, payload: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
};
