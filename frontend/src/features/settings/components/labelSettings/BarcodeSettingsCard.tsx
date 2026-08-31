import { Lock } from "lucide-react";
import { CardSection, F, T } from "./primitives";

export function BarcodeSettingsCard() {
  return (
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
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: T.taupe,
          }}
        >
          bkbsilks.com/sari/&#123;sari_code&#125;
        </div>
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Each barcode links to the public saree detail page when scanned
      </div>
    </CardSection>
  );
}
