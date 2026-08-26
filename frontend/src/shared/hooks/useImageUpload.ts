import { useState } from "react";
import { ApiError } from "../api/client";
import { uploadsApi } from "../api/uploads";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * Uploads a picked image to POST /uploads/photo and hands back the stored
 * server-relative path ("/uploads/photos/<uuid>.jpg"), or null if it failed.
 *
 * Use this anywhere a form takes a photo. The alternative that several of
 * these screens used to reach for — FileReader.readAsDataURL — produces a
 * base64 string that either bloats a Postgres row by ~33% over the raw file
 * or, more often, gets silently dropped because no API field carries it.
 *
 * Validation mirrors the server's own limits (see backend upload.config.ts)
 * so the user gets an instant message instead of a round-trip 400.
 *
 * Rendering the preview is left to the caller: these dropzones each have
 * their own shape and styling. Prefer PhotoUploadField when the circular
 * avatar treatment is what you want.
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<string | null> {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Photo must be a JPG or PNG image.");
      return null;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Photo must be under 5MB.");
      return null;
    }

    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      return url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload photo. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
