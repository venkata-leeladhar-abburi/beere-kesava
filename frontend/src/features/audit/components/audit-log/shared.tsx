import React from "react";
import type { LucideIcon } from "lucide-react";
import { T, F } from "./tokens";
import { Button } from "../../../../shared/ui/primitives";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// rest of the app.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
}

export function StatCol({
  icon,
  label,
  value,
  valueFontSize = 32,
  valueColor = "#fff",
  sub,
  divider = false,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueFontSize?: number;
  valueColor?: string;
  sub: string;
  divider?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "stretch",
      position: "relative",
    }}>
      {divider && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "16px",
          bottom: "16px",
          width: 1,
          background: "rgba(200,155,71,0.18)",
        }} />
      )}
      <div style={{
        flex: 1,
        padding: "24px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        minWidth: 0,
      }}>
        {/* 1. Icon (Top) */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: highlight ? "rgba(200,155,71,0.18)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${highlight ? "rgba(200,155,71,0.38)" : "rgba(255,255,255,0.10)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          marginBottom: 4,
        }}>
          {icon}
        </div>

        {/* 2. Number / Value (Below Icon) */}
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontWeight: 400,
          fontSize: typeof valueFontSize === "number" ? `clamp(32px, 3.5vw, ${valueFontSize}px)` : valueFontSize,
          color: valueColor,
          lineHeight: 1.0,
          fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </div>

        {/* 3. Heading / Label (Below Number) */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "clamp(10px, 1.8vw, 12px)",
          textTransform: "uppercase" as const,
          color: highlight ? "rgba(200,155,71,1)" : "rgba(255,255,255,0.90)",
          letterSpacing: "1.5px",
          fontWeight: 600,
        }}>
          {label}
        </div>

        {/* 4. Subtitle / Description (Below Heading) */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(11px, 1.6vw, 12px)",
          color: highlight ? "rgba(231,201,131,0.85)" : "rgba(255,255,255,0.60)",
          lineHeight: 1.4,
          marginTop: 1,
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

export function PaginationBtn({
  children,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={active ? "primary" : "secondary"}
      size="sm"
      disabled={disabled}
      className="min-w-[30px] h-[30px] px-1.5 font-mono"
    >
      {children}
    </Button>
  );
}
