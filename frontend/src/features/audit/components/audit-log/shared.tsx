import React from "react";
import type { LucideIcon } from "lucide-react";
import { T, F } from "./tokens";

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
    <div id={id} className="bg-white rounded-2xl md:rounded-[20px] border border-[#EBE3D5] shadow-[0_6px_32px_rgba(74,6,27,0.08)] overflow-hidden">
      <div
        className="p-4 sm:p-6 md:p-7"
        style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/12 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFFDF9]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(16px, 2.5vw, 20px)", color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.25 }}>
                {title}
              </div>
              {subtitle && (
                <div style={{ fontFamily: F.ui, fontSize: "clamp(12px, 1.8vw, 14px)", color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.4 }}>
                  {subtitle}
                </div>
              )}
              {actions && (
                <div className="flex items-center gap-2.5 flex-wrap shrink-0 mt-3 sm:hidden">
                  {actions}
                </div>
              )}
            </div>
            {actions && (
              <div className="hidden sm:flex items-center gap-2.5 flex-wrap shrink-0 self-start">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-3.5 sm:p-5 md:p-6">
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
