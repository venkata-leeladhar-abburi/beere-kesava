import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { X, AlertCircle, ScanLine } from "lucide-react";
import { Button } from "./primitives";

// The default camera picked by decodeFromVideoDevice(undefined, ...) often
// negotiates a low resolution (sometimes 640×480), which isn't enough to
// resolve a printed Code128's thin bars up close — the camera opens and the
// live view looks fine, but nothing ever decodes. Asking for a real
// resolution and the rear camera with continuous autofocus fixes that; every
// constraint here is a hint the browser is free to ignore on hardware that
// can't meet it, so this degrades safely on a weaker device.
const SCAN_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    // Not in the standard MediaTrackConstraints type, but Chrome/Android
    // honor it when present — continuous autofocus matters more than
    // resolution for a barcode held a few inches from the lens.
    advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
  },
};

const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]],
]);

/**
 * A saree tag carries two codes: a Code128 barcode (decodes to the bare
 * saree id) and a QR code (decodes to a full "<FRONTEND_URL>/scan?id=<id>"
 * link, so a generic phone camera can open it directly — see
 * labels.service.ts). Every consumer of this scanner expects a bare id, so
 * unwrap the QR's URL form here, once, instead of in each caller.
 */
function extractScannedId(text: string): string {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {
    // Not a URL — a Code128 scan (or manual typing) already is the bare id.
  }
  return trimmed;
}

/**
 * Shared live-camera barcode/QR scanner. Decodes whatever's on a saree tag
 * (Code128, QR, EAN, UPC — ZXing's MultiFormat reader picks up all of them)
 * straight off the device camera feed. Used behind every "Open Camera"
 * affordance in the app — shop-staff flows, GRN receiving, and the main
 * inventory dispatch/quotation pickers.
 */
export function CameraScannerModal({
  open,
  onClose,
  onDetected,
  title = "Scan Barcode",
  hint = "Hold the tag steady inside the frame — it'll be picked up automatically.",
  accentColor = "#6E0F2D",
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (text: string) => void;
  title?: string;
  hint?: string;
  accentColor?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);

    const reader = new BrowserMultiFormatReader(SCAN_HINTS);
    reader
      .decodeFromConstraints(SCAN_CONSTRAINTS, videoRef.current ?? undefined, (result, _err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        if (result) {
          controls.stop();
          onDetected(extractScannedId(result.getText()));
        }
        // NotFoundException fires continuously between frames with no
        // barcode in view — that's the normal steady state, not a failure.
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera access was denied — allow camera permission and try again."
            : "Couldn't access the camera on this device.",
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(20,10,8,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="w-full max-w-[460px]" style={{ background: "#0F0906", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScanLine size={18} color="#FFDFA0" />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: "#FFFDF9" }}>{title}</span>
          </div>
          <Button variant="tertiary" size="sm" onClick={onClose} aria-label="Close camera"
            className="h-8 w-8 rounded-full border-0 bg-[rgba(255,255,255,0.10)] p-0 text-white hover:bg-[rgba(255,255,255,0.18)]">
            <X size={16} />
          </Button>
        </div>

        <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#000" }}>
          <video ref={videoRef} aria-label="Live camera feed for barcode scanning" style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
          {!error && (
            <div aria-hidden style={{ position: "absolute", inset: "18% 12%", border: `2px solid ${accentColor}`, borderRadius: 12, boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }} />
          )}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center" }}>
              <AlertCircle size={28} color="#E8A0A0" />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#F0DEDE" }}>{error}</span>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 18px 16px" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,253,249,0.6)" }}>
            {hint}
          </span>
        </div>
      </div>
    </div>
  );
}
