/**
 * Shrinks a phone photo before upload. A modern phone camera writes 3–8MB
 * JPEGs, over POST /uploads/photo's 5MB cap, and a 4000px image is far more
 * than an inventory thumbnail or zoom view ever shows.
 *
 * Re-encodes to JPEG with the longest edge capped at `maxEdge`. Browsers apply
 * the EXIF orientation when decoding into an <img>, so the result is upright.
 * Anything the browser cannot decode (HEIC on Chrome/Windows, say) comes back
 * untouched — the server accepts it as-is, subject to its own size limit.
 */
export async function downscaleImage(file: File, maxEdge = 1920, quality = 0.85): Promise<File> {
  // Small enough already, and already a JPEG — re-encoding would only lose quality.
  if (file.type === "image/jpeg" && file.size <= 1.5 * 1024 * 1024) return file;
  // GIFs may be animated; canvas would keep only the first frame.
  if (file.type === "image/gif") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (!longest) return file;
    const scale = Math.min(1, maxEdge / longest);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG has no alpha — paint white first so a transparent PNG isn't black.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
