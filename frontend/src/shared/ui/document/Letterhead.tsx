/**
 * Letterhead — design-system/07-DOCUMENTS.md Part G.1 ①②.
 * ═══════════════════════════════════════════════════════════════════════════
 * Firm identity + document title. The brand appears here and nowhere else
 * on the page except the ⑨ signature block's "For {Firm Name}" (Part X6 —
 * "the brand appears once, at the top"). Logo is the same asset the admin
 * TopNav uses (`imgBKLogo`), so the document and the app are recognizably
 * the same product.
 */
import * as React from "react";
import { imgBKLogo } from "../../constants/weaverImages";

export interface LetterheadFirm {
  name: string;
  address?: string;
  gstin?: string;
  phone?: string;
}

export const DEFAULT_LETTERHEAD_FIRM: LetterheadFirm = {
  name: "Beere Kesava & Brothers Silks",
  address: "Dharmavaram, Andhra Pradesh",
};

export interface LetterheadProps {
  firm?: LetterheadFirm;
  /** e.g. "TAX INVOICE", "QUOTATION", "PURCHASE ORDER". */
  title: string;
  /** e.g. "ORIGINAL FOR RECIPIENT" — printed top-right, above the title. */
  copyLabel?: string;
}

export function Letterhead({ firm = DEFAULT_LETTERHEAD_FIRM, title, copyLabel }: LetterheadProps) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8mm", minHeight: "32mm" }}>
        <div style={{ display: "flex", gap: "4mm", alignItems: "flex-start" }}>
          <img
            src={imgBKLogo}
            alt=""
            style={{ width: "18mm", height: "18mm", objectFit: "contain", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--doc-brand)", fontWeight: 600, lineHeight: 1.1, color: "var(--print-brand)" }}>
              {firm.name}
            </div>
            {firm.address && (
              <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-muted)", marginTop: "1mm", maxWidth: "90mm" }}>
                {firm.address}
              </div>
            )}
            <div style={{ display: "flex", gap: "4mm", marginTop: "1mm", flexWrap: "wrap" }}>
              {firm.gstin && (
                <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--print-ink-muted)" }}>
                  GSTIN {firm.gstin}
                </span>
              )}
              {firm.phone && (
                <span style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-muted)" }}>{firm.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {copyLabel && (
            <div style={{ fontSize: "var(--doc-small)", color: "var(--print-ink-muted)", marginBottom: "2mm" }}>{copyLabel}</div>
          )}
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--doc-title)", fontWeight: 600, color: "var(--print-brand)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {title}
          </div>
        </div>
      </div>
      {/* Part G.1 ② — the one gold rule on the page */}
      <div style={{ height: "1pt", background: "var(--print-accent)", marginTop: "4mm" }} />
    </div>
  );
}
