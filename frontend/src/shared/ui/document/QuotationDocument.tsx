/**
 * QuotationDocument — design-system/07-DOCUMENTS.md Part H.2.
 * ═══════════════════════════════════════════════════════════════════════════
 * Third of the six document types. Per H.2 this collapses what the audit
 * (Part A.5) found as three separate quotation renderers — on inspection two
 * of those ("QuotationsSection" in finishing and in the worker portal) turned
 * out to be finishing-status *tracking* lists, not document renders at all
 * (no print/download action, no money totals as a document) — the real
 * document-shaped implementation was the live preview embedded in
 * `InvoiceGenerator` (mode="quotation"), which is what this replaces at its
 * one genuine call site (RaiseQuotationModal's review step).
 *
 * Unlike Invoice, a quotation carries no tax split (H.2: "no tax split, one
 * Est. GST @ x% line") and no HSN column — it's an estimate, not a supply.
 */
import * as React from "react";
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { TotalsBlock, type TotalsRow } from "./TotalsBlock";
import { TermsBlock } from "./TermsBlock";
import { formatPaise, toPaise } from "../../../lib/gst";

export interface QuotationLineItem {
  id: string;
  description: string;
  batchLabel?: string;
  qty?: number;
  /** Rate per unit, in integer paise. */
  ratePaise: number;
}

export interface QuotationDocumentProps {
  quotationNumber: string;
  quotationDate: string;
  validUntil?: string;
  firm: LetterheadFirm;
  customer: { name: string; address?: string; phone?: string; city?: string };
  items: QuotationLineItem[];
  /** A quotation shows one estimated-tax line, never a real CGST/SGST/IGST split (H.2). */
  estGstPct?: number;
  bulkOrderRef?: string;
  leadTime?: string;
  notes?: string;
  pageInfo?: { page: number; of: number };
}

const lineTotal = (it: QuotationLineItem) => it.ratePaise * (it.qty ?? 1);

export function QuotationDocument({
  quotationNumber, quotationDate, validUntil, firm, customer, items,
  estGstPct, bulkOrderRef, leadTime, notes, pageInfo,
}: QuotationDocumentProps) {
  const subtotalPaise = items.reduce((sum, it) => sum + lineTotal(it), 0);
  const estGstPaise = estGstPct ? Math.round(subtotalPaise * estGstPct / 100) : 0;
  const grandTotalPaise = subtotalPaise + estGstPaise;

  const meta: MetaField[] = [
    { label: "Quotation No", value: quotationNumber, code: true },
    { label: "Date", value: quotationDate },
    ...(validUntil ? [{ label: "Valid Until", value: validUntil }] : []),
    ...(bulkOrderRef ? [{ label: "Order Ref", value: bulkOrderRef, code: true }] : []),
    ...(leadTime ? [{ label: "Lead Time", value: leadTime }] : []),
  ];

  const totalsRows: TotalsRow[] = [
    { label: "Estimated Subtotal", amount: formatPaise(subtotalPaise) },
    ...(estGstPct ? [{ label: `Est. GST @ ${estGstPct}%`, amount: formatPaise(estGstPaise) }] : []),
    { label: "Estimated Total", amount: formatPaise(grandTotalPaise), grand: true },
  ];

  const terms = [
    "Prices are estimates and may vary at the time of order confirmation.",
    "This quotation is valid until the date stated above.",
    "Final invoice will reflect actual GST as applicable at dispatch.",
    "Payment and delivery terms to be confirmed on order.",
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Quotation" documentNumber={quotationNumber} />}
    >
      <PartyBlock
        parties={[{ label: "Quoted To", name: customer.name, address: customer.address || customer.city, phone: customer.phone }]}
        meta={meta}
      />

      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
          {
            header: "Description", width: "90mm",
            cell: row => (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "2.5mm", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", fontWeight: 600, color: "var(--doc-burgundy)" }}>{row.id}</span>
                  {row.batchLabel && (
                    <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-small)", color: "var(--doc-faint)" }}>{row.batchLabel}</span>
                  )}
                </div>
                <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm", lineHeight: 1.3 }}>{row.description}</div>
              </div>
            ),
          },
          { header: "Qty", align: "end", width: "16mm", cell: row => row.qty ?? 1 },
          { header: "Est. Rate", align: "end", width: "28mm", cell: row => formatPaise(row.ratePaise) },
          { header: "Est. Amount", align: "end", width: "30mm", cell: row => <strong>{formatPaise(lineTotal(row))}</strong> },
        ]}
        rows={items}
      />

      <TotalsBlock rows={totalsRows} />

      {/* H.2's mandatory disclaimer distinguishing this from a tax invoice. */}
      <div style={{ marginTop: "4mm", fontSize: "var(--doc-small)", color: "var(--doc-faint)", fontStyle: "italic" }}>
        This is a quotation, not a tax invoice.
      </div>

      <TermsBlock terms={terms} termsLabel="Terms & Conditions" />

      {notes && (
        <div style={{ marginTop: "4mm", fontSize: "var(--doc-small)", color: "var(--doc-muted)", lineHeight: 1.5 }}>{notes}</div>
      )}

      {/* H.2's acceptance block — bottom-left, distinct from Invoice's signature. */}
      <div style={{ marginTop: "8mm", paddingTop: "3.5mm", borderTop: "0.3mm solid var(--doc-rule)" }}>
        <div style={{ fontSize: "var(--doc-body)", fontWeight: 600, color: "var(--doc-burgundy)", marginBottom: "6mm" }}>
          Accepted by
        </div>
        <div style={{ display: "flex", gap: "10mm" }}>
          <div style={{ flex: 1, borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Signature</span>
          </div>
          <div style={{ flex: 1, borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Date</span>
          </div>
        </div>
      </div>
    </DocumentPage>
  );
}

/** Convenience: build QuotationLineItem[] from rupee prices, matching the
 * shape RaiseQuotationModal already collects (id → rupee-string price). */
export function toQuotationItems(
  sarees: { id: string; sareeId?: string; designCode?: string; sareeType?: string }[],
  batchOf: (sareeId: string) => string | undefined,
  prices: Record<string, string>
): QuotationLineItem[] {
  return sarees.map(s => {
    const sId = s.sareeId || s.id;
    return {
      id: sId,
      description: [s.designCode, s.sareeType].filter(Boolean).join(" · ") || "Saree",
      batchLabel: batchOf(sId),
      ratePaise: toPaise(Number(prices[sId]) || 0),
    };
  });
}
