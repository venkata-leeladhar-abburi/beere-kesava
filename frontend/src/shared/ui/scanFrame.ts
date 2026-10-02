import { dominantAngle, locateBarcodes, toGray, type BarcodeCandidate } from "./barcodeLocator";
import { decodeStraightCrop } from "./code128Profile";

/**
 * Canvas plumbing for the "find the barcode, then read it close up" pass of
 * CameraScannerModal — see barcodeLocator.ts and code128Profile.ts for why.
 * Everything here works on the live <video> at its full camera resolution.
 */

/** Width the frame is shrunk to for locating. Bars still alias into a
 *  coherent stripe pattern at this size; finding them costs ~15ms. */
const LOCATE_WIDTH = 960;
/** Long side of the enlarged crop handed to ZXing / BarcodeDetector. */
const CROP_DECODE_LONG = 2000;

export type FrameSource = HTMLVideoElement;

export class FrameScanner {
  private locateCanvas = document.createElement("canvas");
  private cropCanvas = document.createElement("canvas");
  private locateCtx = this.locateCanvas.getContext("2d", { willReadFrequently: true });
  private cropCtx = this.cropCanvas.getContext("2d", { willReadFrequently: true });

  /** Likely barcodes in the current frame, in raw video pixels. */
  locate(video: FrameSource): BarcodeCandidate[] {
    const ctx = this.locateCtx;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!ctx || !vw || !vh) return [];
    const s = Math.min(1, LOCATE_WIDTH / vw);
    const w = Math.round(vw * s);
    const h = Math.round(vh * s);
    if (this.locateCanvas.width !== w) this.locateCanvas.width = w;
    if (this.locateCanvas.height !== h) this.locateCanvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, w, h);
    const found = locateBarcodes(toGray(ctx.getImageData(0, 0, w, h).data, w, h), 2);
    return found.map(c => ({ ...c, cx: c.cx / s, cy: c.cy / s, length: c.length / s, thickness: c.thickness / s }));
  }

  /**
   * Draws the candidate straightened (bars vertical) and padded — a quiet
   * zone each side and room above and below in case the box is tight — at
   * `scale` output pixels per camera pixel. Returns the crop canvas.
   */
  crop(video: FrameSource, c: BarcodeCandidate, scale: number): HTMLCanvasElement | null {
    const ctx = this.cropCtx;
    if (!ctx) return null;
    const len = c.length * 1.5;
    const thick = Math.max(c.thickness * 2.2, c.length * 0.12);
    const w = Math.max(1, Math.round(len * scale));
    const h = Math.max(24, Math.round(thick * scale));
    this.cropCanvas.width = w;
    this.cropCanvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.rotate((-c.angle * Math.PI) / 180);
    ctx.translate(-c.cx, -c.cy);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    return this.cropCanvas;
  }

  private gray(canvas: HTMLCanvasElement) {
    const ctx = this.cropCtx!;
    return toGray(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
  }

  /**
   * The locator's angle comes from a downscaled frame where thin bars alias
   * and can be a few degrees out — more than a long Code128 tolerates.
   * Measuring the residual tilt on the full-resolution crop, twice, brings
   * it within a fraction of a degree.
   */
  refine(video: FrameSource, c: BarcodeCandidate): BarcodeCandidate {
    let cur = c;
    for (let i = 0; i < 2; i++) {
      const canvas = this.crop(video, cur, 1);
      if (!canvas) return cur;
      const residual = dominantAngle(this.gray(canvas));
      if (Math.abs(residual) > 20) return cur; // text or an edge won the vote — keep the estimate
      cur = { ...cur, angle: cur.angle + residual };
    }
    return cur;
  }

  /** Reads the candidate with the blur-tolerant profile decoder (camera scale). */
  readProfile(video: FrameSource, c: BarcodeCandidate): string | null {
    const canvas = this.crop(video, c, 1);
    if (!canvas) return null;
    return decodeStraightCrop(this.gray(canvas), 1);
  }

  /** The candidate straightened and enlarged, for ZXing / BarcodeDetector. */
  enlarged(video: FrameSource, c: BarcodeCandidate): HTMLCanvasElement | null {
    const scale = Math.min(4, Math.max(1, CROP_DECODE_LONG / (c.length * 1.5)));
    return this.crop(video, c, scale);
  }
}
