#!/usr/bin/env node
/**
 * Codemod 13 — theme re-export (design-system/01-FOUNDATIONS.md, Step 6 /
 * design-system/08-GOVERNANCE.md, Part F).
 * ═══════════════════════════════════════════════════════════════════════════
 * 21 local theme.ts/theme.tsx files under features/ each redefine the same
 * handful of brand colours as hardcoded hex, and have already drifted:
 * `crimson` is #6E0F2D (== royalBurgundy) in the dashboard theme but #C0392B
 * (danger red) in the reports theme — same key name, two different meanings.
 *
 * This codemod rewires the KNOWN, SPEC-MAPPED keys in each file's `T` (and
 * `F`) object to re-export from @/design-system/tokens, WITHOUT renaming any
 * key — every component that imports `T.taupe` or `F.mono` keeps working
 * unchanged. Only the 8 keys the design-system doc explicitly worked through
 * are touched automatically; everything else is left as a literal (no
 * behaviour change, just not yet tokenised — safe to extend later).
 *
 *   T.silkCream     → semantic.surface.canvas
 *   T.warmIvory     → semantic.surface.raised
 *   T.royalBurgundy → brand.burgundy[900]
 *   T.deepWine      → brand.burgundy[950]
 *   T.taupe         → semantic.text.tertiary   (was already #69635E post-codemod-01)
 *   T.antiqueGold   → brand.gold[500]
 *   T.green         → semantic.text.success
 *   T.crimson       → semantic.text.danger     (resolves the #6E0F2D/#C0392B drift)
 *
 *   F.display → fonts.display   F.ui → fonts.ui   F.mono → fonts.code
 *
 * Conventions: idempotent, --dry-run, --feature=<name>.
 *
 * Usage:
 *   node scripts/codemods/13-theme-reexport.mjs --dry-run
 *   node scripts/codemods/13-theme-reexport.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const featureArg = args.find((a) => a.startsWith("--feature="));
const feature = featureArg ? featureArg.split("=")[1] : null;

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
      } else if (e.name === "theme.ts" || e.name === "theme.tsx") {
        out.push(path.join(cur, e.name));
      }
    }
  }
  return out;
}

// key (as it appears in the T object) -> the expression that replaces its value
const T_KEY_MAP = {
  silkCream: "semantic.surface.canvas",
  warmIvory: "semantic.surface.raised",
  royalBurgundy: "brand.burgundy[900]",
  deepWine: "brand.burgundy[950]",
  taupe: "semantic.text.tertiary",
  antiqueGold: "brand.gold[500]",
  green: "semantic.text.success",
  crimson: "semantic.text.danger",
};

const F_KEY_MAP = {
  display: "fonts.display",
  ui: "fonts.ui",
  mono: "fonts.code",
};

/**
 * Extract the body of `export const <name> = { ... };` (first occurrence),
 * returning { before, body, after, found } so the body can be edited and
 * spliced back in place. Brace-counts from the opening `{` to handle nested
 * objects/values inside the block (e.g. G.hero's linear-gradient strings).
 */
function extractObjectBlock(content, varName) {
  const declRe = new RegExp(`(?:export\\s+)?const ${varName}(?:\\s*:[^=]+)?\\s*=\\s*\\{`);
  const m = declRe.exec(content);
  if (!m) return null;
  const openBraceIdx = m.index + m[0].length - 1;
  let depth = 0;
  let i = openBraceIdx;
  for (; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return null; // unbalanced — bail, don't touch this file
  const bodyStart = openBraceIdx + 1;
  const bodyEnd = i; // index of the matching closing brace
  return {
    before: content.slice(0, bodyStart),
    body: content.slice(bodyStart, bodyEnd),
    after: content.slice(bodyEnd),
  };
}

function replaceKeysInBlock(body, keyMap) {
  let changed = false;
  let out = body;
  for (const [key, expr] of Object.entries(keyMap)) {
    // Matches `  key:    "value",` or `  key: 'value'` (with or without
    // trailing comma), tolerant of the varying alignment whitespace seen
    // across these 21 files. Only matches a literal string value — if the
    // key already points at an identifier/expression (e.g. already
    // migrated, or a computed value), it's left untouched.
    const re = new RegExp(`(^|\\n)(\\s*${key}\\s*:\\s*)(["'])((?:(?!\\3).)*)\\3(\\s*,?)`, "g");
    const next = out.replace(re, (full, lead, prefix, _q, _val, trail) => {
      changed = true;
      return `${lead}${prefix}${expr}${trail}`;
    });
    out = next;
  }
  return { body: out, changed };
}

function ensureImport(content, names) {
  const importLine = `import { ${names.join(", ")} } from '@/design-system/tokens';`;
  // Already present in some form (don't duplicate)?
  if (new RegExp(`from ['"]@/design-system/tokens['"]`).test(content)) {
    // Merge missing names into the existing import instead of adding a second one.
    return content.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]@\/design-system\/tokens['"];?/,
      (full, existingNames) => {
        const have = new Set(existingNames.split(",").map((s) => s.trim()).filter(Boolean));
        for (const n of names) have.add(n);
        return `import { ${[...have].join(", ")} } from '@/design-system/tokens';`;
      }
    );
  }
  // Insert after the last top-of-file import statement, or at the very top.
  const importRe = /^import .+;\s*\n/gm;
  let lastImportEnd = 0;
  let m;
  while ((m = importRe.exec(content))) lastImportEnd = m.index + m[0].length;
  if (lastImportEnd > 0) {
    return content.slice(0, lastImportEnd) + importLine + "\n" + content.slice(lastImportEnd);
  }
  return importLine + "\n" + content;
}

const files = walk(TARGET_ROOT);
let filesChanged = 0;
let tKeysChanged = 0;
let fKeysChanged = 0;
const results = [];

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let content = original;
  let neededImports = new Set();

  const tBlock = extractObjectBlock(content, "T");
  if (tBlock) {
    const { body, changed } = replaceKeysInBlock(tBlock.body, T_KEY_MAP);
    if (changed) {
      content = tBlock.before + body + tBlock.after;
      neededImports.add("semantic");
      neededImports.add("brand");
      tKeysChanged++;
    }
  }

  const fBlock = extractObjectBlock(content, "F");
  if (fBlock) {
    const { body, changed } = replaceKeysInBlock(fBlock.body, F_KEY_MAP);
    if (changed) {
      content = fBlock.before + body + fBlock.after;
      neededImports.add("fonts");
      fKeysChanged++;
    }
  }

  if (neededImports.size > 0) {
    content = ensureImport(content, [...neededImports].sort());
  }

  if (content !== original) {
    filesChanged++;
    results.push(path.relative(SRC, file));
    if (!dryRun) {
      writeFileSync(file, content, "utf8");
    }
  }
}

console.log(`Codemod 13 — theme re-export ${dryRun ? "(dry run)" : ""}`);
console.log(`Scope: ${path.relative(SRC, TARGET_ROOT) || "src/features"}`);
console.log("");
console.log(`  files with T keys retokenised : ${tKeysChanged}`);
console.log(`  files with F keys retokenised : ${fKeysChanged}`);
console.log(`  total files changed           : ${filesChanged}`);
if (results.length) {
  console.log("\n  Changed files:");
  for (const r of results) console.log(`    ${r}`);
}

if (dryRun) {
  console.log("\nDry run — no files were written. Re-run without --dry-run to apply.");
}
