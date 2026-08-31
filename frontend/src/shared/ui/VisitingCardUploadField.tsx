import { useRef, useState } from "react";
import { CreditCard, Loader2, X } from "lucide-react";
import { uploadsApi, resolveAssetUrl } from "../api/uploads";
import { ApiError } from "../api/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * Rectangular visiting-card dropzone backed by POST /uploads/photo — the
 * same upload endpoint PhotoUploadField uses, just a card-shaped preview
 * instead of a circular avatar. `cardUrl` is the server-relative path
 * currently stored (or null); `onChange` receives the new server-relative
 * path once upload succeeds, or `null` when the card is removed. Shared
 * between Vendor, Supplier, and Wholesale Customer forms so the upload flow
 * only exists once.
 */
export function VisitingCardUploadField({
  cardUrl,
  onChange,
  labelText = "Visiting Card Photo",
  helpText = "Upload a photo of the business card.",
}: {
  cardUrl: string | null;
  onChange: (url: string | null) => void;
  labelText?: string;
  helpText?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? resolveAssetUrl(cardUrl);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Visiting card must be a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Visiting card must be under 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadPhoto(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload the visiting card. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{labelText}</label>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%", height: 120, borderRadius: 10,
            border: `1.5px dashed rgba(110,15,45,0.25)`,
            background: displayUrl ? "transparent" : "rgba(110,15,45,0.04)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: uploading ? "wait" : "pointer", overflow: "hidden", padding: 0,
          }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Visiting card preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : uploading ? (
            <Loader2 size={22} color="rgba(110,15,45,0.5)" className="animate-spin" />
          ) : (
            <>
              <CreditCard size={22} color="rgba(110,15,45,0.35)" strokeWidth={1.5} />
              <span style={{ fontSize: 12, color: "rgba(110,15,45,0.45)", marginTop: 6, fontWeight: 600 }}>Upload Visiting Card</span>
            </>
          )}
        </button>
        {displayUrl && !uploading && (
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            aria-label="Remove visiting card"
            title="Remove"
            style={{
              position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "none", color: "#FFF",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#69635E", marginTop: 6, lineHeight: 1.5 }}>
        {helpText} JPG or PNG · Max 5MB
        {error && <div style={{ color: "#C0392B", marginTop: 4 }}>{error}</div>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        aria-label={labelText || "Upload visiting card"}
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
