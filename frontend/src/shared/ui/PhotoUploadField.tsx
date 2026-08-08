import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadsApi, resolveAssetUrl } from "../api/uploads";
import { ApiError } from "../api/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * Circular photo dropzone backed by POST /uploads/photo. `photoUrl` is the
 * server-relative path currently stored (or null); `onChange` receives the
 * new server-relative path once upload succeeds. Shared between Add Weaver
 * and the weaver-role fields in Add User so the upload flow only exists once.
 */
export function PhotoUploadField({
  photoUrl,
  onChange,
  labelText = "Photo",
  helpText = "Upload a clear photo for easy identification.",
}: {
  photoUrl: string | null;
  onChange: (url: string) => void;
  labelText?: string;
  helpText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? resolveAssetUrl(photoUrl);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Photo must be a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Photo must be under 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload photo. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label style={{ fontFamily: "inherit", fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>{labelText}</label>
      <div style={{ fontSize: 13, color: "#69635E", marginBottom: 14, marginTop: -4 }}>{helpText}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "2px dashed rgba(110,15,45,0.25)",
            background: displayUrl ? "transparent" : "rgba(110,15,45,0.04)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: uploading ? "wait" : "pointer", flexShrink: 0, overflow: "hidden", padding: 0,
          }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : uploading ? (
            <Loader2 size={26} color="rgba(110,15,45,0.5)" className="animate-spin" />
          ) : (
            <>
              <Camera size={28} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
              <span style={{ fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 8, fontWeight: 600 }}>Upload Photo</span>
            </>
          )}
        </button>
        <div style={{ fontSize: 13, color: "#69635E", lineHeight: 1.6 }}>
          JPG or PNG · Max 5MB
          {error && <div style={{ color: "#C0392B", marginTop: 4 }}>{error}</div>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
