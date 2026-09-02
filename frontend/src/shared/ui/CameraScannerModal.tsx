import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { X, AlertCircle, ScanLine } from "lucide-react";
import { Button } from "./primitives";

// The default camera picked by getUserMedia(undefined constraints) often
// negotiates a low resolution (sometimes 640×480), which isn't enough to
// resolve a printed Code128's thin bars up close — the camera opens and the
// live view looks fine, but nothing ever decodes. Asking for a real
// resolution fixes that. `ideal` (not `exact`) on every field here so a
// camera that can't meet it just gets its closest match instead of the
// whole request failing — an `advanced: [{ focusMode: "continuous" }]` block
// was tried here too, but that constraint isn't reliably supported (plenty
// of desktop webcams reject it outright), and an unsupported `advanced`
// entry can fail the ENTIRE getUserMedia call on some browsers — worse than
// no focus hint at all, since it broke the camera rather than just not
// improving it. Left out for that reason.
const SCAN_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]],
]);

// Matches the visual guide box below (`inset: "18% 12%"`) — decoding is
// cropped to this same region of the frame, not the whole video image.
// Handing ZXing the *entire* 1920×1080 frame when the tag only fills a
// small box in the middle wastes almost all of that resolution on
// background the reader has to search past; a barcode that reads as "big
// and clear" to a human eye can still be too few effective pixels wide once
// diluted across the full frame. Cropping to the box the user was told to
// fill, then upscaling that crop, puts the resolution where the code
// actually is.
const ROI_INSET = { x: 0.12, y: 0.18 };
// The crop is scanned at 2x its native pixel size — more samples per bar
// for the decoder without needing an even higher camera resolution.
const ROI_UPSCALE = 2;
// One decode attempt roughly every 150ms — decoding a frame isn't free, and
// the camera feed doesn't change fast enough to need every animation frame.
const DECODE_INTERVAL_MS = 150;

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
 *
 * Runs its own crop-and-decode loop (see ROI_INSET above) instead of
 * @zxing/browser's decodeFromConstraints/decodeFromVideoDevice, which hand
 * the whole raw frame to the decoder — fine for a barcode that fills the
 * frame, unreliable for one that's a small part of a larger scene (the
 * printed tag's border and text around it, not just the bars).
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
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const reader = new BrowserMultiFormatReader(SCAN_HINTS);

    const stopStream = () => {
      if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };

    const startDecodeLoop = (video: HTMLVideoElement) => {
      intervalRef.current = setInterval(() => {
        if (cancelled || !ctx || video.videoWidth === 0) return;
        const sx = video.videoWidth * ROI_INSET.x;
        const sy = video.videoHeight * ROI_INSET.y;
        const sw = video.videoWidth * (1 - ROI_INSET.x * 2);
        const sh = video.videoHeight * (1 - ROI_INSET.y * 2);
        canvas.width = sw * ROI_UPSCALE;
        canvas.height = sh * ROI_UPSCALE;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        try {
          const result = reader.decodeFromCanvas(canvas);
          if (cancelled) return;
          stopStream();
          onDetected(extractScannedId(result.getText()));
        } catch {
          // NotFoundException fires on every frame with no barcode in the
          // cropped box — the normal steady state. Any other decode error
          // (a partial/blurred read, etc.) is likewise just "try again next
          // frame", so nothing here distinguishes them.
        }
      }, DECODE_INTERVAL_MS);
    };

    const openCamera = (constraints: MediaStreamConstraints) =>
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().catch(() => {});
        video.onloadedmetadata = () => { if (!cancelled) startDecodeLoop(video); };
      });

    openCamera(SCAN_CONSTRAINTS).catch((e: unknown) => {
      if (cancelled) return;
      if (e instanceof Error && e.name === "NotAllowedError") {
        setError("Camera access was denied — allow camera permission and try again.");
        return;
      }
      // The 1920×1080/rear-camera request itself can fail on hardware that
      // doesn't like it (some desktop webcams reject specific resolutions
      // outright) even though `ideal` should degrade gracefully — fall
      // back to whatever default camera the browser is willing to give us
      // rather than leaving the scanner dead.
      openCamera({ video: true }).catch((fallbackErr: unknown) => {
        if (cancelled) return;
        setError(
          fallbackErr instanceof Error && fallbackErr.name === "NotAllowedError"
            ? "Camera access was denied — allow camera permission and try again."
            : "Couldn't access the camera on this device.",
        );
      });
    });

    return () => {
      cancelled = true;
      stopStream();
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
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: `${ROI_INSET.y * 100}% ${ROI_INSET.x * 100}%`,
                border: `2px solid ${accentColor}`,
                borderRadius: 12,
                boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)",
              }}
            />
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
