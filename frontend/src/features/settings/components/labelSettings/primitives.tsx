import React from "react";
import { labelsApi } from "../../../../shared/api/labels";

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
export const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#69635E",
  green: "#1E6640",
  greenBg: "rgba(30,102,64,0.09)",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};

export function BarcodePreview({ code }: { code: string }) {
  return (
    <img
      src={labelsApi.barcodeUrl(code)}
      alt={`Barcode for ${code}`}
      style={{ width: "100%", height: 36, objectFit: "contain" }}
    />
  );
}

export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onChange} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (disabled ? undefined : onChange)?.(); } }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: disabled
          ? "rgba(110,15,45,0.10)"
          : value
          ? T.green
          : "rgba(110,15,45,0.20)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        position: "relative",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 2,
          left: value ? 22 : 2,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

export function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: `1px solid ${T.borderDef}`,
        boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: F.ui,
          fontWeight: 600,
          fontSize: 14,
          color: T.luxuryBrown,
          marginBottom: 16,
          borderBottom: `1px solid ${T.borderDef}`,
          paddingBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
