/**
 * BK LOOM DESIGN SYSTEM — PHASE 1 FOUNDATION TOKENS (TypeScript mirror)
 * Beere Keshava & Brothers
 *
 * WHY THIS FILE EXISTS
 * 412 of 507 components in this codebase use inline `style={{}}`. Those cannot
 * read Tailwind classes, and passing `var(--token)` into some of them (notably
 * Motion animations, Recharts `fill`/`stroke`, and canvas/SVG props) fails
 * because those consumers need a resolved colour value, not a CSS variable.
 *
 * This file is the literal-value mirror of `styles/tokens.css`. The two MUST be
 * kept in sync — if you change a value here, change it there.
 *
 * USAGE
 *   import { semantic, brand, type as t, space } from '@/design-system/tokens';
 *   <span style={{ color: semantic.text.tertiary, ...t.overline }}>Weaver</span>
 *   <Bar fill={semantic.chart.series[0]} />
 *
 * RULE
 *   Components consume `semantic.*`. `brand.*` / `neutral.*` are primitives —
 *   reach for them only when defining a new semantic token.
 *
 * Every colour is annotated with its measured WCAG 2.1 contrast ratio vs white.
 */

import type { CSSProperties } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   1. PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Primary brand ramp. 900 and 950 are the original brand colours, unchanged. */
export const burgundy = {
  50:  '#FEF4F5', //  1.08:1
  100: '#FEE8EB', //  1.17:1
  200: '#FFD1D8', //  1.37:1
  300: '#FCB2BE', //  1.71:1
  400: '#F18EA0', //  2.30:1
  500: '#E06580', //  3.31:1  min for borders / icons
  600: '#C54D69', //  4.53:1  min for body text
  700: '#A63A55', //  6.25:1  hover
  800: '#872D44', //  8.44:1  active
  900: '#6E0F2D', // 11.87:1  ★ BRAND PRIMARY
  950: '#4A061B', // 15.75:1  ★ deep wine
} as const;

/** Accent ramp. 500 is the brand gold — DECORATION ONLY, never a text colour. */
export const gold = {
  50:  '#FCF6EE', //  1.07:1
  100: '#F6EDDD', //  1.16:1
  200: '#EDDCC1', //  1.35:1
  300: '#E0C59A', //  1.66:1
  400: '#CEAA6D', //  2.19:1
  500: '#C89B47', //  2.55:1  ★ brand gold — surfaces/borders/fills only
  600: '#9F7315', //  4.25:1  large text minimum
  700: '#845E04', //  5.86:1  ★ GOLD TEXT
  800: '#6B4B01', //  7.98:1
  900: '#553B01', // 10.44:1
  950: '#392601', // 14.47:1
} as const;

/** Warm neutral substrate (hue 65°). Never blue-grey — it fights the cream. */
export const neutral = {
  0:   '#FFFDFB', //  1.01:1
  25:  '#FAF8F6', //  1.06:1  ★ page canvas
  50:  '#F5F2EE', //  1.12:1  ★ sunken / table header
  100: '#EAE5E1', //  1.25:1
  200: '#D8D2CE', //  1.50:1  ★ default border
  300: '#BFB9B4', //  1.94:1
  400: '#A09A94', //  2.78:1  placeholder / disabled
  500: '#847E79', //  4.01:1  ⚠ LARGE TEXT ONLY (>= 18.66px)
  600: '#69635E', //  5.92:1  ★ tertiary text — replaces the failing #8B7060
  700: '#4F4A45', //  8.76:1  ★ secondary text
  800: '#322D28', // 13.62:1
  900: '#1D1814', // 17.60:1  ★ primary text (AAA)
  950: '#110C08', // 19.45:1
} as const;

export const green = {
  50: '#F0FAF4', 100: '#E2F3E8', 200: '#C9E8D4', 300: '#A7D7B9', 400: '#7EC19A',
  500: '#4CA978', 600: '#319061', 700: '#1F774E', 800: '#15603D', 900: '#0F4C30', 950: '#07331E',
} as const; // 700 = 5.52:1

