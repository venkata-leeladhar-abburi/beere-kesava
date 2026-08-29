import { Check, X, AlertTriangle, Scale } from "lucide-react";
import { T, F, labelStyle } from "./theme";
import { SectionCard } from "./sharedUI";
import { Button, Input, NumberInput } from "../../../../shared/ui/primitives";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 220, height: 220, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

const luxuryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: `1.5px solid ${T.royalBurgundy}`,
  padding: 40,
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 6px 18px rgba(74,6,27,0.05)",
  position: "relative",
  overflow: "hidden",
};

export function JariSettingsSection() {
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
      <SectionCard
        icon={Scale}
        title="Jari Measurement Settings"
        subtitle="Define the conversion ratio between Buns and Reels for Jari material. This setting affects all Jari-related calculations system-wide."
      >
        <div style={luxuryCardStyle}>
          <CardBloom />
          
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-block", background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.15)`,
              borderRadius: 20, padding: "12px 28px", marginBottom: 14,
            }}>
              <span style={{ fontFamily: F.display, fontSize: 36, fontWeight: 700, color: T.royalBurgundy }}>
                1 Reel <span style={{ color: T.antiqueGold, padding: "0 6px" }}>=</span> 4 Buns
              </span>
            </div>
            <p className="max-w-[520px]" style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "0 auto", lineHeight: 1.7 }}>
              The current conversion is set to 4 Buns per Reel. This is used when calculating Jari deductions and stock tracking across all weaver accounts.
            </p>
          </div>

          <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, margin: "0 0 28px 0" }} />

          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-bun-conversion" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>1 Reel equals:</label>
              <NumberInput
                id="jari-bun-conversion"
                defaultValue={4}
                className="w-[90px] bg-white border-[rgba(110,15,45,0.22)] text-center text-[20px] font-bold font-[var(--font-mono)] text-[#6E0F2D]"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-unit-singular" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (singular):</label>
              <Input id="jari-unit-singular" defaultValue="Bun" className="w-[110px] bg-white border-[rgba(110,15,45,0.22)]" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-unit-plural" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (plural):</label>
              <Input id="jari-unit-plural" defaultValue="Buns" className="w-[110px] bg-white border-[rgba(110,15,45,0.22)]" />
            </div>
          </div>

          <div className="max-w-[620px]" style={{
            background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.18)`,
            borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center",
            gap: 12, marginBottom: 28, margin: "0 auto 28px",
          }}>
            <AlertTriangle size={18} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, lineHeight: 1.6 }}>
              <strong style={{ color: T.royalBurgundy }}>Warning:</strong> Changing the Reel-to-Bun conversion will affect all Jari calculations system-wide, including historical display values and future deduction calculations. This should only be changed if the physical measurement standard changes.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-[420px] mx-auto">
            <Button variant="primary" iconLeft={Check} className="w-full sm:w-auto flex-1 rounded-[10px] bg-[#6E0F2D] hover:bg-[#3D0E1A] h-auto py-2.5 px-7 text-[13px] font-semibold text-white whitespace-nowrap">
              Save Rate
            </Button>
            <Button variant="secondary" iconLeft={X} className="w-full sm:w-auto flex-1 rounded-[10px] h-auto py-2.5 px-5 text-[13px] font-semibold text-[#6E0F2D] border border-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white transition-colors whitespace-nowrap">
              Cancel
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
