#!/usr/bin/env node
/**
 * Codemod 01 — deprecated colours (design-system/01-FOUNDATIONS.md, Part L).
 * ═══════════════════════════════════════════════════════════════════════════
 * Two fully-automatic replacements:
 *
 *   1. #8B7060 → #69635E
 *      The app's universal muted/label/table-header colour. Fails WCAG AA
 *      at 4.11:1 against the cream canvas. #69635E is 5.92:1, same visual
 *      role (design-system/design-system/tokens.ts: semantic.text.tertiary).
 *      Every occurrence is a straight literal swap — the colour was never
 *      used for anything but text/label purposes in this codebase.
 *
 *   2. Gold used as a `color:` value → #845E04
 *      #C89B47 / #C4923A / #E8A84A as `color:` are 2.55:1 / ~2.6:1 and
 *      unreadable as text. #845E04 is 5.86:1 (semantic.text.accent).
 *      ONLY rewrites `color:` — #C89B47 etc. as background:/border:/fill:/
 *      stroke: are valid decorative surface colours and must NOT change.
 *
 * Conventions (see design-system/08-GOVERNANCE.md, Part F):
 *   --dry-run          print a diff summary, touch nothing
 *   --feature=<name>   scope to src/features/<name> only
 *   idempotent          running twice makes no further changes
 *
 * Usage:
 *   node scripts/codemods/01-deprecated-colors.mjs --dry-run
 *   node scripts/codemods/01-deprecated-colors.mjs --feature=inventory
 *   node scripts/codemods/01-deprecated-colors.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const featureArg = args.find((a) => a.startsWith("--feature="));
const feature = featureArg ? featureArg.split("=")[1] : null;

const SRC = path.resolve(import.meta.dirname, "..", "..", "src");
// Default scope is app-wide (features/ + shared/ui/ + lib/) to match the
// design-system/01-FOUNDATIONS.md audit count (88 occurrences across the
// whole app, not just features/). --feature scopes to one feature only.
const TARGET_ROOTS = feature
  ? [path.join(SRC, "features", feature)]
  : [path.join(SRC, "features"), path.join(SRC, "shared", "ui"), path.join(SRC, "lib")];
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "_legacy"]);
// design-system/tokens.ts's DEPRECATED map documents the old values on purpose — never rewrite it.
const EXCLUDE_PATHS = new Set([path.join(SRC, "design-system", "tokens.ts")]);

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
      } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
        const full = path.join(cur, e.name);
        if (!EXCLUDE_PATHS.has(full)) out.push(full);
      }
    }
  }
  return out;
}

const files = TARGET_ROOTS.flatMap(walk);

let filesChanged = 0;
let taupeReplacements = 0;
let goldReplacements = 0;
const ambiguousGoldSites = [];

// Gold-as-color patterns, two distinct syntaxes:
//   CSS/style-object key:  color: "#C89B47"   (colon)
//   JSX attribute:         color="#C89B47"    (equals — e.g. <Shield color="#C4923A" />)
// Deliberately narrow — only matches the `color` KEY/PROP, never
// background/border/fill/stroke, so decorative gold usage is untouched.
const GOLD_COLOR_RE = /(\bcolor:\s*)(["'])(#C89B47|#C4923A|#E8A84A)\2/g;
const GOLD_COLOR_ATTR_RE = /(\bcolor=)(["'])(#C89B47|#C4923A|#E8A84A)\2/g;
const TAUPE_RE = /#8B7060/g;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let content = original;

  const taupeMatches = content.match(TAUPE_RE);
  if (taupeMatches) {
    taupeReplacements += taupeMatches.length;
    content = content.replace(TAUPE_RE, "#69635E");
  }

  const goldMatches = [...content.matchAll(GOLD_COLOR_RE)];
  if (goldMatches.length) {
    goldReplacements += goldMatches.length;
    content = content.replace(GOLD_COLOR_RE, (_, prefix, quote) => `${prefix}${quote}#845E04${quote}`);
  }

  const goldAttrMatches = [...content.matchAll(GOLD_COLOR_ATTR_RE)];
  if (goldAttrMatches.length) {
    goldReplacements += goldAttrMatches.length;
    content = content.replace(GOLD_COLOR_ATTR_RE, (_, prefix, quote) => `${prefix}${quote}#845E04${quote}`);
  }

  // Flag any remaining gold hex on a line containing the `color` word that
  // neither regex above confidently matched (e.g. a ternary assigned to a
  // `color` variable, template literals, computed keys) — surfaced for
  // manual review, never auto-changed. Lines where the ONLY gold hex is
  // attached to background/border/fill/stroke (not `color`) are not flagged.
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const hasGoldHex = /#C89B47|#C4923A|#E8A84A/.test(line);
    if (!hasGoldHex) return;
    const hasColorKeyOrAttr = /\bcolor[:=]/.test(line);
    if (!hasColorKeyOrAttr) return; // gold only used as background/border/fill/stroke — fine as-is
    GOLD_COLOR_RE.lastIndex = 0;
    GOLD_COLOR_ATTR_RE.lastIndex = 0;
    const alreadyHandled = GOLD_COLOR_RE.test(line) || GOLD_COLOR_ATTR_RE.test(line);
    GOLD_COLOR_RE.lastIndex = 0;
    GOLD_COLOR_ATTR_RE.lastIndex = 0;
    if (!alreadyHandled && !/#845E04/.test(line)) {
      ambiguousGoldSites.push(`${path.relative(SRC, file)}:${i + 1}`);
    }
  });

  if (content !== original) {
    filesChanged++;
    if (!dryRun) {
      writeFileSync(file, content, "utf8");
    }
  }
}

console.log(`Codemod 01 — deprecated colours ${dryRun ? "(dry run)" : ""}`);
console.log(`Scope: ${TARGET_ROOTS.map((r) => path.relative(SRC, r) || ".").join(", ")}`);
console.log("");
console.log(`  #8B7060 → #69635E     : ${taupeReplacements} replacement(s)`);
console.log(`  gold color: → #845E04 : ${goldReplacements} replacement(s)`);
console.log(`  files changed         : ${filesChanged}`);

if (ambiguousGoldSites.length) {
  console.log(`\n  ⚠ ${ambiguousGoldSites.length} site(s) mention gold near "color" but weren't auto-matched — review manually:`);
  for (const s of ambiguousGoldSites.slice(0, 20)) console.log(`    ${s}`);
  if (ambiguousGoldSites.length > 20) console.log(`    … and ${ambiguousGoldSites.length - 20} more`);
}

if (dryRun) {
  console.log("\nDry run — no files were written. Re-run without --dry-run to apply.");
}
