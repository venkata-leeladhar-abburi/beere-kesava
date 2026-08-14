/**
 * PartyBlock — design-system/07-DOCUMENTS.md Part G.1 ③.
 * ═══════════════════════════════════════════════════════════════════════════
 * Counterparty card(s) on the left (Bill To / Ship To / Supplier — varies
 * per document type), document metadata card on the right.
 * "Place of supply" is mandatory on tax documents — it's what drives the
 * CGST/SGST vs IGST split (Part I.1).
 */
import * as React from "react";

export interface PartyDetail {
  /** e.g. "Bill To", "Ship To", "Supplier" */
  label: string;
  name: string;
  address?: string;
  phone?: string;
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

export function PartyBlock({ parties, meta }: PartyBlockProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "5mm", marginTop: "5mm", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "3mm" }}>
        {parties.map((p) => (
          <div key={p.label} className="bk-doc__card bk-doc__card--accent">
            <div className="bk-doc__eyebrow">{p.label}</div>
            <div style={{ fontSize: "var(--doc-heading)", fontWeight: 700, color: "var(--doc-ink)", marginTop: "1.5mm" }}>{p.name}</div>
            {p.address && (
              <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-muted)", marginTop: "1mm", lineHeight: 1.5 }}>{p.address}</div>
            )}
            {p.phone && (
              <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)", marginTop: "0.8mm" }}>{p.phone}</div>
            )}
            {p.gstin && (
              <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-burgundy)", fontWeight: 600, marginTop: "0.8mm" }}>
                GSTIN {p.gstin}
              </div>
            )}
            {p.placeOfSupply && (
              <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", marginTop: "0.8mm" }}>
                Place of supply: {p.placeOfSupply}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bk-doc__card">
        <div style={{ display: "flex", flexDirection: "column", gap: "2mm" }}>
          {meta.map((m, i) => (
            <div
              key={m.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "5mm",
                paddingBottom: i < meta.length - 1 ? "2mm" : 0,
                borderBottom: i < meta.length - 1 ? "0.25mm solid var(--doc-rule-soft)" : "none",
              }}
            >
              <span style={{ fontSize: "var(--doc-table-head)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--doc-muted)" }}>
                {m.label}
              </span>
              <span
                style={{
                  fontSize: m.code ? "var(--doc-code)" : "var(--doc-body)",
                  fontFamily: m.code ? "var(--font-code)" : "var(--font-ui)",
                  fontWeight: 600,
                  color: "var(--doc-ink)",
                  textAlign: "right",
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
