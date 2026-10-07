/**
 * A Code128 decoder built for blurry, noisy, low-resolution camera images —
 * a laptop webcam looking at a saree tag from a casual distance.
 *
 * ZXing and the browser's BarcodeDetector both threshold the image into
 * black and white before measuring bars. On a webcam frame a saree tag's
 * narrowest spaces are 2–3 pixels wide and blurred, so they come out grey
 * and the threshold swallows them: two bars merge, the symbol is garbage,
 * and the tag "won't scan" unless it is pressed up against the lens.
 *
 * This decoder does two things differently:
 *
 * 1. It reads a 1D *profile*, not pixels. The caller hands it a crop that
 *    has already been straightened so the bars are vertical (see
 *    barcodeLocator.ts); averaging each column down the bar height cancels
 *    most of the sensor noise while keeping every edge.
 *
 * 2. It finds edges as peaks of the profile's slope rather than threshold
 *    crossings — a blurred 1-module space never reaches "white", but its two
 *    edges still show up as a falling and a rising slope — and decodes with
 *    the ISO/IEC 15417 reference algorithm, which classifies each character
 *    by the distances between *similar* edges (bar-start to bar-start,
 *    space-start to space-start). Blur and ink spread shift both edges of
 *    such a pair the same way, so those distances survive where individual
 *    bar widths do not.
 *
 * Every read must pass the start pattern, the mod-103 check character, the
 * stop pattern and per-character width consistency, so a garbled profile
 * yields nothing rather than a wrong saree id.
 */

/** Element widths (bar, space, bar, space, bar, space) of values 0–106. 106 is the stop's first six. */
export const CODE128_PATTERNS: readonly string[] = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "233111",
];

const START_A = 103;
const START_B = 104;
const START_C = 105;
const STOP = 106;

/**
 * e-measure key → candidate values. Two characters can share e1..e4; the
 * reference algorithm separates them by the total bar width, kept here too.
 */
const E_TABLE: Map<string, { value: number; bars: number }[]> = (() => {
  const m = new Map<string, { value: number; bars: number }[]>();
  CODE128_PATTERNS.forEach((p, value) => {
    const w = [...p].map(Number);
    const key = `${w[0] + w[1]}${w[1] + w[2]}${w[2] + w[3]}${w[3] + w[4]}`;
    const list = m.get(key) ?? [];
    list.push({ value, bars: w[0] + w[2] + w[4] });
    m.set(key, list);
  });
  return m;
})();

/**
 * Classifies one character from its six element widths, or returns -1.
 * `widths` are in any unit; only their ratios matter.
 */
export function classifyCharacter(widths: ArrayLike<number>, offset = 0): number {
  let total = 0;
  for (let i = 0; i < 6; i++) total += widths[offset + i];
  if (!(total > 0)) return -1;
  const unit = total / 11;
  let key = "";
  for (let i = 0; i < 4; i++) {
    const e = (widths[offset + i] + widths[offset + i + 1]) / unit;
    const r = Math.round(e);
    // The reference algorithm's acceptance band: each e-measure must land
    // within its integer ±0.5, and 2..7 modules is all Code128 can contain.
    if (r < 2 || r > 7) return -1;
    key += r;
  }
  const candidates = E_TABLE.get(key);
  if (!candidates) return -1;
  if (candidates.length === 1) return candidates[0].value;
  const bars = (widths[offset] + widths[offset + 2] + widths[offset + 4]) / unit;
  let best = candidates[0];
  for (const c of candidates) if (Math.abs(c.bars - bars) < Math.abs(best.bars - bars)) best = c;
  return best.value;
}

/** Turns a validated symbol-value sequence (start … data, no check/stop) into text. */
export function symbolsToText(values: number[]): string | null {
  const first = values[0];
  if (first !== START_A && first !== START_B && first !== START_C) return null;
  let set: "A" | "B" | "C" = first === START_A ? "A" : first === START_B ? "B" : "C";
  let out = "";
  let shift = false;
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    const cur = shift ? (set === "A" ? "B" : "A") : set;
    shift = false;
    if (cur === "C") {
      if (v < 100) out += v < 10 ? `0${v}` : String(v);
      else if (v === 100) set = "B";
      else if (v === 101) set = "A";
      else if (v === 102)
        continue; // FNC1
      else return null;
      continue;
    }
    if (v < 96) {
      if (cur === "A") out += String.fromCharCode(v < 64 ? v + 32 : v - 64);
      else out += String.fromCharCode(v + 32);
      continue;
    }
    if (v === 96 || v === 97 || v === 102) continue; // FNC3 / FNC2 / FNC1
    if (v === 98) {
      shift = true;
      continue;
    }
    if (v === 99) {
      set = "C";
      continue;
    }
    if (v === 100) {
      if (cur === "A") set = "B";
      continue;
    } // FNC4 in B
    if (v === 101) {
      if (cur === "B") set = "A";
      continue;
    } // FNC4 in A
    return null;
  }
  return out;
}

