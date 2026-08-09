/**
 * Letterhead — design-system/07-DOCUMENTS.md Part G.1 ①②.
 * ═══════════════════════════════════════════════════════════════════════════
 * Full-bleed brand gradient band carrying firm identity + document title,
 * closed by the gold rule. Logo is the same asset the admin TopNav uses
 * (`imgBKLogo`), so a printed document is recognisably the same product as
 * the app it came from.
 *
 * Pass as <DocumentPage band={<Letterhead … />}> — it renders outside the
 * body's side margins so the gradient reaches the paper edge.
 */
import * as React from "react";
import { imgBKLogo } from "../../constants/weaverImages";

export interface LetterheadFirm {
  name: string;
  tagline?: string;
  address?: string;
  gstin?: string;
  phone?: string;
}

export const DEFAULT_LETTERHEAD_FIRM: LetterheadFirm = {
  name: "Beere Kesava & Brothers Silks",
  tagline: "Silk Sarees · Handloom Manufacturers · Since 1999",
  address: "Dharmavaram, Andhra Pradesh",
};

export interface LetterheadProps {
  firm?: LetterheadFirm;
  /** e.g. "Tax Invoice", "Quotation", "Purchase Order". */
  title: string;
  /** Document number, shown under the title in mono. */
  documentNumber?: string;
  /** e.g. "ORIGINAL FOR RECIPIENT" — small, above the title. */
  copyLabel?: string;
}

export function Letterhead({ firm = DEFAULT_LETTERHEAD_FIRM, title, documentNumber, copyLabel }: LetterheadProps) {
  return (
    <div className="bk-doc__band">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8mm" }}>
        <div style={{ display: "flex", gap: "4.5mm", alignItems: "flex-start" }}>
          <img src={imgBKLogo} alt="" className="bk-doc__logo" />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)", fontSize: "var(--doc-brand-size)",
                fontWeight: 600, lineHeight: 1.12, color: "#FFFDF9", letterSpacing: "0.01em",
              }}
            >
              {firm.name}
            </div>
            {firm.tagline && (
              <div style={{ fontSize: "var(--doc-small)", color: "#E7C983", marginTop: "1.2mm", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {firm.tagline}
              </div>
            )}
            {firm.address && (
              <div style={{ fontSize: "var(--doc-small)", color: "rgba(255,253,249,0.78)", marginTop: "1.8mm", maxWidth: "88mm", lineHeight: 1.45 }}>
                {firm.address}
              </div>
            )}
            <div style={{ display: "flex", gap: "5mm", marginTop: "1mm", flexWrap: "wrap" }}>
              {firm.gstin && (
                <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "rgba(255,253,249,0.78)" }}>
                  GSTIN {firm.gstin}
                </span>
              )}
              {firm.phone && (
                <span style={{ fontSize: "var(--doc-small)", color: "rgba(255,253,249,0.78)" }}>{firm.phone}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {copyLabel && (
            <div style={{ fontSize: "var(--doc-small)", color: "rgba(255,253,249,0.62)", marginBottom: "1.5mm", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {copyLabel}
            </div>
          )}
          <div
            style={{
              fontFamily: "var(--font-display)", fontSize: "var(--doc-title)", fontWeight: 600,
              color: "#E7C983", textTransform: "uppercase", letterSpacing: "0.10em", lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          {documentNumber && (
            <div
              style={{
                fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "#FFFDF9",
                marginTop: "2mm", background: "rgba(255,253,249,0.12)",
                border: "0.25mm solid rgba(231,201,131,0.45)", borderRadius: "1.2mm",
                padding: "1.2mm 3mm", display: "inline-block",
              }}
            >
              {documentNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
