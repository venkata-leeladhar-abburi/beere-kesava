import { apiClient } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Server-relative upload paths (e.g. "/uploads/photos/xxx.jpg") need the API
 * origin prefixed for <img src>. Absolute URLs pass through unchanged, as do
 * `data:` URIs — rows written before images moved to disk storage still hold
 * inline base64, and prefixing those would produce a broken src.
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
}

/**
 * Inverse of resolveAssetUrl: turns a displayable URL back into the
 * server-relative path we persist ("/uploads/photos/x.jpg"). Storing the
 * absolute form would bake this environment's API origin into the database
 * and break the moment the backend moves or the storage driver changes.
 * Third-party absolute URLs are left alone.
 */
export function toStoredAssetPath(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith(API_BASE_URL) ? url.slice(API_BASE_URL.length) : url;
}

export const uploadsApi = {
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return apiClient.postForm<{ url: string }>("/uploads/photo", formData);
  },
  /** Dispatch LR receipts — accepts PDF as well as images, up to 10MB. */
  uploadReceipt: (file: File) => {
    const formData = new FormData();
    formData.append("receipt", file);
    return apiClient.postForm<{ url: string }>("/uploads/receipt", formData);
  },
};
