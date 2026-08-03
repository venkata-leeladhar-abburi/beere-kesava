import React from "react";
import { AlertTriangle } from "lucide-react";
import { CardSection, F, T, Toggle } from "./primitives";

export type LabelFields = { barcode: boolean; code: boolean; weaver: boolean; date: boolean; branding: boolean };

const fieldRows: { key: keyof LabelFields; label: string }[] = [
  { key: "barcode", label: "Barcode" },
  { key: "code", label: "Unique Saree Code" },
  { key: "weaver", label: "Weaver Name" },
  { key: "date", label: "QC / Dispatch Date" },
  { key: "branding", label: "BKB Silks Branding" },
];

export function VisibleFieldsCard({ fields, toggleField }: {
  fields: LabelFields; toggleField: (key: keyof LabelFields) => void;
}) {
  return (
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
  );
}
