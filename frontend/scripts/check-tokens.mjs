#!/usr/bin/env node
/**
 * BK Loom token-drift gate.
 * ═══════════════════════════════════════════════════════════════════════════
 * src/styles/tokens.css and src/design-system/tokens.ts are two
 * hand-maintained copies of the same primitive colour values (CSS custom
 * properties for components that need `var(--x)`, a TS mirror for the ~412
 * inline-style call sites that need a resolved literal — Motion, Recharts
 * fill/stroke, etc.). If they drift, half the app renders a different colour
 * than the other half.
 *
 * This script parses both, matches primitives by name, and fails on any
 * value mismatch.
 *
 * Run: npm run check:tokens
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const TOKENS_CSS = path.resolve(import.meta.dirname, "..", "src", "styles", "tokens.css");
const TOKENS_TS = path.resolve(import.meta.dirname, "..", "src", "design-system", "tokens.ts");

// ── CSS side: --bk-<ramp>-<step>: #HEX; ────────────────────────────────
function parseCssRamps(css) {
  const map = new Map(); // "burgundy.900" -> "#6E0F2D"
  const re = /--bk-([a-z]+)-([0-9]+)\s*:\s*(#[0-9A-Fa-f]{6})/g;
  let m;
  while ((m = re.exec(css))) {
    const [, ramp, step, hex] = m;
    map.set(`${ramp}.${step}`, hex.toUpperCase());
  }
  return map;
}

// ── TS side: export const burgundy = { 900: '#6E0F2D', ... } ──────────
function parseTsRamps(ts) {
  const map = new Map();
  // Match each `export const <ramp> = { ... } as const;` block, then pull
  // `<step>: '#HEX'` pairs from inside it.
  const blockRe = /export const (burgundy|gold|neutral|green|amber|red|blue)\s*=\s*\{([^}]+)\}/gs;
  let bm;
  while ((bm = blockRe.exec(ts))) {
    const [, ramp, body] = bm;
    const pairRe = /(\d+):\s*'(#[0-9A-Fa-f]{6})'/g;
    let pm;
    while ((pm = pairRe.exec(body))) {
      const [, step, hex] = pm;
      map.set(`${ramp}.${step}`, hex.toUpperCase());
    }
  }
  return map;
}

const css = readFileSync(TOKENS_CSS, "utf8");
const ts = readFileSync(TOKENS_TS, "utf8");

const cssRamps = parseCssRamps(css);
const tsRamps = parseTsRamps(ts);

let mismatches = 0;
let checked = 0;

console.log("BK LOOM TOKEN DRIFT GATE\n");

const allKeys = new Set([...cssRamps.keys(), ...tsRamps.keys()]);
for (const key of [...allKeys].sort()) {
  const cssVal = cssRamps.get(key);
  const tsVal = tsRamps.get(key);
  checked++;
  if (cssVal === undefined) {
    console.log(`✗ ${key}: present in tokens.ts (${tsVal}) but missing from tokens.css`);
    mismatches++;
  } else if (tsVal === undefined) {
    console.log(`✗ ${key}: present in tokens.css (${cssVal}) but missing from tokens.ts`);
    mismatches++;
  } else if (cssVal !== tsVal) {
    console.log(`✗ ${key}: css ${cssVal} != ts ${tsVal}`);
    mismatches++;
  }
}

if (mismatches === 0) {
  console.log(`✓ ${checked} tokens match between tokens.css and tokens.ts`);
} else {
  console.log(`\n${mismatches} of ${checked} tokens drifted.`);
}

console.log(`\n${mismatches === 0 ? "PASS" : "FAIL"}`);
if (mismatches > 0) process.exit(1);
