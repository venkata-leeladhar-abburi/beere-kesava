import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Camera, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { C, F } from "./theme";
import { Button, Input } from "../../../../shared/ui/primitives";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

/**
 * Shared counter-flow kit for the Shop Staff portal — used by New Sale,
 * Retail Return and Wholesale Return so all three multi-step flows behave
 * identically.
 *
 * The principles it encodes, which the three hand-rolled flows each broke in
 * a different way before:
 *
 *  · One visible step at a time, with a stepper that shows position and how
 *    much is left (progressive disclosure).
 *  · Completed steps carry a one-line summary and are clickable to return to
 *    — you never have to remember what you entered two screens ago, and going
 *    back is never destructive (recognition over recall + reversibility).
 *  · The primary action is genuinely `disabled` until the step is valid, and
 *    says WHY in a hint line. The old flows painted the button grey with
 *    `cursor:not-allowed` but left it clickable and keyboard-focusable.
 *  · Back-left / forward-right action bar in the same place on every step
 *    (spatial consistency).
 *  · One accent colour per flow, passed in — burgundy sells, crimson returns,
 *    gold wholesale — so the operator always knows which flow they are in.
 */

export type FlowAccent = {
  /** Solid accent — primary buttons, active step, focus rings. */
  base: string;
  /** Darker press/hover state. */
  deep: string;
  /** Tinted surface for selected cards and soft banners. */
  soft: string;
  /** Border for the tinted surface. */
  softBorder: string;
};

export const ACCENT_SALE: FlowAccent = {
  base: "#6E0F2D", deep: "#4A061B",
  soft: "rgba(110,15,45,0.06)", softBorder: "rgba(110,15,45,0.20)",
};
export const ACCENT_RETURN: FlowAccent = {
  base: "#AB3832", deep: "#8C2B26",
  soft: "rgba(171,56,50,0.06)", softBorder: "rgba(171,56,50,0.22)",
};
export const ACCENT_WHOLESALE: FlowAccent = {
  // Gold is decoration-only as a *text* colour, so the accent's readable
  // partner is gold-700 (#845E04, 5.86:1) — never the #C89B47 brand gold.
  base: "#845E04", deep: "#6B4B01",
  soft: "rgba(200,155,71,0.12)", softBorder: "rgba(200,155,71,0.35)",
};

/* ══════════════════════════════════════════════════════════════════════════
   STEPPER
   ══════════════════════════════════════════════════════════════════════════ */

export type FlowStep = {
  label: string;
  /** Shown under the label once the step is behind you — e.g. the chosen customer. */
  summary?: string;
};

