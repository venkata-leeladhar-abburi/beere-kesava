/**
 * Finds where a 1D barcode sits in a camera frame, so the decoder can be
 * handed a tight, straightened, enlarged crop of just the bars.
 *
 * Why this exists: a laptop webcam sees a saree tag's Code128 (~230 narrow
 * bars across 47mm) at only 2–3 camera pixels per bar unless the tag is held
 * right up to the lens. Decoding the whole frame at that size fails — every
 * decoder samples or downsamples the frame before it ever looks for bars.
 * Cropping the barcode at full camera resolution and enlarging it gives the
 * decoder the same pixels at 3–4x the size, which is the difference between
 * a tag that reads at a casual distance and one that must be pressed to the
 * camera. Phones don't need this (their cameras resolve the bars easily),
 * but it does no harm there either.
 *
 * Method: a barcode is the one thing in a typical frame with strong
 * gradients that all point the same way. The frame is split into small
 * blocks; each block's structure tensor gives its gradient energy and how
 * coherent (single-direction) that gradient is. Blocks that are both strong
 * and coherent are grown into regions of matching orientation, and each
 * region's bounding box and bar angle is returned. Text, faces and shelves
 * have strong gradients too, but in every direction at once, so they score
 * low on coherence.
 */

export type Gray = {
  data: Uint8ClampedArray | Uint8Array | Float32Array;
  width: number;
  height: number;
};

export type BarcodeCandidate = {
  /** Centre of the barcode, in the coordinates of the analysed image. */
  cx: number;
  cy: number;
  /** Extent across the bars (along the gradient) and along the bars. */
  length: number;
  thickness: number;
  /**
   * Direction of the gradient (i.e. across the bars), in degrees, in
   * (-90, 90]. 0 means upright bars read left-to-right.
   */
  angle: number;
  /** Relative strength, for ranking. */
  score: number;
};

/** Block edge in analysed pixels. */
const BLOCK = 8;
/** Below this coherence a block is texture/text, not bars. */
const MIN_COHERENCE = 0.55;
/** A neighbour joins a region only if its bar direction is this close. */
const MAX_ANGLE_DIFF_DEG = 18;

/** Converts RGBA pixels to a luminance array. */
export function toGray(rgba: Uint8ClampedArray, width: number, height: number): Gray {
  const out = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; j < out.length; i += 4, j++) {
    // Integer Rec.601 luma.
    out[j] = (rgba[i]! * 77 + rgba[i + 1]! * 150 + rgba[i + 2]! * 29) >> 8;
  }
  return { data: out, width, height };
}

function angleDiff(a: number, b: number): number {
  // Orientations are mod 180°.
  let d = Math.abs(a - b) % 180;
  if (d > 90) d = 180 - d;
  return d;
}

/**
 * Returns up to `max` likely barcode regions, strongest first.
 */