export const amber = {
  50: '#FEF6EC', 100: '#FBEBDA', 200: '#F6D9BA', 300: '#ECC18F', 400: '#DEA35B',
  500: '#CA8104', 600: '#AB6C00', 700: '#8D5802', 800: '#724701', 900: '#5B3700', 950: '#3D2300',
} as const; // 700 = 5.95:1

export const red = {
  50: '#FEF5F3', 100: '#FFE8E5', 200: '#FED3CD', 300: '#FFB3AA', 400: '#F78E83',
  500: '#E7645A', 600: '#CB4B43', 700: '#AB3832', 800: '#8C2B26', 900: '#70211D', 950: '#4C1311',
} as const; // 700 = 6.28:1

export const blue = {
  50: '#F1F8FE', 100: '#E1F0FE', 200: '#C5E3FD', 300: '#A0CFF8', 400: '#74B7EE',
  500: '#3E9AE0', 600: '#2082C6', 700: '#0A6AA7', 800: '#045588', 900: '#03446D', 950: '#012C4A',
} as const; // 700 = 5.78:1

export const brand = { burgundy, gold, neutral, green, amber, red, blue } as const;

/* ═══════════════════════════════════════════════════════════════════════════
   2. SEMANTIC LAYER — this is what components use
   ═══════════════════════════════════════════════════════════════════════════ */

export const semantic = {
  surface: {
    canvas:        neutral[25],
    raised:        '#FFFFFF',
    raisedHover:   neutral[25],
    sunken:        neutral[50],
    overlay:       '#FFFFFF',
    inverse:       neutral[900],
    brand:         burgundy[900],
    brandHover:    burgundy[800],
    brandActive:   burgundy[950],
    brandSubtle:   burgundy[50],
    accentSubtle:  gold[50],
    successSubtle: green[50],
    warningSubtle: amber[50],
    dangerSubtle:  red[50],
    infoSubtle:    blue[50],
    disabled:      neutral[100],
    scrim:         'rgba(29, 24, 20, 0.48)',
  },

  /** Ratios quoted against `surface.canvas`. */
  text: {
    primary:     neutral[900],  // 17.60:1  AAA
    secondary:   neutral[700],  //  8.76:1  AAA
    tertiary:    neutral[600],  //  5.92:1  AA   ★ table headers, labels, axis
    placeholder: neutral[400],  //  2.78:1  placeholder only
    disabled:    neutral[400],  //  2.78:1  exempt from AA
    brand:       burgundy[900], // 11.87:1  AAA
    brandHover:  burgundy[700], //  6.25:1
    accent:      gold[700],     //  5.86:1  ★ use instead of #C89B47 for TEXT
    success:     green[700],    //  5.52:1
    warning:     amber[700],    //  5.95:1
    danger:      red[700],      //  6.28:1
    info:        blue[700],     //  5.78:1
    onBrand:     '#FFFFFF',     // 11.87:1 on surface.brand
    onInverse:   neutral[25],
    link:        burgundy[900],
  },

  border: {
    subtle:  neutral[100],
    default: neutral[200],  // 1.50:1 — replaces rgba(0,0,0,.1) at 1.2:1
    strong:  neutral[300],
    brand:   burgundy[900],
    focus:   burgundy[700], // 6.25:1 — clears WCAG 1.4.11
    accent:  gold[500],
    success: green[600],
    warning: amber[600],
    danger:  red[600],
    info:    blue[600],
  },

  /**
   * Chart series. ASSIGN IN ORDER — never hand-pick.
   * Max 5 categorical series; group the tail into "Other".
   * Adjacent pairs alternate light/dark so they separate in greyscale and for
   * colour-vision deficiency. Measured adjacent separation: 1.60–2.66:1.
   * (The previous palette had #A0506A / #C0392B at 1.00:1 — identical luminance.)
   */
  chart: {
    series: [
      '#9A2D4A', // 1 burgundy  7.37:1
      '#BA8824', // 2 gold      3.17:1
      '#035181', // 3 blue      8.41:1
      '#C6739C', // 4 rose      3.32:1
      '#047879', // 5 teal      5.29:1
      '#969F59', // 6 olive     2.84:1
      '#754D9E', // 7 violet    6.34:1
      '#65B187', // 8 green     2.56:1
    ] as const,
    grid:      neutral[100],
    axis:      neutral[300],
    label:     neutral[600],
    tooltipBg: neutral[900],
    tooltipFg: neutral[25],
    /** Sequential — heatmaps, intensity. */
    sequential: [burgundy[100], burgundy[300], burgundy[500], burgundy[700], burgundy[900]] as const,
    /** Diverging — variance, profit & loss. */
    diverging:  [red[700], red[300], neutral[200], green[300], green[700]] as const,
  },
} as const;

