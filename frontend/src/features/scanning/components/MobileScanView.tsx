import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  green:         "#1E6640",
  crimson:       "#C0392B",
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  borderDef:     "rgba(110,15,45,0.10)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════
interface SareeData {
  id:               string;
  weaver:           string;
  fabricType:       string;
  colour:           string;
  jariType:         string;
  dispatchDate:     string;
  productionStage:  string;
  status:           string;
}

const DEFAULT_SAREE: SareeData = {
  id:              "PADMA-L1-001",
  weaver:          "Padma Veni",
  fabricType:      "Kanchipuram Pure Silk",
  colour:          "Deep Maroon",
  jariType:        "PLY-2G-Gold",
  dispatchDate:    "10 Jun 2026",
  productionStage: "Quality Check Passed",
  status:          "Dispatched",
};

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL ROWS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
function detailRows(saree: SareeData) {
  return [
    { label: "Weaver Name",                value: saree.weaver },
    { label: "Fabric Type",                value: saree.fabricType },
    { label: "Colour",                     value: saree.colour },
    { label: "Jari Type",                  value: saree.jariType },
    { label: "Dispatch Date",              value: saree.dispatchDate },
    { label: "Production Stage Completed", value: saree.productionStage },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function MobileScanView({ saree = DEFAULT_SAREE }: { saree?: SareeData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(saree.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = detailRows(saree);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 375, margin: "0 auto" }}>

        {/* ── Top bar ── */}
        <div
          style={{
            height: 56,
            background: T.royalBurgundy,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 18,
              color: "#FFFFFF",
              letterSpacing: "0.2px",
            }}
          >
            BKB Silks
          </span>
        </div>

        {/* ── Saree photo placeholder ── */}
        <div
          style={{
            width: "100%",
            height: 200,
            borderRadius: 8,
            overflow: "hidden",
            background: "linear-gradient(135deg, #F5E8D0 0%, #E8DDD5 50%, #C89B47 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              color: T.taupe,
              letterSpacing: "0.5px",
            }}
          >
            Authentic Silk Saree
          </span>
        </div>

        {/* ── Unique code + copy ── */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, paddingTop: 20, paddingBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 18,
              color: T.royalBurgundy,
              letterSpacing: "1px",
            }}
          >
            {saree.id}
          </span>
          <button
            onClick={handleCopy}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: copied ? "rgba(30,102,64,0.10)" : "rgba(110,15,45,0.07)",
              border: `1px solid ${copied ? "rgba(30,102,64,0.25)" : "rgba(110,15,45,0.15)"}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Copy saree ID"
          >
            {copied
              ? <Check size={15} color={T.green} />
              : <Copy size={15} color={T.royalBurgundy} />}
          </button>
        </div>

        {/* ── Status pill ── */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 18 }}>
          <div
            style={{
              background: T.green,
              borderRadius: 999,
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 6, paddingBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: F.ui, fontWeight: 600,
                fontSize: 12, color: "#FFFFFF",
                letterSpacing: "0.3px",
              }}
            >
              {saree.status}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "#E8DDD5", marginLeft: 16, marginRight: 16 }} />

        {/* ── Details card ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8DDD5",
            borderRadius: 8,
            padding: "0 12px",
            margin: "16px 16px 0",
          }}
        >
          {rows.map((row, idx) => (
            <div
              key={row.label}
              style={{
                paddingTop: 10, paddingBottom: 10,
                borderBottom: idx < rows.length - 1 ? "1px solid #F0EBE5" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.antiqueGold,
                  fontWeight: 600,
                  marginBottom: 3,
                  letterSpacing: "0.3px",
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 14,
                  color: "#1A1A1A",
                  fontWeight: 500,
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom branding ── */}
        <div
          style={{
            paddingTop: 28, paddingBottom: 32,
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: 13,
              color: T.royalBurgundy,
              letterSpacing: "0.3px",
            }}
          >
            BKB Silks
          </span>
          <span
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: "#9E9E9E",
              textAlign: "center",
            }}
          >
            Authentic Handcrafted Silk Sarees
          </span>
        </div>

      </div>
    </div>
  );
}
