import React from "react";
import { CardSection, F, T } from "./primitives";

export function LabelDimensionsCard({ labelSize, setLabelSize }: {
  labelSize: string; setLabelSize: (v: string) => void;
}) {
  return (
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
  );
}
