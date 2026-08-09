/**
 * ReceiptDocument — design-system/07-DOCUMENTS.md Part H.5.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fifth of the six document types, and the only one that isn't full A4 —
 * H.5 specifies A5 landscape (210×148mm), via DocumentPage's `size` prop.
 * Deliberately compact: received-from, amount (figures + words), mode,
 * reference, and the running balance after this payment — no line-item
 * table, no GST, no letterhead band (a receipt is a slip, not a formal
 * document with a full identity band).
 */
import * as React from "react";
import { DocumentPage } from "./DocumentPage";
import { amountInWords, formatPaise } from "../../../lib/gst";

export interface ReceiptDocumentProps {
  receiptNumber: string;
  receiptDate: string;
  firmName: string;
  receivedFrom: string;
  amountPaise: number;
  mode: string;
  reference?: string;
  againstInvoices?: string[];
  balanceOutstandingPaise?: number;
  receivedBy: string;
  pageInfo?: { page: number; of: number };
}

export function ReceiptDocument({
  receiptNumber, receiptDate, firmName, receivedFrom, amountPaise, mode,
  reference, againstInvoices, balanceOutstandingPaise, receivedBy, pageInfo,
}: ReceiptDocumentProps) {
  return (
    <DocumentPage size="a5-landscape" pageInfo={pageInfo}>
      <div style={{ paddingTop: "6mm", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "0.3mm solid var(--doc-rule)", paddingBottom: "4mm" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--doc-title)", color: "var(--doc-burgundy)" }}>{firmName}</div>
          <div className="bk-doc__eyebrow" style={{ marginTop: "1mm" }}>Payment Receipt</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", fontWeight: 700, color: "var(--doc-burgundy)" }}>{receiptNumber}</div>
          <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", marginTop: "1mm" }}>{receiptDate}</div>
        </div>
      </div>

      <div style={{ marginTop: "5mm", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4mm" }}>
        <div className="bk-doc__card">
          <div className="bk-doc__eyebrow">Received From</div>
          <div style={{ fontSize: "var(--doc-heading)", fontWeight: 700, color: "var(--doc-ink)", marginTop: "1.5mm" }}>{receivedFrom}</div>
          {reference && (
            <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--doc-muted)", marginTop: "1.5mm" }}>Ref: {reference}</div>
          )}
          {againstInvoices && againstInvoices.length > 0 && (
            <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", marginTop: "1.5mm" }}>
              Against: {againstInvoices.join(", ")}
            </div>
          )}
        </div>
        <div className="bk-doc__totals-card">
          <div className="bk-doc__totals-grand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.2mm 4mm" }}>
            <span style={{ fontSize: "var(--doc-body)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>Amount Received</span>
            <span style={{ fontSize: "var(--doc-total)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatPaise(amountPaise)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2.2mm 4mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Mode</span>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-ink)", fontWeight: 600 }}>{mode}</span>
          </div>
          {balanceOutstandingPaise !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2.2mm 4mm", borderTop: "0.25mm solid var(--doc-rule-soft)" }}>
              <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Balance Outstanding</span>
              <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-ink)", fontWeight: 600 }}>{formatPaise(balanceOutstandingPaise)}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "4mm" }}>
        <div className="bk-doc__words" style={{ padding: "2.5mm 3.5mm" }}>
          <div style={{ fontSize: "var(--doc-amount-words)", fontWeight: 600, color: "var(--doc-ink)" }}>
            {amountInWords(amountPaise)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: "4mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", fontStyle: "italic" }}>
          This is a computer-generated receipt.
        </div>
        <div style={{ textAlign: "center", minWidth: "42mm" }}>
          <div style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Received by — {receivedBy}</span>
          </div>
        </div>
      </div>
    </DocumentPage>
  );
}
