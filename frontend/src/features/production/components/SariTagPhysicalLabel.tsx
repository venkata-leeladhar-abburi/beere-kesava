import React from "react";

const T = {
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  taupe:         "#69635E",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function BarcodeStrip({ code }: { code: string }) {
  const bars: { x: number; w: number; dark: boolean }[] = [];
  let x = 0;

  [2, 1, 2].forEach((w, i) => { bars.push({ x, w, dark: i % 2 === 0 }); x += w; });

  for (let ci = 0; ci < code.length; ci++) {
    const n = code.charCodeAt(ci);
    const widths = [
      (n >> 5) % 3 + 1,
      (n >> 3) % 2 + 1,
      (n >> 1) % 3 + 1,
      n % 2 + 1,
      (n >> 4) % 3 + 1,
      (n >> 2) % 2 + 1,
    ];
    widths.forEach((w, i) => { bars.push({ x, w, dark: i % 2 === 0 }); x += w; });
  }

  [2, 3, 1, 1].forEach((w, i) => { bars.push({ x, w, dark: i % 2 === 0 }); x += w; });

  const total = x;
  return (
    <svg width="100%" height="44" viewBox={`0 0 ${total} 44`} preserveAspectRatio="none">
      {bars.filter(b => b.dark).map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={44} fill="#000000" />
      ))}
    </svg>
  );
}

export interface SareeProps {
  id: string;
  weaver: string | null;
  design: string;
  sareeType: string;
  sareeTypeCode?: string;
  weight: string;
  qcDate: string;
  source: string;
  loom: number;
  supplier?: string;
}

interface SariTagPhysicalLabelProps {
  saree: SareeProps;
  isExternal: boolean;
  showWeaver: boolean;
  showDate: boolean;
  showBranding: boolean;
}

export function SariTagPhysicalLabel({
  saree,
  isExternal,
  showWeaver,
  showDate,
  showBranding,
}: SariTagPhysicalLabelProps) {
  return (
    <div
      style={{
        flex: "0 0 60%", padding: 32, background: "#F7F4F0",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
      }}
    >
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>
        LABEL PREVIEW — 100mm × 50mm
      </div>

      <div
        style={{
          width: 360, height: 180,
          background: "#FFFFFF",
          border: `1.5px solid ${T.royalBurgundy}`,
          borderRadius: 4,
          padding: "12px 14px",
          display: "flex", flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        {isExternal ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              {showBranding && (
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                  BKB Silks
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: "#1A1A1A", letterSpacing: "1px" }}>
                {saree.id}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 6 }}>
              <div style={{ width: "100%", maxWidth: 280 }}>
                <BarcodeStrip code={saree.id} />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, fontFamily: F.ui, fontSize: 12, color: "#1A1A1A" }}>
              <div><strong>{saree.sareeTypeCode || saree.sareeType}</strong></div>
              <div style={{ color: T.taupe }}>Source: External Purchase</div>
              <div style={{ color: T.taupe }}>{saree.supplier || "—"}</div>
              {showDate && <div style={{ color: T.taupe }}>{saree.qcDate}</div>}
            </div>

            {showBranding && (
              <div
                style={{
                  position: "absolute", bottom: 6, right: 10,
                  fontFamily: F.display, fontSize: 7, color: T.royalBurgundy, opacity: 0.6,
                }}
              >
                Beere Kesava &amp; Brothers Silks · Est. 1999
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              {showBranding && (
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                  BKB Silks
                </div>
              )}
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginLeft: "auto" }}>
                {saree.sareeType}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 280 }}>
                <BarcodeStrip code={saree.id} />
              </div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: "#1A1A1A", marginTop: 4, letterSpacing: "1.5px" }}>
                {saree.id}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
              {showWeaver && (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>WEAVER</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                    {saree.weaver || "Own Factory"}
                  </div>
                </div>
              )}
              {showDate && (
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>QC DATE</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                    {saree.qcDate}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>WEIGHT</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                  {saree.weight}
                </div>
              </div>
            </div>

            {showBranding && (
              <div
                style={{
                  position: "absolute", bottom: 6, right: 10,
                  fontFamily: F.display, fontSize: 7, color: T.royalBurgundy, opacity: 0.6,
                }}
              >
                Beere Kesava &amp; Brothers Silks · Est. 1999
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        {isExternal ? (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
            External Purchase · {saree.supplier || "—"}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
              {saree.design} · {saree.sareeType}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
              {saree.source === "factory"
                ? `Own Factory · Loom ${saree.loom}`
                : `Outsourced · ${saree.weaver}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
