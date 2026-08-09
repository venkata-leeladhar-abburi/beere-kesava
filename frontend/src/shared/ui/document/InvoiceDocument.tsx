/**
 * InvoiceDocument — design-system/07-DOCUMENTS.md Part H.1.
 * ═══════════════════════════════════════════════════════════════════════════
 * The Tax Invoice, composed entirely from shared/ui/document primitives —
 * this is the render tree passed to both the screen preview (DocumentViewer)
 * and useDocument().print()/.download(), so what you see is what prints.
 *
 * All money arithmetic here is on integer paise (lib/gst), never parseFloat
 * — the exact bug Part A.4 flags in the pre-existing InvoiceGenerator.
 */
import * as React from "react";
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { TotalsBlock } from "./TotalsBlock";
import { TaxSummary } from "./TaxSummary";
import { AmountInWords } from "./AmountInWords";
import { TermsBlock, type BankDetails } from "./TermsBlock";
import { SignatureBlock } from "./SignatureBlock";
import { taxSplitKind, taxLines, hsnRate, DEFAULT_SAREE_HSN, amountInWords, roundOff, formatPaise } from "../../../lib/gst";

export interface InvoiceLineItem {
  id: string;
  description: string;
  /** HSN code — defaults to 5007 (silk sarees) when omitted. */
  hsn?: string;
  batchLabel?: string;
  ratePaise: number;
}

export interface InvoiceParty {
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  /** 2-digit GST state code, e.g. "36" for Telangana — drives CGST/SGST vs IGST. */
  placeOfSupplyCode?: string;
  placeOfSupplyName?: string;
}

export interface InvoiceDocumentProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  firm: LetterheadFirm & { placeOfSupplyCode?: string };
  bank?: BankDetails;
  customer: InvoiceParty;
  items: InvoiceLineItem[];
  applyGst?: boolean;
  bulkOrderRef?: string;
  dispatch?: { lrNumber?: string; transportCompany?: string; vehicleNumber?: string; dispatchDate?: string };
  statusLabel?: string;
  notes?: string;
  pageInfo?: { page: number; of: number };
}

