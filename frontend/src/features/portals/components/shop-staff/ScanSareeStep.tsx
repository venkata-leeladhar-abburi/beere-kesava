import React from "react";
import { motion } from "motion/react";
import { Camera, Check } from "lucide-react";
import { C, F, Card, Btn, Chip } from "./theme";

interface Saree {
  id: string;
  design: string;
  name: string;
  type: string;
  typeCode: string;
  weight: string;
  weaver: string;
}

interface ScanSareeStepProps {
  sareeFound: boolean;
  setSareeFound: (v: boolean) => void;
  manualId: string;
  setManualId: (v: string) => void;
  saree: Saree;
  soldPrice: number;
  setSoldPrice: (p: number) => void;
  originalPrice: number;
  canSeePrices: boolean;
  isMobile?: boolean;
  fmtPrice: (n: number) => string;
  handleScan: () => void;
  scanError?: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function ScanSareeStep({
  sareeFound,
  setSareeFound,
  manualId,
  setManualId,
  saree,
  soldPrice,
  setSoldPrice,
  originalPrice,
  canSeePrices,
  isMobile,
  fmtPrice,
  handleScan,
  scanError,
  onBack,
  onNext,
}: ScanSareeStepProps) {
  return (
    <div style={{ marginTop: 12 }}>
      {!sareeFound ? (
        <>
          {/* Camera scan zone */}
          <div
            onClick={handleScan} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (handleScan)?.(); } }}
            style={{
              margin: "0 20px 18px",
              background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`,
              borderRadius: 20, padding: "32px 24px", cursor: "pointer",
              display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
              position: "relative" as const, overflow: "hidden",
              boxShadow: "0 12px 36px rgba(107,26,42,0.30)",
            }}
          >
            <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(196,146,58,0.14)" }} />
            <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{
              width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1,
              background: "rgba(255,255,255,0.13)", border: "1.5px solid rgba(255,255,255,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
            }}>
              <Camera size={34} color="#FFF" />
            </div>
            <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Point camera at the barcode tag on the saree label</div>
            </div>
            <div style={{
              background: C.gold, borderRadius: 999, padding: "9px 24px",
              minHeight: 56, minWidth: 200, boxSizing: "border-box" as const,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative" as const, zIndex: 1,
              fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text,
              boxShadow: "0 2px 8px rgba(196,146,58,0.40)",
            }}>
              Tap to Open Camera
            </div>
          </div>

          {/* Or divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
          </div>

          {/* Manual ID input */}
          <div style={{ margin: "0 20px 20px" }}>
            <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
              />
              {manualId.length > 3 && (
                <button onClick={handleScan} style={{ height: 52, borderRadius: 12, background: C.burg, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
              )}
            </div>
            {scanError && (
              <div style={{ marginTop: 10, fontFamily: F.u, fontSize: 12.5, color: "#C0392B" }}>{scanError}</div>
            )}
          </div>
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={onBack} style={{ flex: 1 }} />
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Found banner */}
          <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={17} color="#FFF" />
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Saree Found Successfully</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>ID: {saree.id}</div>
            </div>
          </div>

          {/* Saree details card */}
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
            <div style={{ padding: 18, display: isMobile ? "block" : "flex", gap: isMobile ? 0 : 24, alignItems: isMobile ? undefined : "flex-start" }}>
              <div style={{ flex: isMobile ? undefined : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.burg, marginBottom: 4 }}>{saree.id}</div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{saree.name}</div>
                  </div>
                  <Chip label="Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                  {[
                    ["Design Code", saree.design, true],
                    ["Type", saree.type, false],
                    ["Weight", saree.weight, true],
                    ["Weaver", saree.weaver, false],
                  ].map(([k, v, mono], i) => (
                    <div key={i}>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>{k as string}</div>
                      <div style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v as string}</div>
                    </div>
                  ))}
                </div>
              </div>
              {canSeePrices && (
                <div style={{ borderTop: isMobile ? `1px solid ${C.bdr}` : "none", borderLeft: isMobile ? "none" : `1px solid ${C.bdr}`, paddingTop: isMobile ? 14 : 0, marginTop: isMobile ? 16 : 0, paddingLeft: isMobile ? 0 : 24, width: isMobile ? undefined : 220, flexShrink: 0 }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Selling Price (₹)</label>
                  <div style={{ position: "relative" as const }}>
                    <span style={{ position: "absolute" as const, left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, pointerEvents: "none" as const }}>₹</span>
                    <input
                      type="number"
                      value={soldPrice}
                      onChange={e => setSoldPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                      style={{ width: "100%", height: 56, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 36px 0 36px", fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 6 }}>Default: {fmtPrice(originalPrice)}</div>
                </div>
              )}
            </div>
          </Card>

          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <button onClick={() => setSareeFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
            <Btn label="Next — Payment →" onClick={onNext} style={{ flex: 1, background: C.burg }} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
