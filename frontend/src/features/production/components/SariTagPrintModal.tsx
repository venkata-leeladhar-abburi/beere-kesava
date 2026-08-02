import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Printer, Check } from "lucide-react";

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
  darkBurgundy:  "#3D0E1A",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ═══════════════════════════════════════════════════════════════════════════════
// BARCODE HELPER
// ═══════════════════════════════════════════════════════════════════════════════
function BarcodeStrip({ code }: { code: string }) {
  const bars: { x: number; w: number; dark: boolean }[] = [];
  let x = 0;

  // Start guard
  [2, 1, 2].forEach((w, i) => { bars.push({ x, w, dark: i % 2 === 0 }); x += w; });

  // Data — derive bar widths from character codes
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

  // Stop guard
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

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface SareeProps {
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

interface Props {
  saree: SareeProps;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function SariTagPrintModal({ saree, onClose }: Props) {
  const isExternal = saree.source === "external";
  const [showWeaver, setShowWeaver]     = useState(true);
  const [showDate, setShowDate]         = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [copies, setCopies]             = useState(1);
  const [printer, setPrinter]           = useState("TSC TE244");
  const [labelSize, setLabelSize]       = useState("100mm × 50mm");
  const [printing, setPrinting]         = useState(false);
  const [printed, setPrinted]           = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { setPrinting(false); setPrinted(true); }, 1800);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(27,12,8,0.70)",
            backdropFilter: "blur(6px)",
          }}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "relative", zIndex: 1,
            width: "min(90vw, 900px)", maxHeight: "90vh",
            background: "#FFFFFF", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* ── Modal header ── */}
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>
                Saree Tag Preview
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", marginTop: 2 }}>
                {saree.id}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)", border: "none",
                color: "#FFF", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* LEFT — label preview */}
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

              {/* Physical label */}
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
                    {/* Top row: BKB logo text + saree type code */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      {showBranding && (
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 11, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                          BKB Silks
                        </div>
                      )}
                    </div>

                    {/* Line 1 — Saree ID (large, mono) */}
                    <div style={{ textAlign: "center", marginBottom: 4 }}>
                      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, color: "#1A1A1A", letterSpacing: "1px" }}>
                        {saree.id}
                      </div>
                    </div>

                    {/* Barcode */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ width: "100%", maxWidth: 280 }}>
                        <BarcodeStrip code={saree.id} />
                      </div>
                    </div>

                    {/* Line 2-5 */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, fontFamily: F.ui, fontSize: 9, color: "#1A1A1A" }}>
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
                    {/* Top row: BKB logo text + saree type */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      {showBranding && (
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 11, color: T.royalBurgundy, letterSpacing: "0.5px" }}>
                          BKB Silks
                        </div>
                      )}
                      <div style={{ fontFamily: F.mono, fontSize: 8, color: T.taupe, marginLeft: "auto" }}>
                        {saree.sareeType}
                      </div>
                    </div>

                    {/* Barcode */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "100%", maxWidth: 280 }}>
                        <BarcodeStrip code={saree.id} />
                      </div>
                      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 10, color: "#1A1A1A", marginTop: 4, letterSpacing: "1.5px" }}>
                        {saree.id}
                      </div>
                    </div>

                    {/* Bottom details row */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
                      {showWeaver && (
                        <div>
                          <div style={{ fontFamily: F.ui, fontSize: 8, color: T.antiqueGold, fontWeight: 600 }}>WEAVER</div>
                          <div style={{ fontFamily: F.ui, fontSize: 9, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                            {saree.weaver || "Own Factory"}
                          </div>
                        </div>
                      )}
                      {showDate && (
                        <div>
                          <div style={{ fontFamily: F.ui, fontSize: 8, color: T.antiqueGold, fontWeight: 600 }}>QC DATE</div>
                          <div style={{ fontFamily: F.ui, fontSize: 9, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                            {saree.qcDate}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 8, color: T.antiqueGold, fontWeight: 600 }}>WEIGHT</div>
                        <div style={{ fontFamily: F.ui, fontSize: 9, color: "#1A1A1A", fontWeight: 500, marginTop: 1 }}>
                          {saree.weight}
                        </div>
                      </div>
                    </div>

                    {/* Bottom right branding watermark */}
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

              {/* Design info below label */}
              <div style={{ textAlign: "center" }}>
                {isExternal ? (
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
                    External Purchase · {saree.supplier || "—"}
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
                      {saree.design} · {saree.sareeType}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
                      {saree.source === "factory"
                        ? `Own Factory · Loom ${saree.loom}`
                        : `Outsourced · ${saree.weaver}`}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT — print settings */}
            <div
              style={{
                flex: "0 0 40%", padding: "28px 28px",
                borderLeft: `1px solid ${T.borderDef}`,
                overflowY: "auto", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.luxuryBrown, marginBottom: 24 }}>
                Print Settings
              </div>

              {/* Printer + Label Size selects */}
              {[
                {
                  label: "Printer", value: printer, setValue: setPrinter,
                  options: ["TSC TE244", "Zebra ZD420", "DYMO LabelWriter", "Brother QL-800"],
                },
                {
                  label: "Label Size", value: labelSize, setValue: setLabelSize,
                  options: ["100mm × 50mm", "100mm × 75mm", "50mm × 25mm"],
                },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                      color: T.luxuryBrown, display: "block", marginBottom: 6,
                    }}
                  >
                    {field.label}
                  </label>
                  <select
                    value={field.value}
                    onChange={e => field.setValue(e.target.value)}
                    style={{
                      width: "100%", height: 40, borderRadius: 8,
                      border: "1px solid rgba(110,15,45,0.18)",
                      fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
                      padding: "0 12px", background: "#FFF8F0",
                      outline: "none", cursor: "pointer",
                    }}
                  >
                    {field.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}

              {/* Copies */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                    color: T.luxuryBrown, display: "block", marginBottom: 6,
                  }}
                >
                  Number of Copies
                </label>
                <input
                  type="number" min={1} max={100} value={copies}
                  onChange={e => setCopies(Number(e.target.value))}
                  style={{
                    width: "100%", height: 40, borderRadius: 8,
                    border: "1px solid rgba(110,15,45,0.18)",
                    fontFamily: F.mono, fontSize: 16, color: T.luxuryBrown,
                    padding: "0 12px", background: "#FFF8F0", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Label content toggles */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>
                  Label Contents
                </div>
                {[
                  ...(isExternal ? [] : [{ label: "Show Weaver Name", value: showWeaver, set: setShowWeaver }]),
                  { label: isExternal ? "Show Date" : "Show QC / Dispatch Date", value: showDate, set: setShowDate },
                  { label: "Show BKB Silks Branding",   value: showBranding, set: setShowBranding },
                ].map(cb => (
                  <div
                    key={cb.label}
                    onClick={() => cb.set(!cb.value)}
                    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: 5,
                        border: `2px solid ${cb.value ? T.royalBurgundy : "rgba(110,15,45,0.25)"}`,
                        background: cb.value ? T.royalBurgundy : "#FFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 0.15s",
                      }}
                    >
                      {cb.value && <Check size={12} color="#FFF" />}
                    </div>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                      {cb.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons — pinned to bottom */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {printed ? (
                  <div
                    style={{
                      textAlign: "center", padding: "14px",
                      background: "rgba(30,102,64,0.09)", borderRadius: 10,
                      border: "1px solid rgba(30,102,64,0.20)",
                    }}
                  >
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>
                      ✓ Sent to printer — {copies} {copies === 1 ? "copy" : "copies"}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    style={{
                      width: "100%", height: 46,
                      background: printing ? "rgba(110,15,45,0.40)" : T.royalBurgundy,
                      border: "none", borderRadius: 999,
                      color: "#FFF", fontFamily: F.ui, fontSize: 14, fontWeight: 600,
                      cursor: printing ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s",
                    }}
                  >
                    <Printer size={16} />
                    {printing
                      ? "Sending to Printer…"
                      : `Print Now — ${copies} ${copies === 1 ? "copy" : "copies"}`}
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    width: "100%", height: 36, background: "transparent",
                    border: "none", color: T.taupe,
                    fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
