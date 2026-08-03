import React from "react";
import { Printer, Check } from "lucide-react";

const T = {
  royalBurgundy: "#6E0F2D",
  green:         "#1E6640",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
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
      <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.luxuryBrown, marginBottom: 24 }}>
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
  );
}