export function Stepper({
  steps,
  current,
  accent,
  onJump,
}: {
  steps: FlowStep[];
  /** 1-based index of the step being shown. */
  current: number;
  accent: FlowAccent;
  /** Called with a 1-based index when a completed step is clicked. */
  onJump?: (step: number) => void;
}) {
  return (
    <ol
      style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", listStyle: "none",
        width: "100%", boxSizing: "border-box",
        margin: 0, padding: "20px 20px 18px",
        borderBottom: `1px solid ${C.bdr}`, background: C.cream,
      }}
    >
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        const clickable = done && !!onJump;
        const isLast = i === steps.length - 1;

        const circle = (
          <span
            aria-hidden
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done || active ? accent.base : "#FFFFFF",
              border: done || active ? `1px solid ${accent.base}` : `1.5px solid ${C.bdrMed}`,
              boxShadow: active ? `0 0 0 4px ${accent.soft}` : "none",
              transition: "background 0.18s, box-shadow 0.18s",
            }}
          >
            {done
              ? <Check size={16} color="#FFFFFF" strokeWidth={3} />
              : <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: active ? "#FFFFFF" : C.muted }}>{n}</span>}
          </span>
        );

        return (
          <li
            key={s.label}
            style={{
              flex: isLast ? undefined : 1,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {clickable ? (
                <Button
                  variant="tertiary"
                  onClick={() => onJump!(n)}
                  aria-label={`Go back to step ${n}: ${s.label}`}
                  className="h-auto w-auto rounded-full border-0 bg-transparent p-0 hover:!bg-transparent"
                >
                  {circle}
                </Button>
              ) : circle}

              <div style={{ textAlign: "center" }}>
                <div
                  aria-current={active ? "step" : undefined}
                  style={{
                    fontFamily: F.u, fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    color: active ? C.wine : done ? C.text : C.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </div>
                {done && s.summary && (
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1, whiteSpace: "nowrap" }}>
                    {s.summary}
                  </div>
                )}
              </div>
            </div>

            {/* Connector — sits on the circle's centre line */}
            {!isLast && (
              <span
                aria-hidden
                style={{
                  flex: 1, height: 2, margin: "15px 8px 0",
                  borderRadius: 999,
                  background: done ? accent.base : C.bdrMed,
                  transition: "background 0.18s",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP SCAFFOLDING
   ══════════════════════════════════════════════════════════════════════════ */

/** Title + one-line explanation at the top of a step. */
export function StepHeader({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
      <div>
        <h3 style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, color: C.wine, margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
        {subtitle && <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "5px 0 0", lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {aside && <div style={{ flexShrink: 0 }}>{aside}</div>}
    </div>
  );
}

/** The padded body of a step. Replaces the old per-element `margin: 0 20px`. */
export function StepBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "28px 32px 8px" }}>{children}</div>;
}

/**
 * Back / primary action bar. Always the last thing in a step, always in the
 * same place. `primaryDisabled` genuinely disables the control; `hint`
 * explains what is still missing rather than leaving the operator guessing.
 */
export function FlowActions({
  backLabel = "Back",
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryBusy,
  primaryIcon,
  hint,
  accent,
  tone = "accent",
}: {
  backLabel?: string;
  onBack?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  primaryIcon?: LucideIcon;
  hint?: string;
  accent: FlowAccent;
  /** `confirm` renders the final commit action in success green. */
  tone?: "accent" | "confirm";
}) {
  const bg = tone === "confirm" ? "#1F774E" : accent.base;
  const bgHover = tone === "confirm" ? "#15603D" : accent.deep;
  const disabled = primaryDisabled || primaryBusy;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        marginTop: 28, padding: "20px 20px",
        borderTop: `1px solid ${C.bdr}`, background: C.cream,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0, flex: "1 1 auto" }}>
        {onBack && (
          <Button
            variant="secondary"
            onClick={onBack}
            iconLeft={ChevronLeft}
            className="h-11 rounded-full border-[rgba(110,15,45,0.20)] bg-white px-5 text-[14px] text-[#4F4A45] shrink-0"
          >
            {backLabel}
          </Button>
        )}
        {hint && disabled && !primaryBusy && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: F.u, fontSize: 13, color: C.muted, minWidth: 0, flex: "1 1 100%" }}>
            <AlertCircle size={15} color={C.muted} style={{ flexShrink: 0 }} />
            {hint}
          </span>
        )}
      </div>

      <div style={{ ["--cta-bg" as string]: bg, ["--cta-bg-hover" as string]: bgHover } as React.CSSProperties} className="w-full sm:w-auto">
        <Button
          variant="primary"
          onClick={onPrimary}
          disabled={disabled}
          iconLeft={primaryIcon}
          iconRight={primaryIcon ? undefined : ChevronRight}
          className="h-12 w-full sm:w-auto sm:min-w-[200px] rounded-full bg-[var(--cta-bg)] px-7 text-[15px] font-semibold text-white hover:bg-[var(--cta-bg-hover)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {primaryBusy ? "Working…" : primaryLabel}
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED STEP CONTENT
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The scan-or-type panel shared by New Sale step 2 and Retail Return step 1.
 * Camera is the headline affordance; manual entry is a peer below it rather
 * than an afterthought, because the barcode tag is often missing in practice.
 */
export function ScanPanel({
  title,
  hint,
  value,
  onValueChange,
  onSubmit,
  inputLabel = "Saree ID",
  placeholder = "e.g. PADMA-L1-004",
  error,
  accent,
  busy,
}: {
  title: string;
  hint: string;
  value: string;
  onValueChange: (v: string) => void;
  /** overrideValue is set when submitting straight from a decoded barcode, since
   *  the value state hasn't re-rendered yet at that point. */
  onSubmit: (overrideValue?: string) => void;
  inputLabel?: string;
  placeholder?: string;
  error?: string | null;
  accent: FlowAccent;
  busy?: boolean;
}) {
  const canSubmit = value.trim().length > 2 && !busy;
  const [scannerOpen, setScannerOpen] = useState(false);

  // A decoded barcode is a real value, not a keystroke — so it goes straight
  // to onValueChange + onSubmit rather than waiting for the operator to
  // notice the input filled in and press Find themselves.
  const handleDetected = (text: string) => {
    setScannerOpen(false);
    const decoded = text.trim();
    if (!decoded) return;
    onValueChange(decoded);
    onSubmit(decoded);
  };

  return (
    <div>
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetected} accent={accent} />
      <div
        style={{
          background: `linear-gradient(135deg, ${accent.deep} 0%, ${accent.base} 100%)`,
          borderRadius: 20, padding: "36px 28px", marginBottom: 24,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          position: "relative", overflow: "hidden",
          boxShadow: "0 12px 36px rgba(74,6,27,0.24)",
        }}
      >
        <div aria-hidden style={{ position: "absolute", top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(200,155,71,0.14)" }} />
        <div aria-hidden style={{ position: "absolute", bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ width: 72, height: 72, borderRadius: 18, position: "relative", zIndex: 1, background: "rgba(255,255,255,0.13)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={34} color="#FFFDF9" />
        </div>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 24, color: "#FFFDF9", marginBottom: 6 }}>{title}</div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,253,249,0.72)", lineHeight: 1.55, maxWidth: "min(380px, 100%)" }}>{hint}</div>
        </div>
        <Button
          variant="secondary"
          onClick={() => setScannerOpen(true)}
          iconLeft={Camera}
          className="relative z-10 h-11 rounded-full border-[rgba(255,255,255,0.32)] bg-[rgba(255,255,255,0.14)] px-6 text-[14px] font-semibold !text-white hover:!bg-[rgba(255,255,255,0.22)]"
        >
          Open Camera
        </Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: C.bdr }} />
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>or enter the ID by hand</span>
        <div style={{ flex: 1, height: 1, background: C.bdr }} />
      </div>

      <label htmlFor="flow-scan-id" style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, display: "block", marginBottom: 8 }}>
        {inputLabel}
      </label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Input
          id="flow-scan-id"
          value={value}
          onChange={e => onValueChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && canSubmit) { e.preventDefault(); onSubmit(); } }}
          placeholder={placeholder}
          size="lg"
          className="flex-1 font-mono"
          aria-invalid={!!error}
          aria-describedby={error ? "flow-scan-error" : undefined}
        />
        <div style={{ ["--cta-bg" as string]: accent.base, ["--cta-bg-hover" as string]: accent.deep } as React.CSSProperties}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onSubmit()}
            disabled={!canSubmit}
            className="h-12 rounded-xl bg-[var(--cta-bg)] px-6 hover:bg-[var(--cta-bg-hover)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "Finding…" : "Find"}
          </Button>
        </div>
      </div>
      {error && (
        <div id="flow-scan-error" role="alert" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, fontFamily: F.u, fontSize: 13, color: "#AB3832" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}
    </div>
  );
}

