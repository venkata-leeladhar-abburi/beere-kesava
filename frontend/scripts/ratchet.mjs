#!/usr/bin/env node
/**
 * BK Loom design-system ratchet.
 * ═══════════════════════════════════════════════════════════════════════════
 * Measures the counted metrics from design-system/00-ROADMAP.md against the
 * live codebase, writes design-system/RATCHET.md, and prints a progress
 * summary.
 *
 * Pure Node — no dependency on a `rg`/ripgrep binary being on PATH, so this
 * runs identically on any dev machine and in CI.
 *
 * A metric only ever moves toward its target between commits — this script
 * doesn't enforce that (see the Phase 8 CI job for the enforcing half), it
 * just measures and reports.
 *
 * Run: npm run ratchet   (from frontend/)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const SRC = path.resolve(import.meta.dirname, "..", "src");
const RATCHET_MD = path.join(ROOT, "design-system", "RATCHET.md");

const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "_legacy"]);

/**
 * Walk `dir` (relative to SRC unless absolute) yielding absolute file paths
 * whose basename matches one of `globs` (simple `*.ext` / `**` prefix forms
 * — just enough for this script's needs, not a general glob engine).
 */
function walk(dir, exts) {
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
      } else if (exts.some((ext) => e.name.endsWith(ext))) {
        out.push(path.join(cur, e.name));
      }
    }
  }
  return out;
}

function readAll(files) {
  return files.map((f) => {
    try {
      return { file: f, content: readFileSync(f, "utf8") };
    } catch {
      return { file: f, content: "" };
    }
  });
}

// Cache the two file sets every metric draws from.
const FEATURES_DIR = path.join(SRC, "features");
const featureTsx = readAll(walk(FEATURES_DIR, [".tsx"]));
const featureTs = readAll(walk(FEATURES_DIR, [".ts", ".tsx"]));
const allStyleFiles = readAll(walk(SRC, [".css"]));
const allTsxFiles = readAll(walk(SRC, [".tsx"]));

function countMatchesIn(fileSet, pattern) {
  const re = new RegExp(pattern, "g");
  let total = 0;
  for (const { content } of fileSet) {
    const m = content.match(re);
    if (m) total += m.length;
  }
  return total;
}

function countFilesIn(fileSet, pattern) {
  const re = new RegExp(pattern);
  let total = 0;
  for (const { content } of fileSet) {
    if (re.test(content)) total++;
  }
  return total;
}

function distinctMatches(fileSet, pattern) {
  const re = new RegExp(pattern, "g");
  const set = new Set();
  for (const { content } of fileSet) {
    const m = content.match(re);
    if (m) for (const x of m) set.add(x);
  }
  return set.size;
}

