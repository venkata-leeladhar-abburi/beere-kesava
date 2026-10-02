import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { X, AlertCircle, ScanLine, Flashlight, FlashlightOff, SwitchCamera } from "lucide-react";
import { Button } from "./primitives";
import { canvasSize, extractScannedId, scanRegion, shouldMirror } from "./cameraScan";
import { FrameScanner } from "./scanFrame";

// The default camera picked by getUserMedia(undefined constraints) often
// negotiates a low resolution (sometimes 640×480), which isn't enough to
// resolve a printed Code128's thin bars from a casual distance. `ideal` (not
// `exact`) on every field so a camera that can't meet it just gets its
// closest match instead of the whole request failing. Focus/exposure hints
// are NOT put here: an unsupported `advanced` entry can fail the ENTIRE
// getUserMedia call on some browsers. They're applied after the stream is
// open instead, only when the track says it supports them (see tuneTrack).
//
// Desktops ask for up to 4K: a laptop/USB webcam is the weakest camera the
// scanner meets, and every extra pixel across a tag's thin bars is reading
// distance. A camera that tops out lower just delivers its best. Phones stay
// at 1080p — their lenses already resolve the bars, and a 4K stream only
// costs them heat and decode time.
const RESOLUTION_DESKTOP = { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 30 } } as const;
const RESOLUTION_PHONE = { width: { ideal: 1920 }, height: { ideal: 1080 } } as const;

function isDesktopPointer(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;
}

const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE]],
]);
// The straightened (rotated) passes exist only for the Code128 — a QR reads
// at any angle on the upright passes — so they skip ZXing's QR search, which
// is the expensive half of a decode on a large canvas.
const BAR_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]],
]);

// Pause between decode attempts. A setTimeout chain rather than setInterval,
// so a slow decode can never stack attempts on top of each other.
const NATIVE_INTERVAL_MS = 60;
const ZXING_INTERVAL_MS = 30;

/** Remembers the camera that last worked (e.g. the rear lens that can focus close). */
const CAMERA_STORAGE_KEY = "bk.scanner.cameraId";