export function InvoiceDocument({
  invoiceNumber, invoiceDate, dueDate, firm, bank, customer, items,
  applyGst = true, bulkOrderRef, dispatch, statusLabel, notes, pageInfo,
}: InvoiceDocumentProps) {
  const subtotalPaise = items.reduce((sum, it) => sum + it.ratePaise, 0);
  const kind = taxSplitKind(firm.gstin, customer.placeOfSupplyCode ?? firm.placeOfSupplyCode);

  // Group by HSN for the rate-wise tax summary (Part I.3) — mandatory once
  // more than one rate appears; harmless to always compute, only shown when useful.
  const byHsn = new Map<string, { taxablePaise: number; ratePct: number }>();
  for (const it of items) {
    const hsn = it.hsn || DEFAULT_SAREE_HSN;
    const ratePct = hsnRate(hsn);
    const entry = byHsn.get(hsn) ?? { taxablePaise: 0, ratePct };
    entry.taxablePaise += it.ratePaise;
    byHsn.set(hsn, entry);
  }

  const taxSummaryRows = applyGst
    ? Array.from(byHsn.entries()).map(([hsn, { taxablePaise, ratePct }]) => {
        const lines = taxLines(taxablePaise, ratePct, kind);
        const totalTaxPaise = lines.reduce((s, l) => s + l.amountPaise, 0);
        return {
          hsn,
          taxableLabel: formatPaise(taxablePaise),
          cgstLabel: kind === "intra" ? `${lines[0].ratePct}%  ${formatPaise(lines[0].amountPaise)}` : undefined,
          sgstLabel: kind === "intra" ? `${lines[1].ratePct}%  ${formatPaise(lines[1].amountPaise)}` : undefined,
          igstLabel: kind === "inter" ? `${lines[0].ratePct}%  ${formatPaise(lines[0].amountPaise)}` : undefined,
          totalTaxLabel: formatPaise(totalTaxPaise),
          totalTaxPaise,
        };
      })
    : [];

  const totalTaxPaise = taxSummaryRows.reduce((s, r) => s + r.totalTaxPaise, 0);
  // CGST/SGST always split the rate (and therefore the tax) exactly in half
  // by construction (taxLines), so the totals row can just halve the sum
  // rather than re-parsing already-formatted display strings.
  const taxSummaryTotal = {
    hsn: "",
    taxableLabel: formatPaise(subtotalPaise),
    cgstLabel: kind === "intra" ? formatPaise(totalTaxPaise / 2) : undefined,
    sgstLabel: kind === "intra" ? formatPaise(totalTaxPaise / 2) : undefined,
    igstLabel: kind === "inter" ? formatPaise(totalTaxPaise) : undefined,
    totalTaxLabel: formatPaise(totalTaxPaise),
  };

  const grandTotalExact = subtotalPaise + totalTaxPaise;
  const { roundedPaise, adjustmentPaise } = roundOff(grandTotalExact);

  const meta: MetaField[] = [
    { label: "Invoice No", value: invoiceNumber, code: true },
    { label: "Date", value: invoiceDate },
    ...(dueDate ? [{ label: "Due Date", value: dueDate }] : []),
    ...(bulkOrderRef ? [{ label: "Order Ref", value: bulkOrderRef, code: true }] : []),
  ];

  const totalsRows = [
    { label: "Taxable Value", amount: formatPaise(subtotalPaise) },
    ...(applyGst
      ? kind === "intra"
        ? [
            { label: `CGST @ ${hsnRate(items[0]?.hsn || DEFAULT_SAREE_HSN) / 2}%`, amount: formatPaise(totalTaxPaise / 2) },
            { label: `SGST @ ${hsnRate(items[0]?.hsn || DEFAULT_SAREE_HSN) / 2}%`, amount: formatPaise(totalTaxPaise / 2) },
          ]
        : [{ label: `IGST @ ${hsnRate(items[0]?.hsn || DEFAULT_SAREE_HSN)}%`, amount: formatPaise(totalTaxPaise) }]
      : []),
    ...(adjustmentPaise !== 0 ? [{ label: "Round Off", amount: `${adjustmentPaise > 0 ? "+" : "−"}${formatPaise(Math.abs(adjustmentPaise))}` }] : []),
    { label: "Total", amount: formatPaise(roundedPaise), grand: true },
  ];

  return (
    <DocumentPage pageInfo={pageInfo}>
      <Letterhead firm={firm} title="Tax Invoice" />
      <PartyBlock
        parties={[
          {
            label: "Bill To",
            name: customer.name,
            address: customer.address,
            gstin: customer.gstin,
            placeOfSupply: customer.placeOfSupplyName,
          },
        ]}
        meta={meta}
      />
      {statusLabel && (
        <div style={{ marginTop: "3mm", display: "inline-block", fontSize: "var(--doc-small)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--print-ink-faint)", border: "0.5pt solid var(--print-ink-faint)", padding: "1mm 3mm" }}>
          {statusLabel}
        </div>
      )}
      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "8mm", cell: (_row, i) => i + 1 },
          {
            header: "Description", width: "84mm",
            cell: row => (
              <div>
                <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", color: "var(--print-ink)" }}>{row.id}</div>
                <div>{row.description}{row.batchLabel ? ` · ${row.batchLabel}` : ""}</div>
              </div>
            ),
          },
          { header: "HSN", width: "16mm", cell: row => <span style={{ fontFamily: "var(--font-code)" }}>{row.hsn || DEFAULT_SAREE_HSN}</span> },
          { header: "Amount", align: "end", width: "26mm", cell: row => formatPaise(row.ratePaise) },
        ]}
        rows={items}
      />
      <TotalsBlock rows={totalsRows} />
      {applyGst && taxSummaryRows.length > 0 && (
        <TaxSummary rows={taxSummaryRows} totalRow={taxSummaryTotal} interState={kind === "inter"} />
      )}
      <AmountInWords words={amountInWords(roundedPaise)} />
      {(bank || dispatch) && (
        <TermsBlock
          bank={bank}
          terms={
            dispatch
              ? [
                  `LR Number: ${dispatch.lrNumber || "—"}`,
                  `Transport: ${dispatch.transportCompany || "—"}`,
                  `Vehicle: ${dispatch.vehicleNumber || "—"}`,
                  `Dispatch Date: ${dispatch.dispatchDate || "—"}`,
                ]
              : undefined
          }
        />
      )}
      {notes && (
        <div style={{ marginTop: "4mm", fontSize: "var(--doc-small)", color: "var(--print-ink-muted)" }}>{notes}</div>
      )}
      <SignatureBlock firmName={firm.name} />
    </DocumentPage>
  );
}