/**
 * Edge positions (sub-pixel) and polarity from a profile where bars are
 * dark. Edges are the peaks of the slope; a peak only counts if it's a
 * meaningful share of the strongest slope nearby, so paper texture and
 * sensor noise between bars don't add phantom elements.
 */
export function findEdges(profile: ArrayLike<number>): { pos: number[]; falling: boolean[] } {
  const n = profile.length;
  const pos: number[] = [];
  const falling: boolean[] = [];
  const strength: number[] = [];
  if (n < 8) return { pos, falling };

  const d = new Float32Array(n);
  for (let i = 1; i < n - 1; i++) d[i] = (profile[i + 1] - profile[i - 1]) / 2;

  // Local reference slope: the strongest |slope| within a window. The window
  // is a fixed share of the profile — the profile is a crop of one barcode,
  // so this spans a few characters whatever the scale.
  const win = Math.max(8, Math.round(n / 24));
  const absD = Float32Array.from(d, Math.abs);
  const localMax = new Float32Array(n);
  // Sliding max via a monotonic deque.
  const dq: number[] = [];
  let head = 0;
  for (let i = 0, j = 0; i < n; i++) {
    const hi = Math.min(n - 1, i + win);
    for (; j <= hi; j++) {
      while (dq.length > head && absD[dq[dq.length - 1]] <= absD[j]) dq.pop();
      dq.push(j);
    }
    while (dq[head] < i - win) head++;
    localMax[i] = absD[dq[head]];
  }
  let globalMax = 0;
  for (let i = 0; i < n; i++) if (absD[i] > globalMax) globalMax = absD[i];
  if (globalMax <= 0) return { pos, falling };

  for (let i = 2; i < n - 2; i++) {
    const v = d[i];
    const a = absD[i];
    if (a < localMax[i] * 0.18 || a < globalMax * 0.06) continue;
    const isPeak = v > 0 ? v >= d[i - 1] && v > d[i + 1] : v <= d[i - 1] && v < d[i + 1];
    if (!isPeak) continue;
    // Parabolic sub-pixel refinement of the slope peak.
    const den = d[i - 1] - 2 * v + d[i + 1];
    const off = den !== 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (d[i - 1] - d[i + 1])) / den)) : 0;
    const isFalling = v < 0;
    const last = falling.length - 1;
    if (last >= 0 && falling[last] === isFalling) {
      // Two slopes the same way in a row: keep the stronger one.
      if (a > strength[last]) {
        pos[last] = i + off;
        strength[last] = a;
      }
      continue;
    }
    pos.push(i + off);
    falling.push(isFalling);
    strength.push(a);
  }
  return { pos, falling };
}

/**
 * Removes elements far too thin to be a module — a speck of sensor noise or
 * JPEG ringing inside a wide bar shows up as a pair of edges a pixel apart,
 * which splits one bar into three and garbles that character. A Code128
 * has many 1-module elements, so a low percentile of all element widths is
 * a good estimate of one module; anything under ~40% of it is merged back
 * into its neighbours (both of its edges are dropped).
 */
function dropPhantoms(pos: number[], falling: boolean[]): { pos: number[]; falling: boolean[] } {
  if (pos.length < 12) return { pos, falling };
  const widths: number[] = [];
  for (let k = 0; k + 1 < pos.length; k++) widths.push(pos[k + 1] - pos[k]);
  const sorted = [...widths].sort((a, b) => a - b);
  const module = sorted[Math.floor(sorted.length * 0.2)];
  const min = module * 0.4;
  const outPos: number[] = [];
  const outFalling: boolean[] = [];
  for (let k = 0; k < pos.length; k++) {
    const w = k + 1 < pos.length ? pos[k + 1] - pos[k] : Infinity;
    if (w < min && k > 0 && k + 1 < pos.length - 1) {
      k++; // skip this edge and the next: the thin element vanishes
      continue;
    }
    outPos.push(pos[k]);
    outFalling.push(falling[k]);
  }
  return { pos: outPos, falling: outFalling };
}

/**
 * Decodes the first valid Code128 symbol in a sequence of edges (left to
 * right). Element k spans edge k → k+1; it is a bar when edge k is falling
 * (light → dark).
 */