export function locateBarcodes(img: Gray, max = 2): BarcodeCandidate[] {
  const { data, width: W, height: H } = img;
  const bw = Math.floor(W / BLOCK);
  const bh = Math.floor(H / BLOCK);
  if (bw < 3 || bh < 3) return [];

  const n = bw * bh;
  const energy = new Float32Array(n);
  const angle = new Float32Array(n);
  const jxx = new Float64Array(n);
  const jyy = new Float64Array(n);
  const jxy = new Float64Array(n);

  // Central-difference gradients, accumulated into each block's tensor.
  for (let y = 1; y < bh * BLOCK - 1 && y < H - 1; y++) {
    const row = y * W;
    const by = Math.floor(y / BLOCK) * bw;
    for (let x = 1; x < bw * BLOCK - 1 && x < W - 1; x++) {
      const i = row + x;
      const gx = data[i + 1]! - data[i - 1]!;
      const gy = data[i + W]! - data[i - W]!;
      const b = by + Math.floor(x / BLOCK);
      jxx[b]! += gx * gx;
      jyy[b]! += gy * gy;
      jxy[b]! += gx * gy;
    }
  }

  let maxEnergy = 0;
  for (let b = 0; b < n; b++) {
    const e = jxx[b]! + jyy[b]!;
    if (e <= 0) continue;
    const coh = Math.sqrt((jxx[b]! - jyy[b]!) ** 2 + 4 * jxy[b]! ** 2) / e;
    // Gradient direction (across the bars).
    angle[b] = (0.5 * Math.atan2(2 * jxy[b]!, jxx[b]! - jyy[b]!) * 180) / Math.PI;
    energy[b] = coh >= MIN_COHERENCE ? e * coh * coh : 0;
    if (energy[b]! > maxEnergy) maxEnergy = energy[b]!;
  }
  if (maxEnergy <= 0) return [];

  // Weak-but-coherent blocks are noise on a flat surface; only blocks with a
  // real share of the strongest one's energy can be bars.
  const floor = maxEnergy * 0.12;
  const visited = new Uint8Array(n);
  const found: BarcodeCandidate[] = [];
  const order = Array.from({ length: n }, (_, b) => b)
    .filter((b) => energy[b]! > floor)
    .sort((a, b) => energy[b]! - energy[a]!);

  for (const seed of order) {
    if (visited[seed]) continue;
    const seedAngle = angle[seed]!;
    const stack = [seed];
    visited[seed] = 1;
    const members: number[] = [];
    let sum = 0;
    while (stack.length) {
      const b = stack.pop()!;
      members.push(b);
      sum += energy[b]!;
      const bx = b % bw;
      const by = (b - bx) / bw;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = bx + dx;
          const ny = by + dy;
          if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;
          const nb = ny * bw + nx;
          if (visited[nb] || energy[nb]! <= floor * 0.5) continue;
          if (angleDiff(angle[nb]!, seedAngle) > MAX_ANGLE_DIFF_DEG) continue;
          visited[nb] = 1;
          stack.push(nb);
        }
      }
    }
    if (members.length < 4) continue;

    // Energy-weighted mean orientation (doubled-angle average, since
    // orientations wrap at 180°).
    let c2 = 0;
    let s2 = 0;
    for (const b of members) {
      const r = (angle[b]! * Math.PI) / 90;
      c2 += Math.cos(r) * energy[b]!;
      s2 += Math.sin(r) * energy[b]!;
    }
    const theta = (Math.atan2(s2, c2) * 90) / Math.PI;
    const t = (theta * Math.PI) / 180;
    const ux = Math.cos(t);
    const uy = Math.sin(t);

    // Extent along (u) and across (v) the gradient direction, in block
    // centres, then padded by a block on every side.
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;
    for (const b of members) {
      const x = ((b % bw) + 0.5) * BLOCK;
      const y = (Math.floor(b / bw) + 0.5) * BLOCK;
      const u = x * ux + y * uy;
      const v = -x * uy + y * ux;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const cu = (minU + maxU) / 2;
    const cv = (minV + maxV) / 2;
    found.push({
      cx: cu * ux - cv * uy,
      cy: cu * uy + cv * ux,
      length: maxU - minU + BLOCK * 2,
      thickness: maxV - minV + BLOCK * 2,
      angle: theta,
      score: sum,
    });
    if (found.length >= max * 3) break;
  }

  // A real barcode is longer across the bars than along them (a saree tag's
  // is ~4–7x). Squarish blobs are usually stripes on clothing or shelving.
  return found
    .filter((c) => c.length >= c.thickness * 1.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

/**
 * The dominant gradient direction over a whole image, in degrees, in
 * (-90, 90]. Used to fine-tune a crop that has already been roughly
 * straightened: the block estimate above is made on a downscaled frame where
 * thin bars alias, and can be several degrees out — more than ZXing's ~±5°
 * tolerance for a long Code128. Measured on the full-resolution crop, the
 * residual tilt is precise. Only strong gradients vote, so flat paper and
 * sensor noise don't drag it towards zero.
 */
export function dominantAngle(img: Gray): number {
  const { data, width: W, height: H } = img;
  let xx = 0,
    yy = 0,
    xy = 0;
  for (let y = 1; y < H - 1; y++) {
    const row = y * W;
    for (let x = 1; x < W - 1; x++) {
      const i = row + x;
      const gx = data[i + 1]! - data[i - 1]!;
      const gy = data[i + W]! - data[i - W]!;
      const m = gx * gx + gy * gy;
      if (m < 400) continue;
      xx += gx * gx;
      yy += gy * gy;
      xy += gx * gy;
    }
  }
  if (xx + yy === 0) return 0;
  return (0.5 * Math.atan2(2 * xy, xx - yy) * 180) / Math.PI;
}
