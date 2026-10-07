/**
 * Pure helpers behind CameraScannerModal — kept out of the component so the
 * region/scale maths can be unit tested without a camera.
 */

export type ScanRegion = {
  /** Source rectangle in raw video-frame pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation applied when drawing to the decode canvas, in degrees. */
  rotate: number;
  /** Long side of the canvas this region is drawn into. */
  longSide: number;
};

/**
 * Long side of the canvas handed to the decoder. A whole 1920px frame is
 * downscaled to this; a crop is upscaled to it so thin Code128 bars get
 * enough samples. Much past this and a phone's decode takes longer than the
 * pause between attempts, and the page stutters.
 */
export const DECODE_LONG_SIDE = 1280;
/** The centre crop used for small or distant tags, as a fraction of the frame. */
export const CENTER_CROP = 0.6;
/**
 * Tilts the whole frame is straightened by, one per odd attempt, mildest
 * first. A saree tag's Code128 is long and short, so a scanline only crosses
 * all of it at a small tilt — measured against ZXing, a tag barcode stops
 * reading past ~±5°. 10° steps leave no gap, out to ±45°, which covers any
 * casual way of holding a tag. Only the older Code128 tags need this; a QR
 * reads at any angle and has its own, much cheaper pass (see qrRegion).
 */
export const TILTS = [10, -10, 20, -20, 30, -30, 40, -40] as const;
/**
 * A rotated frame's bounding box is bigger than the frame, so it gets a
 * larger canvas — otherwise the bars lose too many samples to the downscale.
 */
export const ROTATED_LONG_SIDE = 1600;

function fullFrame(vw: number, vh: number, rotate = 0): ScanRegion {
  const longSide = rotate === 0 ? Math.min(DECODE_LONG_SIDE, Math.max(vw, vh)) : ROTATED_LONG_SIDE;
  return { x: 0, y: 0, w: vw, h: vh, rotate, longSide };
}

function centerCrop(vw: number, vh: number, rotate = 0): ScanRegion {
  const w = vw * CENTER_CROP;
  const h = vh * CENTER_CROP;
  return {
    x: (vw - w) / 2,
    y: (vh - h) / 2,
    w,
    h,
    rotate,
    longSide: rotate === 0 ? DECODE_LONG_SIDE : ROTATED_LONG_SIDE,
  };
}

/**
 * Which part of the frame decode attempt `attempt` looks at.
 *
 * Even attempts alternate the WHOLE frame and a zoomed centre crop, so an
 * upright tag anywhere in view — not just inside the guide box — is looked
 * for every fourth attempt, and a distant one gets more pixels. Odd attempts
 * step through TILTS: first on the whole frame (a tilted tag anywhere), then
 * on the centre crop (a tilted tag held further away). Used for both
 * decoders: ZXing barely handles tilt and the native BarcodeDetector misses
 * steep Code128 tilts too.
 */
export function scanRegion(attempt: number, vw: number, vh: number): ScanRegion {
  const step = attempt % (TILTS.length * 4);
  if (step % 2 === 0) return step % 4 === 0 ? fullFrame(vw, vh) : centerCrop(vw, vh);
  const k = (step - 1) / 2;
  const tilt = TILTS[k % TILTS.length]!;
  return k < TILTS.length ? fullFrame(vw, vh, tilt) : centerCrop(vw, vh, tilt);
}

/**
 * Long side of the canvas a QR pass is decoded from. A saree tag's QR prints
 * ~0.7mm modules — three times a Code128 bar — so it needs far fewer camera
 * pixels than the bars do, and a smaller canvas is what keeps this pass to a
 * few milliseconds, cheap enough to run on every single attempt.
 */
export const QR_LONG_SIDE = 1280;
/**
 * Centre fractions the QR pass cycles through between whole-frame looks. The
 * whole frame is downscaled, which loses a tag held far away; each crop reads
 * the middle of the frame closer to the camera's own resolution.
 */
export const QR_CROPS = [0.6, 0.35] as const;

/**
 * Which part of the frame QR attempt `attempt` looks at: the whole frame on
 * every even attempt (a tag anywhere in view), a centre crop on the odd ones
 * (a small or distant tag). Never rotated — a QR reads at any angle — and
 * never upscaled, which would only cost time.
 */
export function qrRegion(attempt: number, vw: number, vh: number): ScanRegion {
  const crop = attempt % 2 === 0 ? 1 : QR_CROPS[((attempt - 1) / 2) % QR_CROPS.length]!;
  const w = vw * crop;
  const h = vh * crop;
  return {
    x: (vw - w) / 2,
    y: (vh - h) / 2,
    w,
    h,
    rotate: 0,
    longSide: Math.min(QR_LONG_SIDE, Math.max(w, h)),
  };
}

/**
 * Canvas a region is drawn into, and the scale the source is drawn at. The
 * canvas is the region's bounding box after rotation (so a tilted frame's
 * corners aren't clipped off), with its long side `region.longSide`.
 */
export function canvasSize(region: ScanRegion): { width: number; height: number; scale: number } {
  const rad = (region.rotate * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bw = region.w * cos + region.h * sin;
  const bh = region.w * sin + region.h * cos;
  const scale = region.longSide / Math.max(bw, bh);
  return {
    width: Math.max(1, Math.round(bw * scale)),
    height: Math.max(1, Math.round(bh * scale)),
    scale,
  };
}

/**
 * A printed tag's QR (or an older tag's Code128) decodes to the bare saree
 * id. The QR PNG from labels.service.ts instead encodes a
 * full "<FRONTEND_URL>/scan?id=<id>" link, so a generic phone camera can
 * open it directly. Every consumer of this scanner expects a bare id, so
 * unwrap the URL form here, once, instead of in each caller.
 */
export function extractScannedId(text: string): string {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    const id = url.searchParams.get("id");
    if (id) return id.trim();
  } catch {
    // Not a URL — a Code128 scan (or manual typing) already is the bare id.
  }
  return trimmed;
}

/**
 * Whether to mirror the live preview. A user-facing camera (a laptop webcam,
 * a phone's selfie camera) is shown mirrored so moving the tag left moves it
 * left on screen, which is what makes aiming feel natural. Only the preview
 * is flipped — the decoder always reads the raw, unmirrored frame, so a
 * mirrored barcode is never handed to it. Desktop webcams usually report no
 * facingMode at all, hence the fine-pointer check.
 */
export function shouldMirror(facingMode: string | undefined, finePointer: boolean): boolean {
  if (facingMode === "user") return true;
  if (facingMode === "environment") return false;
  return finePointer;
}