function decodeEdges(rawPos: number[], rawFalling: boolean[]): string | null {
  const { pos, falling } = dropPhantoms(rawPos, rawFalling);
  const widths: number[] = [];
  for (let k = 0; k + 1 < pos.length; k++) widths.push(pos[k + 1] - pos[k]);

  for (let s = 0; s + 6 * 3 + 7 <= widths.length + 1; s++) {
    if (!falling[s]) continue; // a symbol starts with a bar
    const start = classifyCharacter(widths, s);
    if (start !== START_A && start !== START_B && start !== START_C) continue;
    const charWidth = widths.slice(s, s + 6).reduce((a, b) => a + b, 0);
    // Quiet zone: at least ~5 modules of space before the start character
    // (the spec says 10; a tight crop or blur eats into it).
    const before = s > 0 ? widths[s - 1] : pos[s];
    if (before < (charWidth / 11) * 5) continue;

    const values = [start];
    let i = s + 6;
    let ok = false;
    while (i + 6 <= widths.length) {
      const w = widths.slice(i, i + 6).reduce((a, b) => a + b, 0);
      // Every character is 11 modules; one that isn't is a misread edge.
      if (Math.abs(w - charWidth) > charWidth * 0.25) break;
      const v = classifyCharacter(widths, i);
      if (v < 0) break;
      if (v === STOP) {
        // Stop is 13 modules: its trailing 2-module bar must be there too.
        const tail = widths[i + 6];
        if (tail !== undefined && Math.abs(tail - (2 * w) / 11) > w / 11) break;
        ok = true;
        break;
      }
      if (v >= START_A) break;
      values.push(v);
      i += 6;
    }
    if (!ok || values.length < 3) continue;

    const check = values.pop()!;
    let sum = values[0];
    for (let k = 1; k < values.length; k++) sum += values[k] * k;
    if (sum % 103 !== check) continue;
    const text = symbolsToText(values);
    if (text) return text;
  }
  return null;
}

function gaussianBlur(p: ArrayLike<number>, sigma: number): Float32Array {
  const n = p.length;
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(r * 2 + 1);
  let ks = 0;
  for (let i = -r; i <= r; i++) {
    k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
    ks += k[i + r];
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += p[Math.min(n - 1, Math.max(0, i + j))] * k[j + r];
    out[i] = acc / ks;
  }
  return out;
}

/**
 * Van Cittert deconvolution against a Gaussian blur of `sigma` pixels:
 * repeatedly adds back what blurring the current estimate loses. Webcam
 * optics at close range are roughly Gaussian; this restores the thin spaces
 * a blur of up to about half a module wipes out. Noise is amplified too,
 * which is affordable only because the profile is an average of many rows
 * (and a light pre-smooth takes the edge off what's left).
 */
function deconvolve(p: ArrayLike<number>, sigma: number, iterations: number): Float32Array {
  const observed = gaussianBlur(p, 0.5);
  const f = Float32Array.from(observed);
  for (let it = 0; it < iterations; it++) {
    const g = gaussianBlur(f, sigma);
    for (let i = 0; i < f.length; i++) f[i] += observed[i] - g[i];
  }
  return f;
}

/** Blur strengths tried, in profile pixels, mildest first. */
const DEBLUR_SIGMAS = [0.8, 1.2, 1.7, 2.4];
const DEBLUR_ITERATIONS = [4, 10];

function decodeOneWay(profile: ArrayLike<number>): string | null {
  const e = findEdges(profile);
  return decodeEdges(e.pos, e.falling);
}

/**
 * Decodes a dark-bars profile, sharp or blurred, in either reading
 * direction (an upside-down tag reads from the other end). `scale` is how
 * many profile pixels one camera pixel became, so the blur strengths tried
 * track the camera's blur rather than the crop's enlargement.
 */
export function decodeProfile(profile: ArrayLike<number>, scale = 1, deblur = true): string | null {
  const reversed = Float32Array.from(profile).reverse();
  for (const p of [profile, reversed]) {
    const direct = decodeOneWay(p);
    if (direct) return direct;
  }
  if (!deblur) return null;
  for (const sigma of DEBLUR_SIGMAS) {
    for (const iterations of DEBLUR_ITERATIONS) {
      for (const p of [profile, reversed]) {
        const text = decodeOneWay(deconvolve(p, sigma * scale, iterations));
        if (text) return text;
      }
    }
  }
  return null;
}

function averageRows(data: ArrayLike<number>, W: number, y0: number, y1: number): Float32Array {
  const profile = new Float32Array(W);
  for (let y = y0; y < y1; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) profile[x] += data[row + x];
  }
  const inv = 1 / Math.max(1, y1 - y0);
  for (let x = 0; x < W; x++) profile[x] *= inv;
  return profile;
}

