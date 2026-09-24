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

// Matches the visual guide box below (`inset: "18% 12%"`). The box is drawn
// over the *visible* part of the video, and the video is shown with
// object-fit: cover inside a 4:3 frame — so a 16:9 desktop feed has its sides
// cut off and a portrait phone feed (1080×1920) has most of its top and bottom
// cut off. The crop has to be computed against that visible region, not the
// raw frame, or the decoder looks somewhere other than where the user was told
// to hold the tag (on a portrait phone, mostly at the floor above and below it).
const ROI_INSET = { x: 0.12, y: 0.18 };
const VIEW_ASPECT = 4 / 3;
// The canvas handed to ZXing is scaled so its long side is about this many
// pixels. Upscaling a 1920-wide crop 2x produced a ~3000px canvas that took a
// phone longer to decode than the interval between attempts, so the page
// froze and effectively never finished a frame; small crops are still
// upscaled to this size so thin bars get enough samples.
const DECODE_LONG_SIDE = 1280;
// Pause between decode attempts. A setTimeout chain rather than setInterval,
// so a slow decode can never stack attempts on top of each other.
const DECODE_INTERVAL_MS = 120;

const NATIVE_FORMATS = ["code_128", "qr_code"];
type NativeDetector = { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type NativeDetectorCtor = {
  new (opts: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

/**
 * The browser's own BarcodeDetector (Chrome on Android and macOS) is far more
 * tolerant of blur, glare, tilt and small codes than ZXing's JS port, so it is
 * used whenever it exists and supports our formats; ZXing is the fallback.
 */
async function createNativeDetector(): Promise<NativeDetector | null> {
  const Ctor = (globalThis as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const supported = (await Ctor.getSupportedFormats?.()) ?? NATIVE_FORMATS;
    const formats = NATIVE_FORMATS.filter(f => supported.includes(f));
    if (formats.length === 0) return null;
    return new Ctor({ formats });
  } catch {
    return null;
  }
}

/** The part of the raw video frame actually visible in the 4:3 cover box. */
function visibleRegion(vw: number, vh: number) {
  if (vw / vh > VIEW_ASPECT) {
    const w = vh * VIEW_ASPECT;
    return { x: (vw - w) / 2, y: 0, w, h: vh };
  }
  const h = vw / VIEW_ASPECT;
  return { x: 0, y: (vh - h) / 2, w: vw, h };
}

/**
 * How long to keep trying before admitting the tag may be unreadable.
 *
 * Tags printed before the label fix (see SareeTagPrint.tsx) squeezed their
 * Code128 into ~31mm of a 50mm sticker, which a 203dpi thermal head prints at
 * roughly 1.3 dots per module — the bar ratios are destroyed on the paper
 * itself, and no amount of camera resolution, upscaling or binarizing gets
 * them back. Those stickers will never decode, and until this timeout existed
 * the scanner simply sat there looking like it was still working while a
 * staff member held a saree up to it at the counter. Eight seconds is long
 * enough that a readable tag has decoded many times over, short enough not to
 * strand anyone.
 */
const UNREADABLE_AFTER_MS = 8_000;

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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Held in a ref so a caller passing an inline arrow doesn't restart the
  // camera on every one of its re-renders (the effect used to depend on it).
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [unreadable, setUnreadable] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setUnreadable(false);
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const reader = new BrowserMultiFormatReader(SCAN_HINTS);

    const stopStream = () => {
      if (timerRef.current != null) { clearTimeout(timerRef.current); timerRef.current = null; }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };

    // Draws a region of the frame into the canvas at decode size.
    const draw = (video: HTMLVideoElement, r: { x: number; y: number; w: number; h: number }) => {
      if (!ctx) return false;
      const scale = DECODE_LONG_SIDE / Math.max(r.w, r.h);
      canvas.width = Math.round(r.w * scale);
      canvas.height = Math.round(r.h * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(video, r.x, r.y, r.w, r.h, 0, 0, canvas.width, canvas.height);
      return true;
    };

    const startDecodeLoop = async (video: HTMLVideoElement) => {
      const startedAt = Date.now();
      const native = await createNativeDetector();
      let attempt = 0;

      const tick = async () => {
        if (cancelled) return;
        let text: string | null = null;
        if (video.videoWidth > 0 && video.readyState >= 2) {
          const vis = visibleRegion(video.videoWidth, video.videoHeight);
          const roi = {
            x: vis.x + vis.w * ROI_INSET.x,
            y: vis.y + vis.h * ROI_INSET.y,
            w: vis.w * (1 - ROI_INSET.x * 2),
            h: vis.h * (1 - ROI_INSET.y * 2),
          };
          // Mostly the guide box, but every third attempt the whole visible
          // view — a tag held a little outside the box should still read.
          const region = attempt++ % 3 === 2 ? vis : roi;
          try {
            if (native) {
              const found = await native.detect(draw(video, region) ? canvas : video);
              if (found.length > 0) text = found[0].rawValue;
            } else if (draw(video, region)) {
              text = reader.decodeFromCanvas(canvas).getText();
            }
          } catch {
            // NotFoundException on every frame without a code is the normal
            // steady state; any other decode error is also just "next frame".
          }
        }
        if (cancelled) return;
        if (text) {
          stopStream();
          onDetectedRef.current(extractScannedId(text));
          return;
        }
        // The camera keeps running: a tag that isn't in frame yet and one
        // that won't decode look identical from here, so this only adds a hint.
        if (Date.now() - startedAt > UNREADABLE_AFTER_MS) setUnreadable(true);
        timerRef.current = setTimeout(() => { void tick(); }, DECODE_INTERVAL_MS);
      };
      void tick();
    };

    const openCamera = (constraints: MediaStreamConstraints) =>
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().catch(() => {});
        video.onloadedmetadata = () => { if (!cancelled) void startDecodeLoop(video); };
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
  }, [open]);

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

        <div style={{ padding: "12px 18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,253,249,0.6)" }}>
            {hint}
          </span>
          {/* Nothing has decoded for a while. The camera keeps running — this
              only points at the way out, because the most likely cause is a
              tag printed before the label fix, which will never decode however
              long it is held up. The id is printed in plain text under the
              bars on every tag, so typing it always works. */}
          {unreadable && !error && (
            <span
              role="status"
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.45,
                color: "#FFDFA0",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Still can&apos;t read this tag. Hold it flat, in good light, about a hand&apos;s
                width from the camera so the bars fill the box. If it still won&apos;t read,
                close the camera and type the ID printed under the barcode.
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
