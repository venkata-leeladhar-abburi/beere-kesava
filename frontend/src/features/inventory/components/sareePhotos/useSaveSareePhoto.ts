import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/client";
import { uploadsApi } from "@/shared/api/uploads";
import { sareePhotosApi, type SareePhotoRecord } from "@/shared/api/saree-photos";
import { downscaleImage } from "@/shared/lib/downscaleImage";
import { IMAGE_REJECTION_MESSAGE, isAcceptedImageFile } from "@/shared/lib/imageTypes";

/** POST /uploads/photo's own cap (backend upload.config.ts). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Every query whose rows carry a saree photo — refetched once one changes. */
const PHOTO_BEARING_QUERIES = [["batches"], ["purchases"], ["inventory"], ["suppliers"]] as const;

/**
 * Shrinks, uploads and attaches a photo to one saree. The photo lands in the
 * same field every inventory screen reads (see backend SareePhotosService), so
 * the cached lists are invalidated here rather than by each caller.
 */
export function useSaveSareePhoto() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(sareeId: string, file: File): Promise<SareePhotoRecord | null> {
    setError(null);
    if (!isAcceptedImageFile(file)) {
      setError(IMAGE_REJECTION_MESSAGE);
      return null;
    }
    setSaving(true);
    try {
      const shrunk = await downscaleImage(file);
      if (shrunk.size > MAX_UPLOAD_BYTES) {
        setError(
          "This photo is over 5MB and couldn't be shrunk. Take it again, or pick a smaller one."
        );
        return null;
      }
      const { url } = await uploadsApi.uploadPhoto(shrunk);
      const updated = await sareePhotosApi.setPhoto(sareeId, url);
      queryClient.setQueryData(["saree-photo", updated.sareeId], updated);
      for (const queryKey of PHOTO_BEARING_QUERIES)
        void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      return updated;
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not save the photo. Please try again."
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { save, saving, error, clearError: () => setError(null) };
}