/** Convenience: `chartColor(i)` wraps safely past the 8th series. */
export const chartColor = (i: number): string =>
  semantic.chart.series[i % semantic.chart.series.length];

/* ═══════════════════════════════════════════════════════════════════════════
   3. TYPOGRAPHY
   ═══════════════════════════════════════════════════════════════════════════ */

export const fonts = {
  display: "'Fraunces', 'Playfair Display', Georgia, serif",
  ui:      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  code:    "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
} as const;

export const weight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

/** Tabular figures — spread onto any element rendering numbers in a column. */
export const tabular: CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

/**
 * The type scale. Spread these directly into `style={{}}`.
 * NOTHING BELOW 12px. The old codebase used ~40 ad-hoc sizes
 * (10, 10.5, 11, 11.5, 13.5, 44, 60 …) — they all map into these 19 tokens.
 */
export const type = {
  display2xl: { fontFamily: fonts.display, fontSize: 60, fontWeight: 400, lineHeight: 1.0,  letterSpacing: '-0.03em' },
  displayXl:  { fontFamily: fonts.display, fontSize: 48, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em' },
  displayLg:  { fontFamily: fonts.display, fontSize: 38, fontWeight: 400, lineHeight: 1.1,  letterSpacing: '-0.02em' },
  displayMd:  { fontFamily: fonts.display, fontSize: 30, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.02em' },

  titleLg: { fontFamily: fonts.display, fontSize: 24, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.015em' },
  titleMd: { fontFamily: fonts.ui,      fontSize: 20, fontWeight: 600, lineHeight: 1.3,  letterSpacing: '-0.01em' },
  titleSm: { fontFamily: fonts.ui,      fontSize: 18, fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.01em' },

  bodyLg: { fontFamily: fonts.ui, fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
  bodyMd: { fontFamily: fonts.ui, fontSize: 14, fontWeight: 400, lineHeight: 1.5 },  // ★ default
  bodySm: { fontFamily: fonts.ui, fontSize: 13, fontWeight: 400, lineHeight: 1.45 },

  labelLg: { fontFamily: fonts.ui, fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
  labelMd: { fontFamily: fonts.ui, fontSize: 13, fontWeight: 500, lineHeight: 1.4 },
  labelSm: { fontFamily: fonts.ui, fontSize: 12, fontWeight: 500, lineHeight: 1.35, letterSpacing: '0.005em' },

  caption: { fontFamily: fonts.ui, fontSize: 12, fontWeight: 400, lineHeight: 1.4 },

  /**
   * ★ THE TABLE-HEADER FIX.
   * Replaces the old `10px / 500 / #8B7060 / letterSpacing 1px` pattern
   * (4.11:1 — fails AA) with `12px / 600 / #69635E` (5.92:1 — passes AA).
   * Pair with `color: semantic.text.tertiary`.
   */
  overline: {
    fontFamily: fonts.ui, fontSize: 12, fontWeight: 600, lineHeight: 1.3,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },

  /** Entity codes only: WV-002, BATCH-086, INV-…, PO-…, saree codes, HSN, GSTIN. */
  codeMd: { fontFamily: fonts.code, fontSize: 13, fontWeight: 500, lineHeight: 1.4,  letterSpacing: 0, ...tabular },
  codeSm: { fontFamily: fonts.code, fontSize: 12, fontWeight: 500, lineHeight: 1.35, letterSpacing: 0, ...tabular },

  /** Metrics — Inter with tabular figures, NOT the display serif. Faster to scan. */
  metricLg: { fontFamily: fonts.ui, fontSize: 30, fontWeight: 600, lineHeight: 1.1,  letterSpacing: '-0.02em',  ...tabular },
  metricMd: { fontFamily: fonts.ui, fontSize: 24, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.015em', ...tabular },
  metricSm: { fontFamily: fonts.ui, fontSize: 18, fontWeight: 600, lineHeight: 1.2,  letterSpacing: '-0.01em',  ...tabular },
} as const satisfies Record<string, CSSProperties>;

/* ═══════════════════════════════════════════════════════════════════════════
   4. SPACING — 4pt grid
   ═══════════════════════════════════════════════════════════════════════════ */

export const space = {
  0: 0, px: 1, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 4: 16,
  5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
} as const;

/** Semantic spacing — carries intent. Prefer these over raw `space`. */
export const layout = {
  gutterPageX:     48,
  gutterPageY:     32,
  gapCard:         24,
  gapSection:      40,
  padCard:         24,
  padCardCompact:  20,
  padCellX:        16,
  padCellY:        12,
  padCellYCompact: 8,
  gapStack:        12,
  gapInline:       8,

  containerMax:    1600,
  contentMeasure:  '65ch',
  /** WCAG 2.5.8 / Fitts's Law — minimum hit area for any interactive control. */
  targetMin:       44,

  /**
   * Single source of truth for chrome geometry. Stop hardcoding
   * `calc(100vh - 90px - 160px)` — see design-system/02-LAYOUT.md Part C.
   * Mirrors the --shell-* CSS custom properties in styles/tokens.css;
   * keep both in sync (checked by scripts/check-tokens.mjs).
   */
  navHeightTop:      72,   // --shell-topbar-h      (was MAIN_NAV_H 90)
  navHeightSub:      52,   // --shell-groupbar-h    (was SUB_NAV_H 66/60 — the bug)
  navHeightSection:  48,   // --shell-sectionbar-h  (was SECTION_NAV_H 56)
  navHeightMobile:   64,   // --shell-mobilenav-h   (was MOBILE_NAV_H 60)
  navRailWidth:      248,
  navRailCollapsed:  64,
  footerHeight:      64,   // --shell-footer-h

  rowHeightComfortable: 56,
  rowHeightDefault:     48,
  rowHeightCompact:     40,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   5. RADIUS — inner radius = outer radius − padding
   ═══════════════════════════════════════════════════════════════════════════ */

export const radius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, '3xl': 28, full: 9999,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   6. ELEVATION — warm-tinted (neutral-900), never pure black
   ═══════════════════════════════════════════════════════════════════════════ */

export const shadow = {
  xs:    '0 1px 2px rgba(29,24,20,0.05)',
  sm:    '0 1px 3px rgba(29,24,20,0.07), 0 1px 2px -1px rgba(29,24,20,0.06)',
  md:    '0 4px 8px -2px rgba(29,24,20,0.08), 0 2px 4px -2px rgba(29,24,20,0.06)',
  lg:    '0 12px 20px -6px rgba(29,24,20,0.10), 0 4px 8px -4px rgba(29,24,20,0.06)',
  xl:    '0 24px 40px -12px rgba(29,24,20,0.14), 0 8px 16px -8px rgba(29,24,20,0.08)',
  '2xl': '0 40px 64px -20px rgba(29,24,20,0.18)',
  inner: 'inset 0 1px 2px rgba(29,24,20,0.06)',
  brand: '0 4px 14px -4px rgba(110,15,45,0.28)',
  focus: '0 0 0 3px rgba(166,58,85,0.40)',
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   7. MOTION
   ═══════════════════════════════════════════════════════════════════════════ */

export const duration = {
  instant: 0.075, fast: 0.15, normal: 0.2, slow: 0.3, slower: 0.45,
} as const; // seconds — Motion's unit

export const easing = {
  standard:   [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1],
  /** Your existing `EASE`, preserved. */
  emphasized: [0.22, 1, 0.36, 1],
  spring:     [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/* ═══════════════════════════════════════════════════════════════════════════
   8. Z-INDEX
   ═══════════════════════════════════════════════════════════════════════════ */

export const z = {
  base: 0, raised: 10, sticky: 100, nav: 200, dropdown: 300,
  overlay: 400, modal: 500, popover: 600, toast: 700, tooltip: 800,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   9. BREAKPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

export const breakpoint = {
  xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536,
} as const;

export const mq = {
  sm:   `@media (min-width: ${breakpoint.sm}px)`,
  md:   `@media (min-width: ${breakpoint.md}px)`,
  lg:   `@media (min-width: ${breakpoint.lg}px)`,
  xl:   `@media (min-width: ${breakpoint.xl}px)`,
  '2xl': `@media (min-width: ${breakpoint['2xl']}px)`,
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   10. STATUS TRIAD HELPER
   Every status chip in the app uses the same triad: -50 bg, -200 border,
   -700 text. Guaranteed AA. Phase 6 maps your domain statuses onto these.
   ═══════════════════════════════════════════════════════════════════════════ */

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export const statusTone: Record<StatusTone, { bg: string; border: string; fg: string }> = {
  neutral: { bg: neutral[50],  border: neutral[200],  fg: neutral[700] },
  brand:   { bg: burgundy[50], border: burgundy[200], fg: burgundy[900] },
  success: { bg: green[50],    border: green[200],    fg: green[700] },
  warning: { bg: amber[50],    border: amber[200],    fg: amber[700] },
  danger:  { bg: red[50],      border: red[200],      fg: red[700] },
  info:    { bg: blue[50],     border: blue[200],     fg: blue[700] },
};

/* ═══════════════════════════════════════════════════════════════════════════
   11. CONTRAST UTILITY — for tests and the token preview page
   ═══════════════════════════════════════════════════════════════════════════ */

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two hex colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * WCAG conformance for a foreground/background pair.
 * `large` = >= 18.66px bold or >= 24px regular.
 */
export function wcagLevel(fg: string, bg: string, large = false): 'AAA' | 'AA' | 'AA-large' | 'fail' {
  const r = contrastRatio(fg, bg);
  if (r >= 7) return 'AAA';
  if (r >= 4.5) return 'AA';
  if (large && r >= 3) return 'AA-large';
  return 'fail';
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. DEPRECATION MAP
   Old value → new token. Used by the Phase 8 codemod; useful as a lookup now.
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEPRECATED: Record<string, { replaceWith: string; reason: string }> = {
  '#8B7060': { replaceWith: 'semantic.text.tertiary (#69635E)', reason: '4.11:1 — fails WCAG AA for body text' },
  '#C4923A': { replaceWith: 'semantic.text.accent (#845E04) for text; brand.gold[500] for fills', reason: '2.6:1 as text' },
  '#E8A84A': { replaceWith: 'semantic.text.accent (#845E04)',   reason: 'fails AA as text' },
  '#E7C983': { replaceWith: 'brand.gold[300] — decorative only', reason: '1.44:1 — invisible as text' },
  '#F5E8D0': { replaceWith: 'brand.gold[100] — surface only',    reason: '1.09:1 — invisible as text' },
  '#A0506A': { replaceWith: 'semantic.chart.series[3] (#C6739C)', reason: '1.00:1 against #C0392B — indistinguishable series' },
  '#C0392B': { replaceWith: 'semantic.text.danger (#AB3832)',     reason: 'marginal 4.88:1; inconsistent with the reports theme' },
  'rgba(0, 0, 0, 0.1)': { replaceWith: 'semantic.border.default (#D8D2CE)', reason: '1.2:1 — fails WCAG 1.4.11 non-text contrast' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */

export const tokens = {
  brand, semantic, fonts, weight, type, tabular, space, layout,
  radius, shadow, duration, easing, z, breakpoint, mq, statusTone,
} as const;

export default tokens;
