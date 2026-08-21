import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T, F } from "./WorkerQCTypes";

/**
 * The QC result card, shared by "Completed Today" and "QC History".
 *
 * Rebuilt for scanability: one status rail, the entity code as the anchor at
 * codeMd, then a labelled two-cell data row so the saree type and the payable
 * amount are readable as data rather than as two loose chips.
 */
export function WorkerQCPassedCard({
  id,
  weaver,
  date,
  sareeType,
  payable,
}: {
  id: string;
  weaver: string;
  date: string;
  sareeType?: string;
  payable: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.bdr}`,
        borderLeft: `4px solid ${T.green}`,
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(74,6,27,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Identity */}
      <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 500, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {id}
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {weaver}
          </div>
        </div>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
            fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.green,
            background: T.bgGreen, border: "1px solid rgba(31,119,78,0.20)",
            padding: "3px 9px", borderRadius: 999,
          }}
        >
          <CheckCircle2 size={13} /> Passed
        </span>
      </div>

      {/* Data row — labelled so the two numbers are unambiguous */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start", padding: "12px 16px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Saree type</div>
          <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: T.brown, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sareeType || "—"}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Payable</div>
          <div style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, color: T.green, marginTop: 2, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
            {payable}
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 16px 12px", fontFamily: F.u, fontSize: 12, color: T.muted }}>
        Inspected {date}
      </div>
    </div>
  );
}