/**
 * The run of rows that are bars. A crop around a tag also holds the printed
 * id under the bars, the card edge and background; averaging any of that
 * into the profile adds edges that aren't bars. Bar rows are the ones with
 * high contrast that look like each other: the seed is the highest-contrast,
 * most vertically uniform row, and the run grows while rows still correlate
 * with it. Text rows have contrast too, but a different pattern.
 */
function barRows(data: ArrayLike<number>, W: number, H: number): [number, number] | null {
  const mean = new Float32Array(H);
  const std = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    let m = 0;
    for (let x = 0; x < W; x++) m += data[y * W + x];
    m /= W;
    let v = 0;
    for (let x = 0; x < W; x++) {
      const q = data[y * W + x] - m;
      v += q * q;
    }
    mean[y] = m;
    std[y] = Math.sqrt(v / W);
  }
  const vdiff = new Float32Array(H);
  for (let y = 0; y + 2 < H; y++) {
    let d = 0;
    for (let x = 0; x < W; x++) d += Math.abs(data[y * W + x] - data[(y + 2) * W + x]);
    vdiff[y] = d / W;
  }
  let seed = -1;
  let best = 0;
  for (let y = 2; y + 4 < H; y++) {
    let sc = 0;
    for (let k = -2; k <= 2; k++) sc += std[y + k] - vdiff[y + k];
    if (sc > best) {
      best = sc;
      seed = y;
    }
  }
  if (seed < 0) return null;
  const ref = averageRows(data, W, Math.max(0, seed - 2), Math.min(H, seed + 3));
  let rm = 0;
  for (let x = 0; x < W; x++) rm += ref[x];
  rm /= W;
  let rv = 0;
  for (let x = 0; x < W; x++) rv += (ref[x] - rm) ** 2;
  const corr = (y: number) => {
    let c = 0;
    for (let x = 0; x < W; x++) c += (data[y * W + x] - mean[y]) * (ref[x] - rm);
    const den = Math.sqrt(rv) * std[y] * Math.sqrt(W);
    return den > 0 ? c / den : 0;
  };
  let y0 = seed;
  let y1 = seed + 1;
  while (y0 > 0 && corr(y0 - 1) > 0.6) y0--;
  while (y1 < H && corr(y1) > 0.6) y1++;
  return [y0, y1];
}

/**
 * Decodes a straightened crop (bars vertical) given as luminance. Several
 * horizontal bands are averaged and decoded separately — a band can be cut
 * by glare, a finger or the text under the bars — and a result is returned
 * only when at least two bands agree, which makes a coincidental misread
 * effectively impossible.
 */
export function decodeStraightCrop(
  gray: { data: ArrayLike<number>; width: number; height: number },
  scale = 1
): string | null {
  const { data, width: W, height: H } = gray;
  if (W < 40 || H < 6) return null;
  const votes = new Map<string, number>();
  // Bands inside the detected bar rows first (whole run, middle, each half —
  // a half can be clean when glare or a thumb spoils the other), then fixed
  // bands across the crop in case detection picked the wrong rows.
  const bands: [number, number][] = [];
  const run = barRows(data, W, H);
  if (run) {
    const [r0, r1] = run;
    const h = r1 - r0;
    bands.push(
      [r0, r1],
      [r0 + Math.floor(h * 0.2), r1 - Math.floor(h * 0.2)],
      [r0, r0 + Math.ceil(h / 2)],
      [r0 + Math.floor(h / 2), r1]
    );
  }
  for (const [a, b] of [
    [0.3, 0.45],
    [0.4, 0.6],
    [0.55, 0.7],
    [0.2, 0.8],
  ]) {
    bands.push([Math.floor(H * a), Math.ceil(H * b)]);
  }
  // Plain reads of every band first (cheap); the deblurring passes, which
  // cost ~20x more, only on the best few bands — this runs many times a
  // second while a tag is in front of the camera.
  const profiles = bands.map(([b0, b1]) => {
    const y0 = Math.max(0, b0);
    const y1 = Math.min(H, Math.max(y0 + 1, b1));
    return averageRows(data, W, y0, y1);
  });
  for (const deblur of [false, true]) {
    for (const profile of deblur ? profiles.slice(0, 4) : profiles) {
      const text = decodeProfile(profile, scale, deblur);
      if (!text) continue;
      const n = (votes.get(text) ?? 0) + 1;
      if (n >= 2) return text;
      votes.set(text, n);
    }
  }
  return null;
}
