#!/usr/bin/env node
/**
 * Codemod 02 — font sizes (design-system/01-FOUNDATIONS.md, Part D.2 / Part K
 * Step 5).
 * ═══════════════════════════════════════════════════════════════════════════
 * frontend/src has ~1,700 `fontSize: N` values below the 12px floor — chart
 * axis labels at 8.5px, table headers at 9px. Maps every numeric fontSize to
 * the nearest type-scale token, NEVER rounding a sub-12 value down to
 * anything below 12:
 *
 *   8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5  → 12   (floor — every one of these
 *                                               sites gets a visible size
 *                                               increase; see the review
 *                                               report this script prints)
 *   12, 12.5                            → 12
 *   13, 13.5                            → 13
 *   14, 14.5, 15                        → 14
 *   16, 17                              → 16
 *   18, 19                              → 18
 *   20, 21, 22                          → 20
 *   24, 26                              → 24
 *   28, 30, 32                          → 30
 *   34, 36, 38, 40                      → 38
 *   44, 48, 52                          → 48
 *   56, 60                              → 60
 *
 * SAFETY NOTE: the design-system doc's plan calls for tagging each sub-12
 * site with an inline `// TODO(bk-migration):` comment. Most `fontSize: N`
 * occurrences in this codebase sit mid-line inside single-line JSX style
 * objects (`{ fontSize: 9, color: T.taupe, ... }`) — appending a trailing
 * `//` comment there would silently comment out every property after it on
 * that line, corrupting the object. That risk is unacceptable, so instead
 * this script prints every sub-12 rewrite (file:line, old → new) to the
 * console and to a report file for review, and touches no comment syntax.
 *
 * Conventions: idempotent, --dry-run, --feature=<name>.
 *
 * Usage:
 *   node scripts/codemods/02-font-sizes.mjs --dry-run
 *   node scripts/codemods/02-font-sizes.mjs --feature=inventory
 *   node scripts/codemods/02-font-sizes.mjs --feature=inventory --report=/tmp/fontsize-inventory.md
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const featureArg = args.find((a) => a.startsWith("--feature="));
const feature = featureArg ? featureArg.split("=")[1] : null;
const reportArg = args.find((a) => a.startsWith("--report="));

const SRC = path.resolve(import.meta.dirname, "..", "..", "src");
const FEATURES_DIR = path.join(SRC, "features");
const TARGET_ROOT = feature ? path.join(FEATURES_DIR, feature) : FEATURES_DIR;
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "_legacy"]);

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        stack.push(path.join(cur, e.name));
      } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
        out.push(path.join(cur, e.name));
      }
    }
  }
  return out;
}

// Ordered so the mapping lookup below finds an exact match first, then
// falls through to the SIZE_MAP table.
const SIZE_MAP = new Map([
  [8, 12], [8.5, 12], [9, 12], [9.5, 12], [10, 12], [10.5, 12], [11, 12], [11.5, 12],
  [12, 12], [12.5, 12],
  [13, 13], [13.5, 13],
  [14, 14], [14.5, 14], [15, 14],
  [16, 16], [17, 16],
  [18, 18], [19, 18],
  [20, 20], [21, 20], [22, 20],
  [24, 24], [26, 24],
  [28, 30], [30, 30], [32, 30],
  [34, 38], [36, 38], [38, 38], [40, 38],
  [44, 48], [48, 48], [52, 48],
  [56, 60], [60, 60],
]);

const SUB_12_FLOOR = new Set([8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5]);

// Matches `fontSize: 12` / `fontSize:12.5` / `fontSize : 9` (object-literal
// style, not the CSS-string form) — the form used throughout this codebase's
// inline `style={{}}` objects.
const FONT_SIZE_RE = /fontSize\s*:\s*(\d+(?:\.\d+)?)\b/g;

const files = walk(TARGET_ROOT);
let filesChanged = 0;
let totalReplacements = 0;
let floorReplacements = 0;
const reviewSites = []; // { file, line, from, to }

for (const file of files) {
  const original = readFileSync(file, "utf8");
  if (!FONT_SIZE_RE.test(original)) continue;
  FONT_SIZE_RE.lastIndex = 0;

  const lines = original.split("\n");
  let fileChanged = false;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (!/fontSize\s*:\s*\d/.test(line)) continue;

    const newLine = line.replace(FONT_SIZE_RE, (full, numStr) => {
      const num = parseFloat(numStr);
      const mapped = SIZE_MAP.get(num);
      if (mapped === undefined || mapped === num) return full; // unmapped or already-canonical — leave untouched
      totalReplacements++;
      fileChanged = true;
      if (SUB_12_FLOOR.has(num)) {
        floorReplacements++;
        reviewSites.push({
          file: path.relative(SRC, file),
          line: li + 1,
          from: num,
          to: mapped,
        });
      }
      return `fontSize: ${mapped}`;
    });

    lines[li] = newLine;
  }

  if (fileChanged) {
    filesChanged++;
    if (!dryRun) {
      writeFileSync(file, lines.join("\n"), "utf8");
    }
  }
}

console.log(`Codemod 02 — font sizes ${dryRun ? "(dry run)" : ""}`);
console.log(`Scope: ${path.relative(SRC, TARGET_ROOT) || "src/features"}`);
console.log("");
console.log(`  total fontSize replacements     : ${totalReplacements}`);
console.log(`  of which raised the 12px floor  : ${floorReplacements}  (visible size increase — review)`);
console.log(`  files changed                   : ${filesChanged}`);

if (reviewSites.length) {
  const reportLines = [
    `# Font-size floor review — ${feature ?? "all features"}`,
    "",
    `${reviewSites.length} sites were raised from a sub-12px size to the 12px floor.`,
    "Each is a visible size increase — confirm the surrounding layout still works.",
    "",
    "| File | Line | From | To |",
    "|---|---|---|---|",
    ...reviewSites.map((s) => `| ${s.file} | ${s.line} | ${s.from}px | ${s.to}px |`),
    "",
  ].join("\n");

  if (reportArg) {
    const reportPath = reportArg.split("=")[1];
    writeFileSync(reportPath, reportLines, "utf8");
    console.log(`\n  Review report written to ${reportPath}`);
  } else {
    console.log(`\n  ${reviewSites.length} floor-raise sites (first 15 shown; use --report=<path> for the full list):`);
    for (const s of reviewSites.slice(0, 15)) {
      console.log(`    ${s.file}:${s.line}  ${s.from}px → ${s.to}px`);
    }
    if (reviewSites.length > 15) console.log(`    … and ${reviewSites.length - 15} more`);
  }
}

if (dryRun) {
  console.log("\nDry run — no files were written. Re-run without --dry-run to apply.");
}
