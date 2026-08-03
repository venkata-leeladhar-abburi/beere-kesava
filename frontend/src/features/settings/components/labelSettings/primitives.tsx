import React from "react";

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
  taupe: "#8B7060",
  green: "#1E6640",
  greenBg: "rgba(30,102,64,0.09)",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};

export function BarcodePreview({ code }: { code: string }) {
  const bars: { x: number; w: number; dark: boolean }[] = [];
  let x = 0;
  [2, 1, 2].forEach((w, i) => {
    bars.push({ x, w, dark: i % 2 === 0 });
    x += w;
  });
  for (let ci = 0; ci < Math.min(code.length, 16); ci++) {
    const n = code.charCodeAt(ci);
    [
      ((n >> 5) % 3) + 1,
      ((n >> 3) % 2) + 1,
      ((n >> 1) % 3) + 1,
      (n % 2) + 1,
    ].forEach((w, i) => {
      bars.push({ x, w, dark: i % 2 === 0 });
      x += w;
    });
  }
  [2, 3, 1, 1].forEach((w, i) => {
    bars.push({ x, w, dark: i % 2 === 0 });
    x += w;
  });
  return (
    <svg
      width="100%"
      height="36"
      viewBox={`0 0 ${x} 36`}
      preserveAspectRatio="none"
    >
      {bars
        .filter((b) => b.dark)
        .map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={36} fill="#000" />
        ))}
    </svg>
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
      onClick={disabled ? undefined : onChange}
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
