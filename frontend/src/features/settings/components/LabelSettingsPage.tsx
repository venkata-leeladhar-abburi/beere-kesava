import React, { useState } from "react";
import { F, T } from "./labelSettings/primitives";
import { LabelPreviewCard } from "./labelSettings/LabelPreviewCard";
import { LabelDimensionsCard } from "./labelSettings/LabelDimensionsCard";
import { VisibleFieldsCard } from "./labelSettings/VisibleFieldsCard";
import type { LabelFields } from "./labelSettings/VisibleFieldsCard";
import { BarcodeSettingsCard } from "./labelSettings/BarcodeSettingsCard";
import { PrinterConfigCard } from "./labelSettings/PrinterConfigCard";
import { ScanPageSettingsCard } from "./labelSettings/ScanPageSettingsCard";
import type { ScanFields } from "./labelSettings/ScanPageSettingsCard";
import { StickyFooter } from "./labelSettings/StickyFooter";

export function LabelSettingsPage() {
  const [labelSize, setLabelSize] = useState("100mm × 50mm (Default)");
  const [fields, setFields] = useState<LabelFields>({
    barcode: true,
    code: true,
    weaver: true,
    date: true,
    branding: true,
  });
  const [printerConnected] = useState(true);
  const [printer, setPrinter] = useState("TSC TE244");
  const [connectionType, setConnectionType] = useState("USB");
  const [scanFields, setScanFields] = useState<ScanFields>({
    photo: true,
    code: true,
    weaver: true,
    fabric: true,
    colour: true,
    jari: true,
    dispatchDate: true,
    productionStatus: true,
  });

  const toggleField = (key: keyof LabelFields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));
  const toggleScanField = (key: keyof ScanFields) =>
    setScanFields((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", paddingBottom: 80 }}>
      {/* PAGE HEADER */}
      <div
        style={{
          background: T.darkBurgundy,
          padding: "44px 56px 90px",
          position: "relative",
          overflow: "hidden",
          minHeight: 180,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 9,
            color: T.antiqueGold,
            opacity: 0.5,
            letterSpacing: 2,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          SINCE 1999 · SUPERADMIN · LABEL SETTINGS
        </div>
        {/* H1 */}
        <h1
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 42,
            color: "white",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Label Settings
        </h1>
        {/* Sub */}
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 28,
            color: T.antiqueGold,
            marginTop: 2,
            marginBottom: 14,
          }}
        >
          &amp; Tag Print Configuration
        </div>
        {/* Description */}
        <p
          style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: "rgba(255,255,255,0.60)",
            maxWidth: 480,
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          Configure the physical saree tag label — fields shown, barcode
          format, printer connection, and what customers see when they scan a
          saree QR code.
        </p>
        {/* Decorative rings */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.13)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 100,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "2px solid rgba(200,155,71,0.09)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* TWO-COLUMN MAIN LAYOUT */}
      <div
        style={{
          padding: "0 56px",
          marginTop: -40,
          position: "relative",
          zIndex: 10,
          display: "flex",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        <LabelPreviewCard fields={fields} />

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <LabelDimensionsCard labelSize={labelSize} setLabelSize={setLabelSize} />
          <VisibleFieldsCard fields={fields} toggleField={toggleField} />
          <BarcodeSettingsCard />
          <PrinterConfigCard
            printer={printer} setPrinter={setPrinter}
            connectionType={connectionType} setConnectionType={setConnectionType}
            printerConnected={printerConnected}
          />
          <ScanPageSettingsCard scanFields={scanFields} toggleScanField={toggleScanField} />
        </div>
      </div>

      <StickyFooter />
    </div>
  );
}
