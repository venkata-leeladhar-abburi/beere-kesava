/**
 * Design gallery — Foundations section (design-system/08-GOVERNANCE.md Part G).
 * ═══════════════════════════════════════════════════════════════════════════
 * "The Foundations → Colour page renders every token with its computed ratio
 * against its intended background, recomputed in the browser — so a bad
 * colour is visible immediately, not just in CI."
 *
 * Every value on this page is read live from the real source of truth:
 *   - Colour   → src/styles/tokens.css, parsed + WCAG-scored by ./contrast.ts
 *               (a browser port of scripts/check-contrast.mjs)
 *   - Type     → src/design-system/tokens.ts (`fonts`, `type`)
 *   - Spacing  → src/design-system/tokens.ts (`space`)
 *   - Radius   → src/design-system/tokens.ts (`radius`)
 *   - Elevation→ src/design-system/tokens.ts (`shadow`)
 *   - Motion   → src/design-system/tokens.ts (`duration`, `easing`) — the only
 *                formal motion tokens that exist; there is no separate
 *                CSS-var motion export beyond what tokens.ts mirrors
 *   - Icons    → src/shared/ui/primitives/icons.ts (`Icons` registry)
 * Nothing here is a hardcoded/fabricated number — change a token and this
 * page changes with it.
 */
import { useMemo, type CSSProperties } from "react";
import { contrastRatio, tokensWithPrefix, tv, isHexColor } from "./contrast";
import * as designTokens from "../../../design-system/tokens";
import { Icons, ICON_SIZE, type IconName } from "../primitives/icons";

const { fonts, space, radius, shadow, duration, easing } = designTokens;
// `type` is a reserved-ish import specifier for TS (`import { type X }` is parsed as a
// type-only import modifier), so the type scale is pulled off the namespace import instead.
const typeScale = designTokens.type;

/* ── shared layout bits ───────────────────────────────────────────────── */

const sectionStyle: CSSProperties = { marginBottom: 56, scrollMarginTop: 24 };
const headingStyle: CSSProperties = {
  fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--text-primary, #1D1814)",
  fontFamily: "var(--font-display)",
};
const subStyle: CSSProperties = {
  fontSize: 13, color: "var(--text-secondary, #4F4A45)", marginBottom: 20, maxWidth: 720, lineHeight: 1.5,
};
const cardGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 };
const card: CSSProperties = {
  border: "1px solid var(--border-default, #D8D2CE)", borderRadius: 10, padding: 12,
  background: "var(--surface-raised, #fff)", display: "flex", flexDirection: "column", gap: 8,
};
const mono: CSSProperties = { fontFamily: "var(--font-code)", fontSize: 11 };

