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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

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
};
