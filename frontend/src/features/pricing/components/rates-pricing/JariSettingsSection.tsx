import { Check, X, AlertTriangle, Scale } from "lucide-react";
import { T, F, cardStyle, labelStyle } from "./theme";
import { SectionCard } from "./sharedUI";
import { Button, Input, NumberInput } from "../../../../shared/ui/primitives";

export function JariSettingsSection() {
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
      <SectionCard
        icon={Scale}
        title="Jari Measurement Settings"
        subtitle="Define the conversion ratio between Buns and Reels for Jari material. This setting affects all Jari-related calculations system-wide."
      >
        <div style={{ ...cardStyle, padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 8 }}>
              1 Reel = 4 Buns
            </div>
            <p className="max-w-[480px]" style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "0 auto", lineHeight: 1.7 }}>
              The current conversion is set to 4 Buns per Reel. This is used when calculating Jari deductions and stock tracking across all weaver accounts.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 28px 0" }} />

          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-bun-conversion" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>1 Reel equals:</label>
              <NumberInput
                id="jari-bun-conversion"
                defaultValue={4}
                className="w-[90px] bg-[#FFF8F0] border-[rgba(110,15,45,0.18)] text-center text-[20px] font-bold font-[var(--font-mono)]"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-unit-singular" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (singular):</label>
              <Input id="jari-unit-singular" defaultValue="Bun" className="w-[110px] bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label htmlFor="jari-unit-plural" style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (plural):</label>
              <Input id="jari-unit-plural" defaultValue="Buns" className="w-[110px] bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
            </div>
          </div>

          <div className="max-w-[600px]" style={{
            background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
            borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center",
            gap: 10, marginBottom: 24, margin: "0 auto 24px",
          }}>
            <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, lineHeight: 1.6 }}>
              <strong>Warning:</strong> Changing the Reel-to-Bun conversion will affect all Jari calculations system-wide, including historical display values and future deduction calculations. This should only be changed if the physical measurement standard changes.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-[500px] mx-auto">
            <Button variant="primary" iconLeft={Check} className="w-full sm:w-auto rounded-[14px] bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto py-2.5 px-7 text-[14px] font-semibold whitespace-nowrap">
              Save Rate
            </Button>
            <Button variant="secondary" iconLeft={X} className="w-full sm:w-auto rounded-[14px] h-auto py-2.5 px-5 text-[14px] whitespace-nowrap">
              Cancel
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

