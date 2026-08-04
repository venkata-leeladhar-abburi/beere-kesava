#!/usr/bin/env node
/**
 * BK Loom contrast gate.
 * ═══════════════════════════════════════════════════════════════════════════
 * Parses src/styles/tokens.css, resolves var() chains, computes WCAG 2.1
 * relative-luminance contrast ratios for the pairs that matter, and fails
 * the build if any regress below their required minimum.
 *
 * This is what makes it impossible for a colour change to silently
 * reintroduce a #8B7060-style failure (4.11:1 where 4.5:1 is required).
 *
 * Run: npm run check:contrast
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const TOKENS_CSS = path.resolve(import.meta.dirname, "..", "src", "styles", "tokens.css");

// ── Parse :root { --token: value; } declarations, resolving var() chains ──
function parseTokens(css) {
  const raw = new Map();
  // Match `--name: value;` across the whole file (root + .dark block — root wins on first pass)
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(css))) {
    const [, name, value] = m;
    if (!raw.has(name)) raw.set(name, value.trim());
  }

  const resolved = new Map();
  function resolve(name, seen = new Set()) {
    if (resolved.has(name)) return resolved.get(name);
    if (seen.has(name)) throw new Error(`Circular var() reference: ${name}`);
    seen.add(name);
    let value = raw.get(name);
    if (value === undefined) return undefined;
    value = value.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, ref) => {
      const r = resolve(ref, seen);
      return r ?? "";
    });
    resolved.set(name, value);
    return value;
  }
  for (const name of raw.keys()) resolve(name);
  return resolved;
}

// ── WCAG 2.1 relative luminance + contrast ratio ───────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Load and resolve tokens ─────────────────────────────────────────────
const css = readFileSync(TOKENS_CSS, "utf8");
const tokens = parseTokens(css);

function tv(name) {
  const v = tokens.get(name);
  if (!v) throw new Error(`Token not found: ${name}`);
  return v;
}

const CANVAS = tv("--surface-canvas");

// ── Checks ───────────────────────────────────────────────────────────────
const textChecks = [
  ["--text-primary", 4.5],
  ["--text-secondary", 4.5],
  ["--text-tertiary", 4.5],
  ["--text-accent", 4.5],
  ["--text-success", 4.5],
  ["--text-warning", 4.5],
  ["--text-danger", 4.5],
  ["--text-info", 4.5],
  ["--text-brand", 4.5],
];

const nonTextChecks = [["--border-focus", 3.0]];

const chartSeriesTokens = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
];

let failed = false;
const lines = [];

lines.push(`BK LOOM CONTRAST GATE\n`);
lines.push(`TEXT vs --surface-canvas (${CANVAS}), required 4.5:1`);
for (const [name, min] of textChecks) {
  const hex = tv(name);
  const ratio = contrastRatio(hex, CANVAS);
  const ok = ratio !== null && ratio >= min;
  if (!ok) failed = true;
  lines.push(
    `  ${name.padEnd(20)} ${hex.padEnd(10)} required ${min.toFixed(1)}   actual ${
      ratio === null ? "N/A" : ratio.toFixed(2)
    }   ${ok ? "✓" : "✗ FAIL"}`
  );
}

lines.push(`\nNON-TEXT (WCAG 1.4.11)`);
for (const [name, min] of nonTextChecks) {
  const hex = tv(name);
  const ratio = contrastRatio(hex, "#FFFFFF");
  const ok = ratio !== null && ratio >= min;
  if (!ok) failed = true;
  lines.push(
    `  ${name.padEnd(20)} ${hex.padEnd(10)} required ${min.toFixed(1)}   actual ${
      ratio === null ? "N/A" : ratio.toFixed(2)
    }   ${ok ? "✓" : "✗ FAIL"}`
  );
}

lines.push(`\nCHART SERIES — adjacent separation, required >= 1.5:1`);
const seriesHex = chartSeriesTokens.map((t) => tv(t));
for (let i = 0; i < seriesHex.length - 1; i++) {
  const ratio = contrastRatio(seriesHex[i], seriesHex[i + 1]);
  const ok = ratio !== null && ratio >= 1.5;
  // Adjacent-pair separation is a design guideline, not a hard WCAG gate —
  // warn rather than fail so a deliberate palette choice can't be blocked
  // by this script, but the shortfall is always visible.
  lines.push(
    `  ${chartSeriesTokens[i]} / ${chartSeriesTokens[i + 1]}   ${ratio.toFixed(2)}   ${
      ok ? "✓" : "⚠ below guideline"
    }`
  );
}

console.log(lines.join("\n"));
console.log(`\n${failed ? "FAIL" : "PASS"}  ·  ${failed ? "contrast regression detected" : "0 regressions"}`);

if (failed) process.exit(1);
