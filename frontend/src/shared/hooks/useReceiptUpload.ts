import { useState } from "react";
import { ApiError } from "../api/client";
import { uploadsApi } from "../api/uploads";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);

/**
 * Uploads a picked invoice/receipt file to POST /uploads/receipt and hands
 * back the stored server-relative path, or null if it failed. Same pattern
 * as useImageUpload, but for the wider image-or-PDF, 10MB receipt endpoint.
 */
export function useReceiptUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<string | null> {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("File must be a JPG, PNG, or PDF.");
      return null;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File must be under 10MB.");
      return null;
    }

    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadReceipt(file);
      return url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload file. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
