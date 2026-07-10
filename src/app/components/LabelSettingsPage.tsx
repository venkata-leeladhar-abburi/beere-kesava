import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Printer,
  Lock,
  ExternalLink,
  Save,
  RotateCcw,
  AlertTriangle,
  Wifi,
  Usb,
} from "lucide-react";

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy: "#3D0E1A",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#8B7060",
  green: "#1E6640",
  greenBg: "rgba(30,102,64,0.09)",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
  borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};

function BarcodePreview({ code }: { code: string }) {
  const bars: { x: number; w: number; dark: boolean }[] = [];
  let x = 0;
  [2, 1, 2].forEach((w, i) => {
    bars.push({ x, w, dark: i % 2 === 0 });
    x += w;
  });
  for (let ci = 0; ci < Math.min(code.length, 16); ci++) {
    const n = code.charCodeAt(ci);
    [
      ((n >> 5) % 3) + 1,
      ((n >> 3) % 2) + 1,
      ((n >> 1) % 3) + 1,
      (n % 2) + 1,
    ].forEach((w, i) => {
      bars.push({ x, w, dark: i % 2 === 0 });
      x += w;
    });
  }
  [2, 3, 1, 1].forEach((w, i) => {
    bars.push({ x, w, dark: i % 2 === 0 });
    x += w;
  });
  return (
    <svg
      width="100%"
      height="36"
      viewBox={`0 0 ${x} 36`}
      preserveAspectRatio="none"
    >
      {bars
        .filter((b) => b.dark)
        .map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={36} fill="#000" />
        ))}
    </svg>
  );
}

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: disabled
          ? "rgba(110,15,45,0.10)"
          : value
          ? T.green
          : "rgba(110,15,45,0.20)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        position: "relative",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 2,
          left: value ? 22 : 2,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: `1px solid ${T.borderDef}`,
        boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: F.ui,
          fontWeight: 600,
          fontSize: 14,
          color: T.luxuryBrown,
          marginBottom: 16,
          borderBottom: `1px solid ${T.borderDef}`,
          paddingBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function LabelSettingsPage() {
  const [labelSize, setLabelSize] = useState("100mm × 50mm (Default)");
  const [fields, setFields] = useState({
    barcode: true,
    code: true,
    weaver: true,
    date: true,
    branding: true,
  });
  const [printerConnected] = useState(true);
  const [printer, setPrinter] = useState("TSC TE244");
  const [connectionType, setConnectionType] = useState("USB");
  const [scanFields, setScanFields] = useState({
    photo: true,
    code: true,
    weaver: true,
    fabric: true,
    colour: true,
    jari: true,
    dispatchDate: true,
    productionStatus: true,
  });

  const toggleField = (key: keyof typeof fields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));
  const toggleScanField = (key: keyof typeof scanFields) =>
    setScanFields((f) => ({ ...f, [key]: !f[key] }));

  const fieldRows: { key: keyof typeof fields; label: string }[] = [
    { key: "barcode", label: "Barcode" },
    { key: "code", label: "Unique Saree Code" },
    { key: "weaver", label: "Weaver Name" },
    { key: "date", label: "QC / Dispatch Date" },
    { key: "branding", label: "BKB Silks Branding" },
  ];

  const scanFieldRows: { key: keyof typeof scanFields; label: string; note?: string }[] = [
    { key: "photo", label: "Saree Photo" },
    { key: "code", label: "Unique Saree Code" },
    { key: "weaver", label: "Weaver Name", note: "Hides weaver identity from public" },
    { key: "fabric", label: "Fabric Type" },
    { key: "colour", label: "Colour" },
    { key: "jari", label: "Jari Type" },
    { key: "dispatchDate", label: "Dispatch Date" },
    { key: "productionStatus", label: "Production Status" },
  ];

  const lockedFields = [
    "Cost Price",
    "Supplier Details",
    "Profit Margin",
  ];

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
        {/* LEFT COLUMN */}
        <div style={{ flex: "0 0 52%" }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: `1px solid ${T.borderDef}`,
              boxShadow: "0 2px 16px rgba(44,24,16,0.08)",
              padding: 28,
            }}
          >
            {/* Section heading */}
            <div
              style={{
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 13,
                color: T.antiqueGold,
                letterSpacing: 2,
                marginBottom: 20,
                textTransform: "uppercase",
              }}
            >
              LIVE PREVIEW
            </div>

            {/* Label preview box */}
            <div
              style={{
                width: 360,
                height: 180,
                background: "white",
                border: "1.5px solid #6E0F2D",
                borderRadius: 6,
                padding: "12px 14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                margin: "0 auto 20px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                {fields.branding && (
                  <span
                    style={{
                      fontFamily: F.display,
                      fontWeight: 700,
                      fontSize: 10,
                      color: T.royalBurgundy,
                    }}
                  >
                    BKB Silks
                  </span>
                )}
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 8,
                    color: T.taupe,
                    background: T.cream,
                    borderRadius: 4,
                    padding: "2px 5px",
                    marginLeft: "auto",
                  }}
                >
                  Kanjivaram
                </span>
              </div>

              {/* Barcode */}
              {fields.barcode && (
                <div style={{ margin: "4px 0 0" }}>
                  <BarcodePreview code="RAVI-L2-001" />
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontWeight: 700,
                      fontSize: 9,
                      textAlign: "center",
                      marginTop: 3,
                      color: "#000",
                    }}
                  >
                    RAVI-L2-001
                  </div>
                </div>
              )}

              {/* Bottom row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 6,
                }}
              >
                {fields.weaver && (
                  <div>
                    <div
                      style={{
                        fontFamily: F.mono,
                        fontSize: 7,
                        color: T.antiqueGold,
                        textTransform: "uppercase",
                      }}
                    >
                      WEAVER
                    </div>
                    <div
                      style={{
                        fontFamily: F.mono,
                        fontWeight: 700,
                        fontSize: 8,
                        color: "#000",
                      }}
                    >
                      Ravi Kumar
                    </div>
                  </div>
                )}
                {fields.date && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: F.mono,
                        fontSize: 7,
                        color: T.antiqueGold,
                        textTransform: "uppercase",
                      }}
                    >
                      QC DATE
                    </div>
                    <div
                      style={{
                        fontFamily: F.mono,
                        fontWeight: 700,
                        fontSize: 8,
                        color: "#000",
                      }}
                    >
                      10 Jun 2026
                    </div>
                  </div>
                )}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 7,
                      color: T.antiqueGold,
                      textTransform: "uppercase",
                    }}
                  >
                    WEIGHT
                  </div>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontWeight: 700,
                      fontSize: 8,
                      color: "#000",
                    }}
                  >
                    842g
                  </div>
                </div>
              </div>

              {/* Bottom branding */}
              {fields.branding && (
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 6,
                    color: T.royalBurgundy,
                    opacity: 0.6,
                    textAlign: "right",
                    marginTop: 2,
                  }}
                >
                  Beere Kesava &amp; Brothers Silks · Est. 1999
                </div>
              )}
            </div>

            {/* Caption */}
            <div
              style={{
                fontFamily: F.ui,
                fontSize: 11,
                color: T.taupe,
                textAlign: "center",
              }}
            >
              Actual print size: 100mm × 50mm on TSC TE244
            </div>

            {/* Print test label button */}
            <button
              style={{
                border: "1px solid #6E0F2D",
                background: "transparent",
                color: T.royalBurgundy,
                borderRadius: 999,
                padding: "8px 18px",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                marginTop: 16,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <Printer size={14} />
              Print Test Label
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card 1 — Label Dimensions */}
          <CardSection title="Label Dimensions">
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value)}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 10,
                border: "1px solid rgba(110,15,45,0.18)",
                background: "#FFF8F0",
                fontFamily: F.ui,
                fontSize: 13,
                padding: "0 12px",
                color: T.luxuryBrown,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              <option>100mm × 50mm (Default)</option>
              <option>80mm × 40mm</option>
              <option>60mm × 40mm</option>
            </select>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              Match this to the roll currently loaded in TSC TE244
            </div>
          </CardSection>

          {/* Card 2 — Visible Fields */}
          <CardSection title="Visible Fields">
            {fieldRows.map((row, idx) => (
              <div key={row.key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      idx < fieldRows.length - 1
                        ? `1px solid ${T.borderDef}`
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.ui,
                      fontWeight: 500,
                      fontSize: 13,
                      color: T.luxuryBrown,
                    }}
                  >
                    {row.label}
                  </span>
                  <Toggle
                    value={fields[row.key]}
                    onChange={() => toggleField(row.key)}
                  />
                </div>
              </div>
            ))}
            {!fields.barcode && (
              <div
                style={{
                  background: "rgba(196,146,58,0.12)",
                  border: "1px solid rgba(200,155,71,0.40)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 10,
                }}
              >
                <AlertTriangle size={13} color="#7A5E1C" />
                <span
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: "#7A5E1C",
                  }}
                >
                  Turning off the barcode will prevent scanning.
                </span>
              </div>
            )}
          </CardSection>

          {/* Card 3 — Barcode Settings */}
          <CardSection title="Barcode Settings">
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.taupe,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Lock size={14} color={T.taupe} />
                Barcode Format (fixed)
              </div>
              <div
                style={{
                  background: "#F0EDE8",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: F.ui,
                  fontSize: 13,
                  color: T.taupe,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Code 128
                <Lock size={13} color={T.taupe} style={{ marginLeft: 4 }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.taupe,
                  marginBottom: 6,
                }}
              >
                Encoded Value
              </div>
              <div
                style={{
                  background: "#F0EDE8",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: F.mono,
                  fontSize: 12,
                  color: T.taupe,
                }}
              >
                bkbsilks.com/sari/&#123;sari_code&#125;
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
              Each barcode links to the public saree detail page when scanned
            </div>
          </CardSection>

          {/* Card 4 — Printer Configuration */}
          <CardSection title="Printer Configuration">
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.taupe,
                  marginBottom: 6,
                }}
              >
                Default Printer
              </div>
              <select
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(110,15,45,0.18)",
                  background: "#FFF8F0",
                  fontFamily: F.ui,
                  fontSize: 13,
                  padding: "0 12px",
                  color: T.luxuryBrown,
                  cursor: "pointer",
                }}
              >
                <option>TSC TE244</option>
                <option>Zebra ZD420</option>
                <option>DYMO LabelWriter</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 12,
                  color: T.taupe,
                  marginBottom: 6,
                }}
              >
                Connection Type
              </div>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 10,
                  border: "1px solid rgba(110,15,45,0.18)",
                  background: "#FFF8F0",
                  fontFamily: F.ui,
                  fontSize: 13,
                  padding: "0 12px",
                  color: T.luxuryBrown,
                  cursor: "pointer",
                }}
              >
                <option value="USB">USB</option>
                <option value="Network">Network (Ethernet)</option>
              </select>
            </div>
            {/* Test print row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                style={{
                  border: "1px solid #6E0F2D",
                  background: "transparent",
                  color: T.royalBurgundy,
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontFamily: F.ui,
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Printer size={14} />
                Send Test Print
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: printerConnected ? T.green : T.crimson,
                  }}
                />
                <span
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: printerConnected ? T.green : T.crimson,
                  }}
                >
                  {printerConnected ? "Printer Ready" : "Not Connected"}
                </span>
              </div>
            </div>
          </CardSection>

          {/* Card 5 — Public Scan Page Settings */}
          <CardSection title="What Customers See When They Scan">
            {scanFieldRows.map((row, idx) => (
              <div key={row.key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      idx < scanFieldRows.length - 1
                        ? `1px solid ${T.borderDef}`
                        : "none",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: F.ui,
                        fontWeight: 500,
                        fontSize: 13,
                        color: T.luxuryBrown,
                      }}
                    >
                      {row.label}
                    </span>
                    {row.note && !scanFields[row.key] && (
                      <div
                        style={{
                          fontFamily: F.ui,
                          fontSize: 11,
                          color: T.taupe,
                          marginTop: 2,
                        }}
                      >
                        {row.note}
                      </div>
                    )}
                  </div>
                  <Toggle
                    value={scanFields[row.key]}
                    onChange={() => toggleScanField(row.key)}
                  />
                </div>
              </div>
            ))}

            {/* Locked fields */}
            <div
              style={{
                marginTop: 8,
                borderTop: `1px solid ${T.borderDef}`,
                paddingTop: 8,
              }}
            >
              {lockedFields.map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Lock size={12} color={T.taupe} />
                    <span
                      style={{
                        fontFamily: F.ui,
                        fontWeight: 500,
                        fontSize: 13,
                        color: T.luxuryBrown,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: F.ui,
                      fontSize: 11,
                      color: T.taupe,
                    }}
                  >
                    Always hidden
                  </span>
                </div>
              ))}
            </div>

            {/* Preview link */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: `1px solid ${T.borderDef}`,
              }}
            >
              <span
                style={{
                  fontFamily: F.ui,
                  fontSize: 13,
                  color: T.antiqueGold,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ExternalLink size={13} />
                Preview Public Scan Page →
              </span>
            </div>
          </CardSection>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "white",
          borderTop: "1px solid rgba(110,15,45,0.10)",
          boxShadow: "0 -4px 20px rgba(44,24,16,0.07)",
          padding: "14px 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
          Last saved: Today at 2:34 PM
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: T.taupe,
              fontFamily: F.ui,
              fontWeight: 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} />
            Reset to Default
          </button>
          <button
            style={{
              background: "#6E0F2D",
              color: "white",
              border: "none",
              borderRadius: 999,
              padding: "9px 24px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