/** Green "we found it" confirmation strip. */
export function FoundBanner({ title, detail }: { title: string; detail: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "rgba(31,119,78,0.08)", border: "1px solid rgba(31,119,78,0.28)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1F774E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Check size={18} color="#FFF" strokeWidth={3} />
      </div>
      <div>
        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: "#1F774E" }}>{title}</div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>{detail}</div>
      </div>
    </motion.div>
  );
}

export type SummaryRow = { label: string; value: React.ReactNode; mono?: boolean; emphasis?: boolean };

/**
 * Read-back panel used on every confirm step. A two-column definition list
 * rather than the old space-between rows, so long values wrap cleanly instead
 * of colliding with their label.
 */
export function SummaryPanel({
  title,
  rows,
  accent,
  footer,
}: {
  title: string;
  rows: SummaryRow[];
  accent: FlowAccent;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${C.bdr}`, overflow: "hidden", background: "#FFFFFF", boxShadow: "0 2px 12px rgba(74,6,27,0.06)" }}>
      <div style={{ padding: "14px 20px", background: C.cream, borderBottom: `1px solid ${C.bdr}` }}>
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{title}</span>
      </div>
      <dl style={{ margin: 0, padding: "6px 20px" }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="grid-cols-1 md:grid-cols-[minmax(120px,34%)_1fr]"
            style={{
              display: "grid", gap: 20,
              alignItems: "baseline", padding: "13px 0",
              borderBottom: i < rows.length - 1 ? `1px solid ${C.bdr}` : "none",
            }}
          >
            <dt style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{r.label}</dt>
            <dd
              style={{
                margin: 0, textAlign: "right",
                fontFamily: F.u,
                fontVariantNumeric: r.mono ? "tabular-nums" : undefined,
                fontSize: r.emphasis ? 16 : 14,
                fontWeight: 600,
                color: r.emphasis ? accent.base : C.text,
                overflowWrap: "anywhere",
              }}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      {footer && <div style={{ borderTop: `1px solid ${C.bdr}`, padding: "18px 20px", background: C.cream }}>{footer}</div>}
    </div>
  );
}

/**
 * Selectable tile for payment methods and return reasons. One shared control
 * so selection reads the same everywhere: accent border, tinted fill, and a
 * filled check in the corner. Renders as a real radio for screen readers.
 */
export function OptionCard({
  icon: Icon,
  label,
  sub,
  selected,
  onSelect,
  accent,
  name,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
  accent: FlowAccent;
  name: string;
}) {
  return (
    <div style={{ ["--opt" as string]: accent.base, ["--opt-soft" as string]: accent.soft } as React.CSSProperties}>
      <Button
        variant="tertiary"
        fullWidth
        role="radio"
        aria-checked={selected}
        name={name}
        onClick={onSelect}
        className={`relative h-full min-h-[104px] flex-col items-start justify-start gap-3 whitespace-normal rounded-[16px] p-[18px] text-left transition-all ${
          selected
            ? "border-2 border-[var(--opt)] bg-[var(--opt-soft)] shadow-[0_4px_18px_rgba(74,6,27,0.10)]"
            : "border border-[rgba(110,15,45,0.12)] bg-white hover:border-[rgba(110,15,45,0.28)]"
        }`}
      >
        <span
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: selected ? "rgba(255,255,255,0.75)" : "rgba(110,15,45,0.05)",
            border: selected ? `1px solid ${accent.softBorder}` : "1px solid transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={22} color={selected ? accent.base : C.muted} />
        </span>
        <span style={{ display: "block", minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: selected ? accent.base : C.text }}>{label}</span>
          {sub && <span style={{ display: "block", fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 1.45 }}>{sub}</span>}
        </span>
        {selected && (
          <span aria-hidden style={{ position: "absolute", top: 12, right: 12, width: 20, height: 20, borderRadius: "50%", background: accent.base, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={12} color="#FFF" strokeWidth={3} />
          </span>
        )}
      </Button>
    </div>
  );
}

/** Cautionary strip for the irreversible confirm steps. */
export function ConsequenceNote({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" | "info" }) {
  const col = tone === "warn" ? "#AB3832" : "#0A6AA7";
  const bg = tone === "warn" ? "rgba(171,56,50,0.06)" : "rgba(10,106,167,0.06)";
  const bd = tone === "warn" ? "rgba(171,56,50,0.22)" : "rgba(10,106,167,0.22)";
  return (
    <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12, marginTop: 20 }}>
      <AlertCircle size={17} color={col} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
