import React from "react";

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
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {/* Icon box */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: highlight ? "rgba(200,155,71,0.18)" : "rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          marginBottom: 4,
        }}>
          {icon}
        </div>
        {/* Label */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.50)",
          letterSpacing: "0.8px",
          fontWeight: 600,
        }}>
          {label}
        </div>
        {/* Value */}
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: valueFontSize,
          color: valueColor,
          lineHeight: 1.1,
        }}>
          {value}
        </div>
        {/* Sub */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.4,
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
    <button
      disabled={disabled}
      style={{
        minWidth: 30,
        height: 30,
        borderRadius: 6,
        border: active ? "none" : `1px solid rgba(110,15,45,0.15)`,
        background: active ? "#6E0F2D" : "transparent",
        color: active ? "#fff" : disabled ? "rgba(139,112,96,0.4)" : "#6E0F2D",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6px",
      }}
    >
      {children}
    </button>
  );
}