// ─────────────────────────────────────────────────────────────────────────
// Metric definitions. `measure` returns the current count.
// `higherIsBetter` flips the progress-bar direction for inverse metrics
// (e.g. aria-* attributes, role="dialog", toast calls — these should GROW).
// ─────────────────────────────────────────────────────────────────────────
const METRICS = [
  // ── Phase 1: Foundations ──────────────────────────────────────────────
  {
    id: "hex-8B7060",
    label: "#8B7060 occurrences",
    phase: 1,
    baseline: 88,
    target: 0,
    measure: () => countMatchesIn(featureTs, "#8B7060"),
  },
  {
    id: "gold-as-color",
    label: "gold used as color:",
    phase: 1,
    baseline: 10,
    target: 0,
    measure: () =>
      countMatchesIn(
        featureTs,
        'color:\\s*"#C89B47"|color:\\s*"#C4923A"|color:\\s*"#E8A84A"'
      ),
  },
  {
    id: "fontsize-below-12",
    label: "fontSize below 12",
    phase: 1,
    baseline: 1716,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "fontSize:\\s*(8|9|10|11)(\\.[0-9])?[,}]"),
  },
  {
    id: "font-families",
    label: "font families in fonts.css",
    phase: 1,
    baseline: 9,
    target: 3,
    measure: () => {
      const fontsCss = allStyleFiles.find((f) => f.file.endsWith("fonts.css"));
      if (!fontsCss) return 0;
      const matches = fontsCss.content.match(/family=([A-Za-z+]+)/g) || [];
      return new Set(matches).size;
    },
  },
  {
    // Files still exist by design (the Step 1.4 pattern re-exports from
    // @/design-system/tokens with unchanged keys, rather than deleting the
    // file — every existing `T.taupe` / `F.mono` call site keeps working).
    // What this metric actually tracks is adoption: how many of the
    // theme.ts/theme.tsx files still hardcode the 8 spec-mapped brand hex
    // values instead of re-exporting them.
    id: "local-theme-files",
    label: "theme files not yet re-exported",
    phase: 1,
    baseline: 21,
    target: 0,
    measure: () => {
      const files = walk(FEATURES_DIR, [".ts", ".tsx"]).filter((f) =>
        ["theme.ts", "theme.tsx"].includes(path.basename(f))
      );
      let notReexported = 0;
      for (const f of files) {
        const content = readFileSync(f, "utf8");
        const hasReexportImport = /from ['"]@\/design-system\/tokens['"]/.test(content);
        if (!hasReexportImport) notReexported++;
      }
      return notReexported;
    },
  },

  // ── Phase 2: Layout ────────────────────────────────────────────────────
  {
    id: "100vh",
    label: "100vh occurrences",
    phase: 2,
    baseline: 55,
    target: 0,
    measure: () => countMatchesIn(allTsxFiles, "100vh") + countMatchesIn(allStyleFiles, "100vh"),
  },
  {
    id: "nav-height-constants",
    label: "nav height constants",
    phase: 2,
    baseline: 9,
    target: 4,
    measure: () => countMatchesIn(allTsxFiles, "_NAV_H\\s*=|_HEADER_H\\s*="),
  },

  // ── Phase 3: Primitives ────────────────────────────────────────────────
  {
    id: "raw-button",
    label: "raw <button>",
    phase: 3,
    baseline: 752,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "<button\\b"),
  },
  {
    id: "motion-button",
    label: "motion.button",
    phase: 3,
    baseline: 248,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "<motion\\.button"),
  },
  {
    id: "raw-input",
    label: "raw <input>",
    phase: 3,
    baseline: 270,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "<input\\b"),
  },
  {
    id: "raw-select",
    label: "raw <select>",
    phase: 3,
    baseline: 85,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "<select\\b"),
  },
  {
    id: "icon-libraries",
    label: "icon libraries",
    phase: 3,
    baseline: 2,
    target: 1,
    measure: () => {
      let n = 0;
      if (countFilesIn(featureTsx, "lucide-react") > 0) n++;
      if (countFilesIn(featureTsx, "@phosphor-icons") > 0) n++;
      return n;
    },
  },

  // ── Phase 4: Data display ─────────────────────────────────────────────
  {
    id: "raw-table",
    label: "raw <table>",
    phase: 4,
    baseline: 65,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "<table\\b"),
  },
  {
    id: "grid-as-table",
    label: "grid-as-table",
    phase: 4,
    baseline: 262,
    target: 60,
    measure: () => countMatchesIn(featureTsx, 'gridTemplateColumns:\\s*"[0-9a-zA-Z.,\\s]*fr'),
  },
  {
    id: "th-below-12px",
    label: "th below 12px",
    phase: 4,
    baseline: 30,
    target: 0,
    // Structural <th> font-size extraction isn't reliable with regex alone;
    // tracked manually until the Phase 4 DataTable migration lands, at which
    // point this metric becomes "raw <th> outside shared/ui/data" → 0.
    measure: () => null,
  },
  {
    id: "th-using-mono",
    label: "th using mono",
    phase: 4,
    baseline: 25,
    target: 0,
    measure: () => null,
  },

  // ── Phase 5: Overlays ──────────────────────────────────────────────────
  {
    id: "role-dialog",
    label: 'role="dialog"',
    phase: 5,
    baseline: 0,
    target: 63,
    higherIsBetter: true,
    measure: () => countMatchesIn(featureTsx, 'role="dialog"'),
  },
  {
    id: "escape-handlers",
    label: "Escape handlers",
    phase: 5,
    baseline: 0,
    target: 63,
    higherIsBetter: true,
    measure: () => countMatchesIn(featureTsx, "['\"]Escape['\"]"),
  },
  {
    id: "zindex-1000plus",
    label: "zIndex >= 1000",
    phase: 5,
    baseline: 40,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "zIndex:\\s*[0-9]{4,}"),
  },
  {
    id: "scrims",
    label: "rgba(0,0,0,0.x) scrims",
    phase: 5,
    baseline: 150,
    target: 1,
    measure: () => countMatchesIn(featureTsx, "rgba\\(0,\\s*0,\\s*0,\\s*0\\.[0-9]+\\)"),
  },
  {
    id: "native-date",
    label: 'native type="date"',
    phase: 5,
    baseline: 14,
    target: 0,
    measure: () => countMatchesIn(featureTsx, 'type="date"'),
  },
  {
    id: "toast-calls",
    label: "toast call sites",
    phase: 5,
    baseline: 12,
    target: 100,
    higherIsBetter: true,
    measure: () => countMatchesIn(featureTsx, "toast\\.[a-z]+\\("),
  },

  // ── Phase 6: Domain ────────────────────────────────────────────────────
  {
    id: "fontfamily-mono",
    label: "fontFamily: F.mono",
    phase: 6,
    baseline: 1206,
    target: 150,
    measure: () => countMatchesIn(featureTsx, "fontFamily:\\s*F\\.mono"),
  },
  {
    id: "rupee-literals",
    label: "rupee literals",
    phase: 6,
    baseline: 624,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "₹"),
  },
  {
    id: "status-literals",
    label: "distinct status literals",
    phase: 6,
    baseline: 52,
    target: 0,
    measure: () => distinctMatches(featureTs, 'status:\\s*"[a-zA-Z ]*"'),
  },

  // ── Phase 7: Documents ─────────────────────────────────────────────────
  {
    id: "window-print",
    label: "window.print()",
    phase: 7,
    baseline: 6,
    target: 0,
    measure: () => countMatchesIn(featureTsx, "window\\.print\\(\\)"),
  },
  {
    id: "media-print",
    label: "@media print rules",
    phase: 7,
    baseline: 0,
    target: 1,
    higherIsBetter: true,
    measure: () =>
      countMatchesIn(allStyleFiles, "@media print") + countMatchesIn(allTsxFiles, "@media print"),
  },
];

