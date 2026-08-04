#!/usr/bin/env node
/**
 * Codemod 04 — viewport units (design-system/02-LAYOUT.md Part I.5 / Step 9).
 * ═══════════════════════════════════════════════════════════════════════════
 * frontend/src has ~56 occurrences of 100vh, including bare `minHeight:
 * "100vh"` on nearly every page shell and five different hand-computed
 * `calc(100vh - <literal>px)` subtrahends that already disagree with each
 * other and with the real nav height.
 *
 * 100vh on iOS Safari includes the collapsing URL bar, so every one of
 * these overflows by ~50-60px on first paint until the bar collapses.
 * 100dvh (dynamic viewport height) tracks the *actual* visible viewport and
 * has no such bug — it's supported in all current browsers.
 *
 * This codemod does the SAFE, mechanical half of the fix: 100vh -> 100dvh
 * everywhere, including inside calc(). It does NOT touch the literal
 * subtrahends inside calc(100vh - 90px) etc — those encode each page's
 * assumption about how much chrome sits above it (some pages only account
 * for the topbar, others for topbar+groupbar+footer), and rewriting them to
 * derive from the new --shell-* tokens without knowing which is correct per
 * page would silently change visible content height. That reconciliation
 * happens when each page adopts PageShell (design-system/02-LAYOUT.md Step
 * 4 / Part E), which owns --shell-content-min-h directly.
 *
 * Conventions: idempotent, --dry-run, --feature=<name> (also scans
 * app/, shared/ui/, and components/ by default, matching the original
 * app-wide 100vh count).
 *
 * Usage:
 *   node scripts/codemods/04-viewport.mjs --dry-run
 *   node scripts/codemods/04-viewport.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const featureArg = args.find((a) => a.startsWith("--feature="));
const feature = featureArg ? featureArg.split("=")[1] : null;

const SRC = path.resolve(import.meta.dirname, "..", "..", "src");
const TARGET_ROOTS = feature
  ? [path.join(SRC, "features", feature)]
  : [
      path.join(SRC, "features"),
      path.join(SRC, "app"),
      path.join(SRC, "shared", "ui"),
      path.join(SRC, "components"),
    ];
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

const files = TARGET_ROOTS.flatMap((r) => walk(r));
let filesChanged = 0;
let totalReplacements = 0;
const calcSites = []; // sites with calc(100vh - ...) — flagged for the PageShell follow-up, not touched beyond vh->dvh

const VH_RE = /100vh/g;
const CALC_VH_RE = /calc\(\s*100vh\s*-[^)]*\)/g;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  if (!original.includes("100vh")) continue;

  const lines = original.split("\n");
  let fileChanged = false;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (!line.includes("100vh")) continue;

    if (CALC_VH_RE.test(line)) {
      calcSites.push({ file: path.relative(SRC, file), line: li + 1, text: line.trim().slice(0, 100) });
    }
    CALC_VH_RE.lastIndex = 0;

    const matches = line.match(VH_RE);
    if (matches) {
      totalReplacements += matches.length;
      lines[li] = line.replace(VH_RE, "100dvh");
      fileChanged = true;
    }
  }

  if (fileChanged) {
    filesChanged++;
    if (!dryRun) {
      writeFileSync(file, lines.join("\n"), "utf8");
    }
  }
}

console.log(`Codemod 04 — viewport units (100vh -> 100dvh) ${dryRun ? "(dry run)" : ""}`);
console.log(`Scope: ${TARGET_ROOTS.map((r) => path.relative(SRC, r) || ".").join(", ")}`);
console.log("");
console.log(`  100vh -> 100dvh replacements : ${totalReplacements}`);
console.log(`  files changed                : ${filesChanged}`);

if (calcSites.length) {
  console.log(
    `\n  ${calcSites.length} calc(100dvh - <literal>px) site(s) — subtrahend left as-is, review when the page adopts PageShell:`
  );
  for (const s of calcSites) console.log(`    ${s.file}:${s.line}  ${s.text}`);
}

if (dryRun) {
  console.log("\nDry run — no files were written. Re-run without --dry-run to apply.");
}