function Nav() {
  const items: Array<[string, string]> = [
    ["colour", "Colour"], ["type", "Type"], ["spacing", "Spacing"],
    ["radius", "Radius"], ["elevation", "Elevation"], ["motion", "Motion"], ["icons", "Icons"],
  ];
  return (
    <nav aria-label="Foundations sections" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32 }}>
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          style={{
            fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999,
            border: "1px solid var(--border-default, #D8D2CE)", color: "var(--text-secondary, #4F4A45)",
            textDecoration: "none", background: "var(--surface-sunken, #F5F2EE)",
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

/* ── Colour ────────────────────────────────────────────────────────────── */

type CheckRow = { token: string; hex: string; against: string; againstHex: string; ratio: number | null; min: number; kind: "text" | "non-text" };

const CANVAS = tv("--surface-canvas");

// Same pairs scripts/check-contrast.mjs gates in CI.
const TEXT_CHECKS = [
  "--text-primary", "--text-secondary", "--text-tertiary", "--text-accent",
  "--text-success", "--text-warning", "--text-danger", "--text-info", "--text-brand",
];
const NON_TEXT_CHECKS: Array<[string, string, number]> = [["--border-focus", "#FFFFFF", 3.0]];
const CHART_SERIES = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6", "--chart-7", "--chart-8"];

function useColourData() {
  return useMemo(() => {
    const gated: CheckRow[] = TEXT_CHECKS.map((name) => {
      const hex = tv(name);
      return { token: name, hex, against: "--surface-canvas", againstHex: CANVAS, ratio: contrastRatio(hex, CANVAS), min: 4.5, kind: "text" as const };
    });
    for (const [name, bgHex, min] of NON_TEXT_CHECKS) {
      const hex = tv(name);
      gated.push({ token: name, hex, against: "#FFFFFF", againstHex: bgHex, ratio: contrastRatio(hex, bgHex), min, kind: "non-text" });
    }

    const seriesHex = CHART_SERIES.map((t) => tv(t));
    const seriesPairs = seriesHex.slice(0, -1).map((hex, i) => ({
      a: CHART_SERIES[i], b: CHART_SERIES[i + 1], ratio: contrastRatio(hex, seriesHex[i + 1]),
    }));

    // Informational — primitive ramps, quoted vs white (matches the comments
    // already annotated next to each --bk-* declaration in tokens.css).
    const ramps = ["burgundy", "gold", "neutral", "green", "amber", "red", "blue"].map((ramp) => ({
      ramp,
      shades: tokensWithPrefix(`--bk-${ramp}-`)
        .filter((name) => isHexColor(tv(name)))
        .sort((a, b) => {
          const na = Number(a.split("-").pop());
          const nb = Number(b.split("-").pop());
          return na - nb;
        })
        .map((name) => ({ token: name, hex: tv(name), ratio: contrastRatio(tv(name), "#FFFFFF") })),
    }));

    return { gated, seriesPairs, ramps };
  }, []);
}

function RatioBadge({ ratio, min, ok }: { ratio: number | null; min: number; ok: boolean }) {
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
        background: ok ? "var(--surface-success-subtle, #E2F3E8)" : "var(--surface-danger-subtle, #FFE8E5)",
        color: ok ? "var(--text-success, #1F774E)" : "var(--text-danger, #AB3832)",
      }}
    >
      {ratio === null ? "N/A" : `${ratio.toFixed(2)}:1`} {ok ? "PASS" : "FAIL"} · min {min.toFixed(1)}:1
    </span>
  );
}

