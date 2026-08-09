/**
 * PartyBlock — design-system/07-DOCUMENTS.md Part G.1 ③.
 * ═══════════════════════════════════════════════════════════════════════════
 * Two-column, 50/50: the counterparty (Bill To / Ship To / Supplier —
 * varies per document type) on the left, document metadata on the right.
 * "Place of supply" is mandatory on tax documents — it's what drives the
 * CGST/SGST vs IGST split (Part I.1).
 */
import * as React from "react";

export interface PartyDetail {
  /** e.g. "BILL TO", "SHIP TO", "SUPPLIER" */
  label: string;
  name: string;
  address?: string;
  gstin?: string;
  placeOfSupply?: string;
}

export interface MetaField {
  label: string;
  value: React.ReactNode;
  code?: boolean;
}

export interface PartyBlockProps {
  parties: PartyDetail[];
  meta: MetaField[];
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "var(--doc-table-head)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--print-ink-muted)" }}>
      {children}
    </div>
  );
}

export function PartyBlock({ parties, meta }: PartyBlockProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6mm", marginTop: "6mm" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
        {parties.map((p, i) => (
          <div key={i}>
            <Label>{p.label}</Label>
            <div style={{ fontSize: "var(--doc-body)", fontWeight: 600, color: "var(--print-ink)", marginTop: "1mm" }}>{p.name}</div>
            {p.address && (
              <div style={{ fontSize: "var(--doc-body)", color: "var(--print-ink)", marginTop: "0.5mm", lineHeight: 1.4 }}>{p.address}</div>
            )}
            {p.gstin && (
              <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--print-ink)", marginTop: "0.5mm" }}>GSTIN {p.gstin}</div>
            )}
            {p.placeOfSupply && (
              <div style={{ fontSize: "var(--doc-body)", color: "var(--print-ink-muted)", marginTop: "0.5mm" }}>Place of supply: {p.placeOfSupply}</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5mm", alignItems: "flex-end" }}>
        {meta.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "6mm", width: "100%" }}>
            <span style={{ fontSize: "var(--doc-table-head)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--print-ink-muted)" }}>{m.label}</span>
            <span
              style={{
                fontSize: m.code ? "var(--doc-code)" : "var(--doc-body)",
                fontFamily: m.code ? "var(--font-code)" : "var(--font-ui)",
                color: "var(--print-ink)",
                textAlign: "right",
              }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
