#!/usr/bin/env node
/**
 * Bundle-size gate.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fails CI if the gzipped JS shipped to the browser regresses past budget.
 * Run after `npm run build`.
 *
 * Two numbers matter differently:
 *  - INITIAL_BUDGET_KB: the JS every user downloads before they can log in
 *    (entry chunk + eager vendor chunks referenced by <link modulepreload>
 *    in dist/index.html). This is the number the Phase 4 performance plan's
 *    "initial JS ≤ 250 KB gzipped" gate actually means.
 *  - TOTAL_BUDGET_KB: sum of every JS chunk, including code that only loads
 *    behind a route's React.lazy() boundary. This catches runaway total
 *    bundle growth even though it doesn't affect first paint.
 *
 * Both budgets start at the current measured size — lower them as further
 * work lands, never raise without a documented reason.
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST = path.resolve(import.meta.dirname, "..", "dist");
const DIST_ASSETS = path.join(DIST, "assets");

const INITIAL_BUDGET_KB = 250; // Phase 4 target, met as of the manualChunks + lazy-portal split.
const TOTAL_BUDGET_KB = 1050; // current measured: ~996 KB gzip across all chunks.

function gzipKB(file) {
  return gzipSync(readFileSync(file)).length / 1024;
}

let indexHtml;
try {
  indexHtml = readFileSync(path.join(DIST, "index.html"), "utf8");
} catch (err) {
  console.error(`Could not read ${DIST}/index.html — did the build run first?`);
  console.error(err.message);
  process.exit(1);
}

// Entry script(s) plus every chunk the HTML eagerly modulepreloads.
const entryHrefs = [...indexHtml.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);
const preloadHrefs = [...indexHtml.matchAll(/modulepreload"[^>]*href="([^"]+\.js)"/g)].map((m) => m[1]);
const initialFiles = [...new Set([...entryHrefs, ...preloadHrefs])].map((href) =>
  path.join(DIST, href.replace(/^\//, ""))
);

const initialKB = initialFiles.reduce((sum, f) => sum + gzipKB(f), 0);

const allJsFiles = readdirSync(DIST_ASSETS)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(DIST_ASSETS, f))
  .filter((f) => statSync(f).isFile());
const totalKB = allJsFiles.reduce((sum, f) => sum + gzipKB(f), 0);

console.log(`Initial JS (gzip): ${initialKB.toFixed(1)} KB — budget ${INITIAL_BUDGET_KB} KB`);
console.log(`Total JS (gzip):   ${totalKB.toFixed(1)} KB across ${allJsFiles.length} file(s) — budget ${TOTAL_BUDGET_KB} KB`);

let failed = false;

if (initialKB > INITIAL_BUDGET_KB) {
  console.error(
    `\n✖ Initial bundle regressed: ${initialKB.toFixed(1)} KB > ${INITIAL_BUDGET_KB} KB budget.\n` +
      `  Something eager (a top-level import, a new modulepreload) grew. Check for\n` +
      `  base64-inlined assets or a dependency imported outside a React.lazy() boundary.`
  );
  failed = true;
}

if (totalKB > TOTAL_BUDGET_KB) {
  console.error(
    `\n✖ Total bundle regressed: ${totalKB.toFixed(1)} KB > ${TOTAL_BUDGET_KB} KB budget.\n` +
      `  Only raise TOTAL_BUDGET_KB as a last resort, with a comment explaining why.`
  );
  failed = true;
}

if (failed) process.exit(1);

console.log(
  `✓ Within budget (initial: ${(INITIAL_BUDGET_KB - initialKB).toFixed(1)} KB headroom, ` +
    `total: ${(TOTAL_BUDGET_KB - totalKB).toFixed(1)} KB headroom).`
);