function bar(pct, width = 10) {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(Math.max(0, Math.min(width, filled))) + "░".repeat(width - filled);
}

function progressPct(m, current) {
  if (current === null) return null;
  const { baseline, target, higherIsBetter } = m;
  if (higherIsBetter) {
    if (target === baseline) return 100;
    return Math.max(0, Math.min(100, ((current - baseline) / (target - baseline)) * 100));
  }
  if (baseline === target) return 100;
  return Math.max(0, Math.min(100, ((baseline - current) / (baseline - target)) * 100));
}

function isDone(m, current) {
  if (current === null) return false;
  return m.higherIsBetter ? current >= m.target : current <= m.target;
}

console.log("Measuring BK Loom ratchet metrics against frontend/src …\n");

const results = METRICS.map((m) => {
  const current = m.measure();
  const pct = progressPct(m, current);
  const done = isDone(m, current);
  return { ...m, current, pct, done };
});

// ── Print console summary ──────────────────────────────────────────────
const byPhase = {};
for (const r of results) {
  (byPhase[r.phase] ??= []).push(r);
}

console.log("BK LOOM RATCHET".padEnd(50) + new Date().toISOString().slice(0, 10));
console.log("");
for (const phase of Object.keys(byPhase).sort((a, b) => a - b)) {
  console.log(`PHASE ${phase}`);
  for (const r of byPhase[phase]) {
    const arrow = r.higherIsBetter ? "↑" : "→";
    const status =
      r.current === null
        ? "manual"
        : r.done
          ? "✓ done"
          : `${Math.round(r.pct)}%`;
    const currentStr = r.current === null ? "n/a" : r.current;
    const line = `  ${r.label.padEnd(28)} ${String(r.baseline).padStart(6)} ${arrow} ${String(
      r.target
    ).padStart(6)}   ${r.current === null ? " ".repeat(10) : bar(r.pct)}  ${status.padEnd(7)} (now: ${currentStr})`;
    console.log(line);
  }
  console.log("");
}

const measured = results.filter((r) => r.current !== null);
const doneCount = measured.filter((r) => r.done).length;
console.log(
  `${results.length} metrics · ${doneCount} at target · ${measured.length - doneCount} in progress · ${
    results.length - measured.length
  } manual`
);

// ── Write RATCHET.md ────────────────────────────────────────────────────
let md = `# BK Loom Ratchet\n\n`;
md += `Auto-generated by \`frontend/scripts/ratchet.mjs\`. Run \`npm run ratchet\` to refresh.\n`;
md += `Last measured: ${new Date().toISOString()}\n\n`;
md += `| Metric | Baseline | Current | Target | Phase | Status |\n`;
md += `|---|---|---|---|---|---|\n`;
for (const r of results) {
  const status = r.current === null ? "manual" : r.done ? "✅ at target" : `${Math.round(r.pct)}%`;
  const currentStr = r.current === null ? "—" : r.current;
  md += `| ${r.label} | ${r.baseline} | ${currentStr} | ${r.target} | ${r.phase} | ${status} |\n`;
}

writeFileSync(RATCHET_MD, md, "utf8");
console.log(`\nWrote ${path.relative(ROOT, RATCHET_MD)}`);
