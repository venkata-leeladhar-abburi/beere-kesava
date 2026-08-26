import React, { useRef, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { uploadsApi, resolveAssetUrl } from "../api/uploads";
import { ApiError } from "../api/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);

/**
 * Dropzone for a dispatch LR receipt, backed by POST /uploads/receipt.
 * `receiptUrl` is the server-relative path already stored (or null); `onChange`
 * receives the new path once the upload succeeds, or null when cleared.
 *
 * Shared by DispatchShopModal (attach at dispatch time) and ResumeDispatchModal
 * (attach later, when completing skipped details) so the upload exists once.
 */
export function ReceiptUploadField({
  receiptUrl,
  onChange,
}: {
  receiptUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Receipt must be a JPG, PNG or PDF file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Receipt must be under 10MB.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setUploading(true);
    try {
      const { url } = await uploadsApi.uploadReceipt(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload receipt. Please try again.");
      setFileName(null);
      setFileSize(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setFileName(null);
    setFileSize(null);
    setError(null);
    onChange(null);
  }

  // Something is attached once the upload lands, or once a previously saved
  // receipt comes back on the record.
  const attached = Boolean(receiptUrl) || uploading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        aria-label="Upload LR receipt"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {!attached ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          style={{
            border: "2px dashed rgba(110,15,45,0.20)",
            borderRadius: 14,
            padding: "28px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: "#FDFBF7",
          }}
        >
          <Upload size={28} color="#69635E" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#3B2314", marginBottom: 4 }}>
            Click to upload LR receipt
          </div>
          <div style={{ fontSize: 12, color: "#69635E" }}>JPG, PNG or PDF — max 10 MB</div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid rgba(110,15,45,0.14)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "#FFF",
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: 8, background: "#FDFBF7",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(110,15,45,0.10)", flexShrink: 0,
            }}
          >
            {uploading ? (
              <Loader2 size={20} color="#6E0F2D" className="animate-spin" />
            ) : (
              <FileText size={20} color="#6E0F2D" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13, fontWeight: 600, color: "#4A061B",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {fileName ?? "Receipt attached"}
            </div>
            <div style={{ fontSize: 12, color: "#69635E" }}>
              {uploading
                ? "Uploading…"
                : fileSize != null
                  ? `${(fileSize / 1024 / 1024).toFixed(2)} MB`
                  : "Saved to this dispatch"}
            </div>
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={clear}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: "#C0392B", padding: "4px 8px",
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}

      {receiptUrl && !uploading && (
        <a
          href={resolveAssetUrl(receiptUrl) ?? undefined}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, fontWeight: 600, color: "#6E0F2D" }}
        >
          View uploaded receipt
        </a>
      )}

      {error && <div style={{ fontSize: 12, color: "#C0392B" }}>{error}</div>}
    </div>
  );
}
