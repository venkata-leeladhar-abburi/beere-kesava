import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "../../../../shared/ui/primitives";
import { Popover } from "../../../../shared/ui/overlay";
import { T, F } from "./theme";
import { jariFromReels, jariGrams, trimNum } from "./jariUtils";
import type { SareeTypeRecord } from "./sareeTypeData";

// ═══════════════════════════════════════════════════════════════════════════
// SAREE TYPE CARD — reusable exported popover (also used from Batch Creation)
// Built on the shared Popover primitive (design-system/05-OVERLAYS.md Part F):
// Radix gives Escape-to-close-with-focus-return, click-outside-close and
// aria-expanded/aria-controls for free. This card has no single DOM trigger
// (it's opened imperatively from row/list clicks across several pages), so
// it anchors to a fixed viewport-center point and overrides Content's own
// positioning/styling to reproduce the original centered-card layout exactly.
// ═══════════════════════════════════════════════════════════════════════════
export function SareeTypeCard({ sareeType, onClose }: { sareeType: SareeTypeRecord; onClose: () => void }) {
  return (
    <Popover open onOpenChange={next => { if (!next) onClose(); }}>
      {createPortal(
        <div
          style={{
            position: "fixed", inset: 0, zIndex: "var(--z-popover)",
            background: "var(--surface-scrim)", backdropFilter: "blur(4px)",
          }}
        />,
        document.body
      )}
      <Popover.Anchor asChild>
        <div style={{ position: "fixed", top: "50%", left: "50%", width: 0, height: 0, pointerEvents: "none" }} />
      </Popover.Anchor>
      <Popover.Content
        elevated
        side="bottom"
        align="center"
        sideOffset={0}
        collisionPadding={24}
        onOpenAutoFocus={e => e.preventDefault()}
        className="p-0 max-w-none"
        style={{
          transform: "translateY(-50%)",
          background: "#FFFDF9", borderRadius: 20, width: 480, maxWidth: "calc(100vw - 48px)",
          boxShadow: "0 24px 80px rgba(44,6,27,0.28)", overflow: "hidden",
          border: `1px solid ${T.borderDef}`,
        }}
      >
        {/* Header */}
        <div style={{ background: T.darkBurgundy, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 8 }}>
            Saree Type Details
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "4px 10px" }}>
              {sareeType.code}
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {sareeType.type}
            </span>
          </div>
          <IconButton
            icon={X} label="Close" size="sm" variant="ghost"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          />
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {sareeType.description && (
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, lineHeight: 1.7 }}>{sareeType.description}</p>
          )}

          {/* Price + weight row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: T.cream, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 6 }}>Making Charge</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: T.antiqueGold }}>₹{parseInt(sareeType.charge).toLocaleString("en-IN")}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>per saree</div>
            </div>
            <div style={{ background: T.cream, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 6 }}>Standard Weight</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>{sareeType.stdWeight}g</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>grams</div>
            </div>
          </div>

          {/* Retail / Wholesale */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Retail Price</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>₹{parseInt(sareeType.retail).toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Wholesale Price</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>₹{parseInt(sareeType.wholesale).toLocaleString("en-IN")}</div>
            </div>
          </div>

          {/* Material breakdown */}
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Warp", value: sareeType.warpWeight, unit: "g" },
                { label: "Resham", value: sareeType.reshamWeight, unit: "g" },
                {
                  label: "Jari", value: sareeType.jariWeight, unit: " reels",
                  sub: `${trimNum(jariFromReels(parseFloat(sareeType.jariWeight) || 0, "buns"))} buns · ${trimNum(jariGrams(parseFloat(sareeType.jariWeight) || 0), 0)}g`,
                },
              ].map(({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) => (
                <div key={label} style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.08em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{value || "—"}{value ? unit : ""}</div>
                  {sub && value && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>{sub}</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, borderTop: `1px solid ${T.borderDef}`, paddingTop: 12 }}>
            Last updated: {sareeType.changed}
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
