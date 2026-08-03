import React from "react";
import { Printer } from "lucide-react";
import { CardSection, F, T } from "./primitives";

export function PrinterConfigCard({
  printer, setPrinter, connectionType, setConnectionType, printerConnected,
}: {
  printer: string; setPrinter: (v: string) => void;
  connectionType: string; setConnectionType: (v: string) => void;
  printerConnected: boolean;
}) {
  return (
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
  );
}
