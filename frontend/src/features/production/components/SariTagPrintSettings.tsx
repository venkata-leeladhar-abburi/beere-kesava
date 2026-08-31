import { Printer, Check } from "lucide-react";
import { Button, Select, SelectItem, NumberInput } from "../../../shared/ui/primitives";

const T = {
  royalBurgundy: "#6E0F2D",
  green:         "#1E6640",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};

const F = {
  ui:   "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface SariTagPrintSettingsProps {
  printer: string;
  setPrinter: (v: string) => void;
  labelSize: string;
  setLabelSize: (v: string) => void;
  copies: number;
  setCopies: (v: number) => void;
  isExternal: boolean;
  showWeaver: boolean;
  setShowWeaver: (v: boolean) => void;
  showDate: boolean;
  setShowDate: (v: boolean) => void;
  showBranding: boolean;
  setShowBranding: (v: boolean) => void;
  printed: boolean;
  printing: boolean;
  handlePrint: () => void;
  onClose: () => void;
}

export function SariTagPrintSettings({
  printer,
  setPrinter,
  labelSize,
  setLabelSize,
  copies,
  setCopies,
  isExternal,
  showWeaver,
  setShowWeaver,
  showDate,
  setShowDate,
  showBranding,
  setShowBranding,
  printed,
  printing,
  handlePrint,
  onClose,
}: SariTagPrintSettingsProps) {
  return (
    <div
      style={{
        flex: "0 0 40%", padding: "28px 28px",
        borderLeft: `1px solid ${T.borderDef}`,
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown, marginBottom: 24 }}>
        Print Settings
      </div>

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
          <Select value={field.value} onValueChange={field.setValue}>
            {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </Select>
        </div>
      ))}

      <div style={{ marginBottom: 20 }}>
        <label
          htmlFor="tag-copies"
          style={{
            fontFamily: F.ui, fontSize: 12, fontWeight: 600,
            color: T.luxuryBrown, display: "block", marginBottom: 6,
          }}
        >
          Number of Copies
        </label>
        <NumberInput
          id="tag-copies"
          min={1} max={100} value={copies}
          onValueChange={v => setCopies(v === "" ? 1 : v)}
        />
      </div>

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
            onClick={() => cb.set(!cb.value)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => cb.set(!cb.value))?.(); } }}
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
          <Button
            onClick={handlePrint}
            disabled={printing}
            loading={printing}
            fullWidth
            size="lg"
            variant="primary"
          >
            <Printer size={16} />
            {printing
              ? "Sending to Printer…"
              : `Print Now — ${copies} ${copies === 1 ? "copy" : "copies"}`}
          </Button>
        )}
        <Button onClick={onClose} fullWidth variant="tertiary">
          Cancel
        </Button>
      </div>
    </div>
  );
}
