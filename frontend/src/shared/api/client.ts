const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ApiSuccessBody<T> {
  success: true;
  statusCode: number;
  data: T;
}

interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string | string[];
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Called on any 401 response. Clears whatever auth state exists in storage
 * and bounces to /login so a stale/missing token doesn't leave the user
 * staring at a page full of failed requests. Kept dependency-free (no
 * useAuth import) since this module is used outside React component trees.
 */
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("bk_auth_state");
    localStorage.removeItem("bk_original_admin_role");
    sessionStorage.removeItem("token");
  } catch {
    // ignore storage access failures
  }
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    handleUnauthorized();
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    const message = errBody?.message
      ? Array.isArray(errBody.message)
        ? errBody.message.join(", ")
        : errBody.message
      : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return (body as ApiSuccessBody<T>).data;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    const message = errBody?.message
      ? Array.isArray(errBody.message)
        ? errBody.message.join(", ")
        : errBody.message
      : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return (body as ApiSuccessBody<T>).data;
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
