#!/usr/bin/env node
/**
 * Bundle-size gate.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fails CI if the gzipped JS shipped to the browser regresses past the
 * budget below. Run after `npm run build`.
 *
 * The budget starts at the current measured size (not an aspirational
 * number) so this gate is meaningful from day one: it stops the bundle from
 * growing further while Phase 4 (route-level code splitting, manualChunks,
 * dropping the 13 unused dependencies) brings it down. Lower BUDGET_KB as
 * that work lands — never raise it without a documented reason.
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_ASSETS = path.resolve(import.meta.dirname, "..", "dist", "assets");
const BUDGET_KB = 1900; // current measured: ~1825 KB gzip. See Phase 4 target: 250 KB.

function totalGzipKB(dir) {
  let totalBytes = 0;
  const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    const full = path.join(dir, f);
    if (!statSync(full).isFile()) continue;
    const gz = gzipSync(readFileSync(full));
    totalBytes += gz.length;
  }
  return { kb: totalBytes / 1024, files };
}

let result;
try {
  result = totalGzipKB(DIST_ASSETS);
} catch (err) {
  console.error(`Could not read ${DIST_ASSETS} — did the build run first?`);
  console.error(err.message);
  process.exit(1);
}

const { kb, files } = result;
console.log(`JS shipped (gzip): ${kb.toFixed(1)} KB across ${files.length} file(s)`);
console.log(`Budget: ${BUDGET_KB} KB`);

if (kb > BUDGET_KB) {
  console.error(
    `\n✖ Bundle size regressed: ${kb.toFixed(1)} KB > ${BUDGET_KB} KB budget.\n` +
      `  If this growth is intentional, lower-effort code splitting first —\n` +
      `  see the Phase 4 performance plan. Only raise BUDGET_KB as a last resort,\n` +
      `  with a comment explaining why.`
  );
  process.exit(1);
}

console.log(`✓ Within budget (${(BUDGET_KB - kb).toFixed(1)} KB headroom).`);
