import React from "react";
import type { LucideIcon } from "lucide-react";
import { F, T } from "../labelSettings/primitives";

/** Label above a control, with room for a hint underneath it. */
export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontFamily: F.ui,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: T.taupe,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "block",
        fontFamily: F.ui,
        fontSize: 12,
        color: T.taupe,
        marginTop: 5,
        lineHeight: 1.45,
      }}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  onDark,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Sitting on the card's burgundy header rather than on cream. */
  onDark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "9px 16px",
        borderRadius: 10,
        border: onDark ? "1px solid rgba(255,253,249,0.28)" : "none",
        background: onDark ? "rgba(255,253,249,0.14)" : T.royalBurgundy,
        color: onDark ? "#FFFDF9" : "#FFFDF9",
        fontFamily: F.ui,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  onClick,
  disabled,
  icon: Icon,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 14px",
        borderRadius: 10,
        border: `1px solid ${danger ? "rgba(192,57,43,0.30)" : T.borderDef}`,
        background: "#FFFFFF",
        color: danger ? T.crimson : T.luxuryBrown,
        fontFamily: F.ui,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon style={{ width: 15, height: 15 }} />}
      {children}
    </button>
  );
}

/** Small coloured status word — reused by the policy and readings tables. */
export function StatusPill({
  tone,
  children,
}: {
  tone: "good" | "warn" | "bad" | "muted";
  children: React.ReactNode;
}) {
  const palette = {
    good: { fg: T.green, bg: T.greenBg },
    warn: { fg: "#8A6D1F", bg: "rgba(200,155,71,0.16)" },
    bad: { fg: T.crimson, bg: T.crimsonBg },
    muted: { fg: T.taupe, bg: "rgba(110,15,45,0.06)" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontFamily: F.ui,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