function ColourSection() {
  const { gated, seriesPairs, ramps } = useColourData();
  return (
    <section id="colour" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Colour</h2>
      <p style={subStyle}>
        Every ratio below is computed in this browser, right now, from <code style={mono}>src/styles/tokens.css</code>{" "}
        (parsed + resolved the same way <code style={mono}>scripts/check-contrast.mjs</code> does for CI) — nothing
        here is a hardcoded number copied from a comment.
      </p>

      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Text &amp; non-text — gated (CI: check:contrast)</h3>
      <div style={cardGrid}>
        {gated.map((row) => {
          const ok = row.ratio !== null && row.ratio >= row.min;
          return (
            <div key={row.token} style={card}>
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-subtle, #EAE5E1)" }}>
                <div style={{ flex: 1, height: 48, background: row.againstHex, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: row.hex, fontWeight: 700, fontSize: row.kind === "text" ? 15 : 12 }}>
                    {row.kind === "text" ? "Aa" : "▭ border"}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{row.token}</div>
              <div style={mono}>{row.hex} vs {row.against} ({row.againstHex})</div>
              <RatioBadge ratio={row.ratio} min={row.min} ok={ok} />
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "24px 0 10px" }}>Chart series — adjacent separation (guideline, ≥1.5:1)</h3>
      <div style={cardGrid}>
        {seriesPairs.map((p) => {
          const ok = p.ratio !== null && p.ratio >= 1.5;
          return (
            <div key={`${p.a}-${p.b}`} style={card}>
              <div style={{ display: "flex", height: 32, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ flex: 1, background: tv(p.a) }} />
                <div style={{ flex: 1, background: tv(p.b) }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{p.a} / {p.b}</div>
              <span
                style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, width: "fit-content",
                  background: ok ? "var(--surface-success-subtle, #E2F3E8)" : "var(--surface-warning-subtle, #FBEBDA)",
                  color: ok ? "var(--text-success, #1F774E)" : "var(--text-warning, #8D5802)",
                }}
              >
                {p.ratio === null ? "N/A" : `${p.ratio.toFixed(2)}:1`} {ok ? "OK" : "below guideline"}
              </span>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "24px 0 10px" }}>Primitive ramps (reference — vs white, decorative use only)</h3>
      {ramps.map(({ ramp, shades }) => (
        <div key={ramp} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize", marginBottom: 6, color: "var(--text-tertiary, #69635E)" }}>{ramp}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {shades.map((s) => (
              <div key={s.token} title={`${s.token} · ${s.hex} · ${s.ratio?.toFixed(2)}:1 vs white`} style={{ width: 84 }}>
                <div style={{ height: 44, background: s.hex, borderRadius: 6, border: "1px solid var(--border-subtle, #EAE5E1)" }} />
                <div style={{ fontSize: 9.5, ...mono, marginTop: 3 }}>{s.token.replace(`--bk-${ramp}-`, "")}</div>
                <div style={{ fontSize: 9.5, ...mono, color: "var(--text-tertiary, #69635E)" }}>{s.ratio?.toFixed(2)}:1</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ── Type ──────────────────────────────────────────────────────────────── */

const TYPE_SAMPLES: Array<[keyof typeof typeScale, string]> = [
  ["display2xl", "Aa Gg — display 2xl"],
  ["titleLg", "Aa Gg — title lg"],
  ["bodyMd", "The quick brown fox jumps — body md"],
  ["labelSm", "TABLE HEADER LABEL"],
  ["codeMd", "WV-002 / BATCH-086"],
  ["metricLg", "₹12,48,900"],
];

function TypeSection() {
  return (
    <section id="type" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Type</h2>
      <p style={subStyle}>Families and a slice of the scale, both read live from <code style={mono}>src/design-system/tokens.ts</code>.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        {(["display", "ui", "code"] as const).map((f) => (
          <div key={f} style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-tertiary, #69635E)" }}>{`F.${f}`}</div>
            <div style={{ fontFamily: fonts[f], fontSize: 22 }}>Beere Keshava &amp; Brothers</div>
            <div style={mono}>{fonts[f]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {TYPE_SAMPLES.map(([key, sample]) => {
          const style = typeScale[key] as CSSProperties;
          return (
            <div key={key} style={{ ...card, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={style}>{sample}</div>
              <div style={{ ...mono, textAlign: "right", flexShrink: 0 }}>
                type.{key} · {style.fontSize}px / {style.fontWeight}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Spacing ───────────────────────────────────────────────────────────── */

function SpacingSection() {
  const entries = Object.entries(space) as Array<[string, number]>;
  return (
    <section id="spacing" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Spacing</h2>
      <p style={subStyle}>4pt grid, from <code style={mono}>space</code> in <code style={mono}>src/design-system/tokens.ts</code>.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map(([key, px]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 64, ...mono, fontSize: 11 }}>space.{key}</div>
            <div style={{ height: 14, width: Math.max(px, 1), background: "var(--surface-brand, #6E0F2D)", borderRadius: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: "var(--text-tertiary, #69635E)" }}>{px}px</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Radius ────────────────────────────────────────────────────────────── */

function RadiusSection() {
  const entries = Object.entries(radius) as Array<[string, number]>;
  return (
    <section id="radius" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Radius</h2>
      <p style={subStyle}>From <code style={mono}>radius</code> in <code style={mono}>src/design-system/tokens.ts</code>.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {entries.map(([key, px]) => (
          <div key={key} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72, height: 72, background: "var(--surface-brand-subtle, #FEF4F5)",
                border: "2px solid var(--border-brand, #6E0F2D)",
                borderRadius: Math.min(px, 36),
              }}
            />
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>radius.{key}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary, #69635E)" }}>{px === 9999 ? "full" : `${px}px`}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Elevation ─────────────────────────────────────────────────────────── */

function ElevationSection() {
  const entries = Object.entries(shadow) as Array<[string, string]>;
  return (
    <section id="elevation" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Elevation</h2>
      <p style={subStyle}>From <code style={mono}>shadow</code> in <code style={mono}>src/design-system/tokens.ts</code>. Warm-tinted, never pure black.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 28, padding: "8px 0" }}>
        {entries.map(([key, boxShadow]) => (
          <div key={key} style={{ textAlign: "center" }}>
            <div style={{ width: 100, height: 64, margin: "0 auto", background: "var(--surface-raised, #fff)", borderRadius: 10, boxShadow }} />
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 10 }}>shadow.{key}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Motion ────────────────────────────────────────────────────────────── */

function MotionSection() {
  const durations = Object.entries(duration) as Array<[string, number]>;
  const easings = Object.entries(easing) as Array<[string, [number, number, number, number]]>;

  return (
    <section id="motion" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Motion</h2>
      <p style={subStyle}>
        From <code style={mono}>duration</code> / <code style={mono}>easing</code> in{" "}
        <code style={mono}>src/design-system/tokens.ts</code> (the CSS mirrors, <code style={mono}>--duration-*</code> /{" "}
        <code style={mono}>--ease-*</code>, live in <code style={mono}>src/styles/tokens.css</code>). Hover a row — the
        chip slides using that exact duration + easing curve. Pure CSS <code style={mono}>:hover</code>, no JS state,
        so this stays a native interactive affordance rather than a div click handler.
      </p>
      <style>{`
        .gallery-motion-track { position: relative; flex: 1; height: 24px; background: var(--surface-sunken, #F5F2EE); border-radius: 999px; }
        .gallery-motion-dot {
          position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%;
          background: var(--surface-brand, #6E0F2D); transform: translateX(0);
        }
        .gallery-motion-row:hover .gallery-motion-dot { transform: translateX(calc(100% * 8)); }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {easings.map(([ekey, curve]) => {
          const dkey = "normal";
          const seconds = duration[dkey as keyof typeof duration];
          return (
            <div
              key={ekey}
              className="gallery-motion-row"
              style={{ ...card, flexDirection: "row", alignItems: "center", gap: 16, height: 56 }}
            >
              <div style={{ width: 150, fontSize: 12, fontWeight: 600 }}>
                easing.{ekey}
                <div style={mono}>duration.{dkey} · {Math.round(seconds * 1000)}ms</div>
              </div>
              <div className="gallery-motion-track">
                <div
                  className="gallery-motion-dot"
                  style={{ transition: `transform ${seconds}s cubic-bezier(${curve.join(",")})` }}
                />
              </div>
              <div style={mono}>cubic-bezier({curve.join(", ")})</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        {durations.map(([dkey, seconds]) => (
          <span key={dkey} style={{ ...mono, fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "var(--surface-sunken, #F5F2EE)" }}>
            duration.{dkey} = {Math.round(seconds * 1000)}ms
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────── */

function IconsSection() {
  const names = Object.keys(Icons) as IconName[];
  return (
    <section id="icons" style={sectionStyle} data-section>
      <h2 style={headingStyle}>Icons</h2>
      <p style={subStyle}>
        Every entry in the <code style={mono}>Icons</code> registry — <code style={mono}>src/shared/ui/primitives/icons.ts</code> — {names.length} total.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
        {names.map((name) => {
          const IconComp = Icons[name];
          return (
            <div key={name} style={{ ...card, alignItems: "center", textAlign: "center", gap: 6 }}>
              <IconComp size={ICON_SIZE.lg} strokeWidth={2} color="var(--text-primary, #1D1814)" aria-hidden="true" />
              <div style={{ fontSize: 10.5, wordBreak: "break-word" }}>{name}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Root ──────────────────────────────────────────────────────────────── */

export function GalleryFoundations() {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-display)" }}>Foundations</h1>
      <p style={{ ...subStyle, marginBottom: 24 }}>
        colour · type · spacing · radius · elevation · motion · icons — design-system/08-GOVERNANCE.md Part G.
      </p>
      <Nav />
      <ColourSection />
      <TypeSection />
      <SpacingSection />
      <RadiusSection />
      <ElevationSection />
      <MotionSection />
      <IconsSection />
    </div>
  );
}