const NATIVE_FORMATS = ["code_128", "qr_code"];
type NativeDetector = { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type NativeDetectorCtor = {
  new (opts: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

/**
 * The browser's own BarcodeDetector (Chrome on Android and macOS) is far more
 * tolerant of blur, glare, tilt and small codes than ZXing's JS port, so it is
 * used whenever it exists and supports our formats; ZXing is the fallback
 * (iPhone Safari, Firefox, Chrome on Windows).
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

function readStoredCamera(): string | null {
  try { return window.localStorage.getItem(CAMERA_STORAGE_KEY); } catch { return null; }
}
function writeStoredCamera(id: string | null) {
  try {
    if (id) window.localStorage.setItem(CAMERA_STORAGE_KEY, id);
    else window.localStorage.removeItem(CAMERA_STORAGE_KEY);
  } catch {
    // Private mode / blocked storage — the scanner just won't remember the lens.
  }
}

type TrackCaps = MediaTrackCapabilities & { focusMode?: string[]; exposureMode?: string[]; whiteBalanceMode?: string[]; torch?: boolean };

/**
 * Turns on continuous autofocus / exposure where the camera supports it — a
 * tag waved casually in front of a phone is mostly out of focus otherwise.
 * Each hint is its own advanced set, so one the camera can't honour is
 * skipped without affecting the others, and any rejection is swallowed: this
 * can only improve the picture, never break the stream. Returns whether the
 * track has a torch.
 */
function tuneTrack(track: MediaStreamTrack): boolean {
  let caps: TrackCaps = {};
  try { caps = (track.getCapabilities?.() ?? {}) as TrackCaps; } catch { /* not supported */ }
  const advanced: Record<string, string>[] = [];
  if (caps.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
  if (caps.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
  if (caps.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });
  if (advanced.length > 0) {
    track.applyConstraints({ advanced } as MediaTrackConstraints).catch(() => {});
  }
  return caps.torch === true;
}

/** A short beep and buzz on a successful read — what a counter scanner does. */
function successFeedback() {
  try { navigator.vibrate?.(80); } catch { /* unsupported */ }
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const audio = new AudioCtx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.13);
    osc.onended = () => { void audio.close().catch(() => {}); };
  } catch {
    // Audio blocked or unavailable — the vibration (or nothing) is fine.
  }
}

/**
 * How long to keep trying before suggesting what to do differently.
 *
 * Tags printed before the label fix (see SareeTagPrint.tsx) squeezed their
 * Code128 into ~31mm of a 50mm sticker — those bars are destroyed on the
 * paper itself and will never decode. The camera keeps running; this only
 * points at the way out (light, distance, or typing the printed id).
 */
const UNREADABLE_AFTER_MS = 10_000;

const SCANNER_CSS = `
@keyframes bk-scanner-sweep { 0% { top: 6%; } 50% { top: 92%; } 100% { top: 6%; } }
@keyframes bk-scanner-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.bk-scanner-line { animation: bk-scanner-sweep 2.4s ease-in-out infinite; }
.bk-scanner-dot { animation: bk-scanner-pulse 1.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .bk-scanner-line { animation: none; top: 50%; }
  .bk-scanner-dot { animation: none; }
}`;

/**
 * Shared live-camera barcode/QR scanner, behind every scan affordance in the
 * app — shop-staff flows, finishing, GRN batches, supplier returns, saree
 * photos, and the inventory dispatch/quotation pickers.
 *
 * Built so a tag can be shown casually rather than lined up carefully:
 *  - Full-screen on phones and a large window on desktop, with the whole
 *    camera view shown.
 *  - Decode attempts read the ENTIRE frame — the guide box is a hint, not a
 *    requirement — interleaved with a zoomed centre crop for a distant tag
 *    and the frame straightened in 10° steps to ±45° for a tilted barcode.
 *    See scanRegion in cameraScan.ts.
 *  - Each attempt also locates the barcode itself and reads a straightened,
 *    full-resolution crop of it with a blur-tolerant Code128 decoder (see
 *    scanFrame.ts) — the part that makes a desktop webcam usable at a
 *    normal distance.
 *  - Continuous autofocus/exposure when the camera supports it, a torch
 *    toggle for dim counters, and a camera switch for phones whose default
 *    rear lens can't focus close (remembered for next time).
 *
 * Runs its own decode loop rather than @zxing/browser's decodeFromVideoDevice,
 * which hands one fixed view of each frame to the decoder and never retries it
 * cropped or rotated.
 */
export function CameraScannerModal({
  open,
  onClose,
  onDetected,
  title = "Scan Barcode",
  hint = "Show the tag's barcode anywhere in the camera view — no need to line it up.",
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
  const activeDeviceRef = useRef<string | null>(null);
  // Held in a ref so a caller passing an inline arrow doesn't restart the
  // camera on every one of its re-renders.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [unreadable, setUnreadable] = useState(false);
  const [detected, setDetected] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  // null = let the browser pick the rear camera. Bumping `restartKey`
  // reopens the stream on the newly chosen device.
  const [deviceId, setDeviceId] = useState<string | null>(() => readStoredCamera());
  const [restartKey, setRestartKey] = useState(0);

  // Lock the page behind the scanner from scrolling while it's open (phones
  // otherwise scroll the page under a full-screen overlay on a stray swipe).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);
    setUnreadable(false);
    setDetected(false);
    setTorchOn(false);
    setTorchSupported(false);
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const reader = new BrowserMultiFormatReader(SCAN_HINTS);
    const barReader = new BrowserMultiFormatReader(BAR_HINTS);
    const frameScanner = new FrameScanner();
    const desktop = isDesktopPointer();
    // The <video> is always rendered while open, so it exists by the time
    // this effect runs; captured once so the cleanup detaches the same node.
    const videoEl = videoRef.current;

    const stopStream = () => {
      if (timerRef.current != null) { clearTimeout(timerRef.current); timerRef.current = null; }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };

    // Draws one region of the current frame into the decode canvas,
    // rotated about its centre when the region asks for it.
    const draw = (video: HTMLVideoElement, region: ReturnType<typeof scanRegion>) => {
      if (!ctx) return false;
      const { width, height, scale } = canvasSize(region);
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      // White behind a rotated frame's corners — a quiet zone, not fake bars.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      if (region.rotate !== 0) ctx.rotate((region.rotate * Math.PI) / 180);
      const dw = region.w * scale;
      const dh = region.h * scale;
      ctx.drawImage(video, region.x, region.y, region.w, region.h, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      return true;
    };

    const startDecodeLoop = async (video: HTMLVideoElement) => {
      const startedAt = Date.now();
      const native = await createNativeDetector();
      if (cancelled) return;
      let attempt = 0;

      // "Find the barcode, then read it close up": locate the stripes in the
      // frame, straighten and crop them at full camera resolution, and read
      // that with the blur-tolerant profile decoder, then with the regular
      // decoder on an enlarged copy. This is what lets a webcam read a tag
      // held at a normal distance, where the bars are only 2–3 camera pixels
      // wide and every whole-frame decode misses them.
      const readLocated = async (): Promise<string | null> => {
        let candidates;
        try { candidates = frameScanner.locate(video); } catch { return null; }
        for (const found of candidates) {
          if (cancelled) return null;
          try {
            const c = frameScanner.refine(video, found);
            const viaProfile = frameScanner.readProfile(video, c);
            if (viaProfile) return viaProfile;
            const big = frameScanner.enlarged(video, c);
            if (!big) continue;
            if (native) {
              const hit = (await native.detect(big)).find(f => f.rawValue && f.rawValue.trim());
              if (hit) return hit.rawValue;
            } else {
              try { return barReader.decodeFromCanvas(big).getText(); } catch { /* not this one */ }
            }
          } catch {
            // A failed read of one candidate is just "try the next".
          }
        }
        return null;
      };

      const tick = async () => {
        if (cancelled) return;
        let text: string | null = null;
        if (video.videoWidth > 0 && video.readyState >= 2) {
          const region = scanRegion(attempt++, video.videoWidth, video.videoHeight);
          const isFullFrame = region.x === 0 && region.y === 0 && region.rotate === 0;
          try {
            if (native) {
              // The video element itself is the full-resolution frame — no
              // canvas copy needed for the whole-frame attempts.
              const source = isFullFrame ? video : (draw(video, region) ? canvas : video);
              const found = await native.detect(source);
              const hit = found.find(f => f.rawValue && f.rawValue.trim());
              if (hit) text = hit.rawValue;
            } else if (draw(video, region)) {
              text = (region.rotate === 0 ? reader : barReader).decodeFromCanvas(canvas).getText();
            }
          } catch {
            // NotFoundException on every frame without a code is the normal
            // steady state; any other decode error is also just "next frame".
          }
          // Phones resolve tags fine without it, so there it runs on every
          // other attempt to keep the loop quick; desktops run it every time.
          if (!text && !cancelled && (desktop || attempt % 2 === 0)) text = await readLocated();
        }
        if (cancelled) return;
        if (text && text.trim()) {
          stopStream();
          setDetected(true);
          successFeedback();
          onDetectedRef.current(extractScannedId(text));
          return;
        }
        if (Date.now() - startedAt > UNREADABLE_AFTER_MS) setUnreadable(true);
        timerRef.current = setTimeout(() => { void tick(); }, native ? NATIVE_INTERVAL_MS : ZXING_INTERVAL_MS);
      };
      void tick();
    };

    const attachStream = (stream: MediaStream) => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      let settings: MediaTrackSettings = {};
      try { settings = track?.getSettings?.() ?? {}; } catch { /* not supported */ }
      activeDeviceRef.current = settings.deviceId ?? null;
      const finePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;
      setMirrored(shouldMirror(settings.facingMode, finePointer));
      if (track) setTorchSupported(tuneTrack(track));

      // Device labels (and so a meaningful list) are only available once
      // permission is granted — i.e. now.
      navigator.mediaDevices.enumerateDevices?.()
        .then(list => { if (!cancelled) setCameras(list.filter(d => d.kind === "videoinput" && d.deviceId)); })
        .catch(() => {});

      const video = videoEl;
      if (!video) return;
      let loopStarted = false;
      const begin = () => {
        if (cancelled || loopStarted) return;
        loopStarted = true;
        setStarting(false);
        void startDecodeLoop(video);
      };
      video.srcObject = stream;
      video.onloadedmetadata = begin;
      void video.play().catch(() => {});
      if (video.readyState >= 1) begin();
    };

    const resolution = desktop ? { ...RESOLUTION_DESKTOP } : { ...RESOLUTION_PHONE };
    const attempts: MediaStreamConstraints[] = [];
    if (deviceId) attempts.push({ audio: false, video: { deviceId: { exact: deviceId }, ...resolution } });
    attempts.push({ audio: false, video: { facingMode: { ideal: "environment" }, ...resolution } });
    // Some hardware rejects specific resolutions outright even though `ideal`
    // should degrade gracefully — fall back to whatever camera the browser
    // will give rather than leaving the scanner dead.
    attempts.push({ audio: false, video: true });

    const tryOpen = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(window.isSecureContext
          ? "This browser can't open the camera. Type the code printed on the tag instead."
          : "The camera only works over a secure (https) connection. Type the code printed on the tag instead.");
        setStarting(false);
        return;
      }
      let lastErr: unknown = null;
      for (let i = 0; i < attempts.length; i++) {
        if (cancelled) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia(attempts[i]);
          // The remembered camera failed and a fallback opened instead —
          // forget it so the next open doesn't retry a dead device.
          if (deviceId && i > 0) writeStoredCamera(null);
          attachStream(stream);
          return;
        } catch (e) {
          lastErr = e;
          if (e instanceof Error && (e.name === "NotAllowedError" || e.name === "SecurityError")) break;
        }
      }
      if (cancelled) return;
      setStarting(false);
      const name = lastErr instanceof Error ? lastErr.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access was denied — allow camera permission for this site and try again."
          : name === "NotReadableError"
            ? "The camera is being used by another app. Close it there and try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Couldn't access the camera on this device.",
      );
    };
    void tryOpen();

    return () => {
      cancelled = true;
      stopStream();
      if (videoEl) { videoEl.onloadedmetadata = null; videoEl.srcObject = null; }
    };
    // restartKey forces a reopen even when the chosen id equals the stale one
    // in state (a remembered camera that failed and was fallen back from).
  }, [open, deviceId, restartKey]);

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      .then(() => setTorchOn(next))
      .catch(() => setTorchSupported(false));
  }, [torchOn]);

  const switchCamera = useCallback(() => {
    if (cameras.length < 2) return;
    const current = cameras.findIndex(c => c.deviceId === activeDeviceRef.current);
    const next = cameras[(current + 1) % cameras.length];
    writeStoredCamera(next.deviceId);
    setDeviceId(next.deviceId);
    setRestartKey(k => k + 1);
  }, [cameras]);

  if (!open) return null;

  const frameColor = detected ? "#3FB37F" : "#FFFDF9";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 flex items-center justify-center sm:p-6"
      style={{ zIndex: 1000, background: "rgba(12,7,5,0.88)" }}
    >
      <style>{SCANNER_CSS}</style>
      <div
        className="flex h-full w-full flex-col overflow-hidden sm:h-[min(88vh,860px)] sm:max-w-[1040px] sm:rounded-[20px]"
        style={{ background: "#0F0906", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "12px 14px 12px 18px",
            paddingTop: "max(12px, env(safe-area-inset-top))",
            borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <ScanLine size={20} color="#FFDFA0" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: "#FFFDF9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          </div>
          <Button variant="tertiary" size="sm" onClick={onClose} aria-label="Close camera"
            className="h-11 w-11 shrink-0 rounded-full border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.2)]">
            <X size={20} />
          </Button>
        </div>

        <div className="relative min-h-0 flex-1" style={{ background: "#000" }}>
          <video
            ref={videoRef}
            aria-label="Live camera feed for barcode scanning"
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: mirrored ? "scaleX(-1)" : undefined }}
            muted
            autoPlay
            playsInline
          />
          {!error && (
            <div
              aria-hidden
              style={{
                position: "absolute", inset: "7% 6%",
                borderRadius: 18,
                boxShadow: "0 0 0 4000px rgba(0,0,0,0.18)",
                pointerEvents: "none",
              }}
            >
              {/* Corner brackets: a loose target, not a box the tag must fit. */}
              {(["tl", "tr", "bl", "br"] as const).map(c => (
                <span
                  key={c}
                  style={{
                    position: "absolute", width: 44, height: 44,
                    top: c[0] === "t" ? -2 : undefined, bottom: c[0] === "b" ? -2 : undefined,
                    left: c[1] === "l" ? -2 : undefined, right: c[1] === "r" ? -2 : undefined,
                    borderColor: frameColor, borderStyle: "solid", borderWidth: 0,
                    borderTopWidth: c[0] === "t" ? 4 : 0, borderBottomWidth: c[0] === "b" ? 4 : 0,
                    borderLeftWidth: c[1] === "l" ? 4 : 0, borderRightWidth: c[1] === "r" ? 4 : 0,
                    borderTopLeftRadius: c === "tl" ? 18 : 0, borderTopRightRadius: c === "tr" ? 18 : 0,
                    borderBottomLeftRadius: c === "bl" ? 18 : 0, borderBottomRightRadius: c === "br" ? 18 : 0,
                    filter: `drop-shadow(0 0 3px ${accentColor})`,
                    transition: "border-color 150ms",
                  }}
                />
              ))}
              {!starting && !detected && (
                <span
                  className="bk-scanner-line"
                  style={{
                    position: "absolute", left: "4%", right: "4%", height: 2, borderRadius: 2,
                    background: "linear-gradient(90deg, transparent, #FFDFA0, transparent)",
                    boxShadow: "0 0 12px rgba(255,255,255,0.35)",
                  }}
                />
              )}
            </div>
          )}

          {!error && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 999,
                background: "rgba(0,0,0,0.6)", color: "#FFFDF9",
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
              }}
            >
              <span
                className={starting || detected ? undefined : "bk-scanner-dot"}
                style={{ width: 8, height: 8, borderRadius: 999, background: detected ? "#3FB37F" : starting ? "#FFDFA0" : "#E05A7A" }}
              />
              {detected ? "Got it" : starting ? "Starting camera…" : "Scanning — show the tag"}
            </div>
          )}

          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, textAlign: "center" }}>
              <AlertCircle size={32} color="#E8A0A0" />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.5, color: "#F0DEDE", maxWidth: 360 }}>{error}</span>
            </div>
          )}

          {!error && (torchSupported || cameras.length > 1) && (
            <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 10 }}>
              {torchSupported && (
                <Button variant="tertiary" size="sm" onClick={toggleTorch}
                  aria-label={torchOn ? "Turn torch off" : "Turn torch on"} aria-pressed={torchOn}
                  className="h-12 w-12 rounded-full border-0 bg-[rgba(0,0,0,0.6)] p-0 text-white hover:bg-[rgba(0,0,0,0.75)]">
                  {torchOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
                </Button>
              )}
              {cameras.length > 1 && (
                <Button variant="tertiary" size="sm" onClick={switchCamera} aria-label="Switch camera"
                  className="h-12 w-12 rounded-full border-0 bg-[rgba(0,0,0,0.6)] p-0 text-white hover:bg-[rgba(0,0,0,0.75)]">
                  <SwitchCamera size={20} />
                </Button>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 18px 14px",
            paddingBottom: "max(14px, env(safe-area-inset-bottom))",
            display: "flex", flexDirection: "column", gap: 8, flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.45, color: "rgba(255,253,249,0.72)" }}>
            {hint}
          </span>
          {/* Nothing has decoded for a while. The camera keeps running — this
              only points at the way out. The id is printed in plain text
              under the bars on every tag, so typing it always works. */}
          {unreadable && !error && !detected && (
            <span
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                fontFamily: "'Inter', sans-serif", fontSize: 12.5, lineHeight: 1.45,
                color: "#FFDFA0",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Still can&apos;t read it. Bring the tag a little closer, out of glare
                {torchSupported ? " (or turn on the torch)" : ""}
                {cameras.length > 1 ? ", or try the other camera" : ""}. If it still won&apos;t
                read, close the camera and type the ID printed under the barcode.
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
