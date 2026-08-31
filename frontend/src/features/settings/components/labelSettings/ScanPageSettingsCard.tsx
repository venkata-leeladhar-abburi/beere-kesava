import { ExternalLink, Lock } from "lucide-react";
import { CardSection, F, T, Toggle } from "./primitives";

export type ScanFields = {
  photo: boolean; code: boolean; weaver: boolean; fabric: boolean;
  colour: boolean; jari: boolean; dispatchDate: boolean; productionStatus: boolean;
};

const scanFieldRows: { key: keyof ScanFields; label: string; note?: string }[] = [
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

export function ScanPageSettingsCard({ scanFields, toggleScanField }: {
  scanFields: ScanFields; toggleScanField: (key: keyof ScanFields) => void;
}) {
  return (
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
                    fontSize: 12,
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
                fontSize: 12,
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
  );
}
