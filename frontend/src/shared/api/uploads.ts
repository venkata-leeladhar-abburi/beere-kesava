import { apiClient } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Server-relative upload paths (e.g. "/uploads/photos/xxx.jpg") need the API origin prefixed for <img src>. Absolute URLs pass through unchanged. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
}

export const uploadsApi = {
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return apiClient.postForm<{ url: string }>("/uploads/photo", formData);
  },
};
