/**
 * InvoiceDocument — design-system/07-DOCUMENTS.md Part H.1.
 * ═══════════════════════════════════════════════════════════════════════════
 * The Tax Invoice, composed entirely from shared/ui/document primitives —
 * this is the render tree passed to both the screen preview (DocumentViewer)
 * and useDocument().print()/.download(), so what you see is what prints.
 *
 * All money arithmetic is on integer paise (lib/gst), never parseFloat —
 * the exact bug Part A.4 flags in the pre-existing InvoiceGenerator.
 */
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { TotalsBlock, type TotalsRow } from "./TotalsBlock";
import { TaxSummary } from "./TaxSummary";
import { AmountInWords } from "./AmountInWords";
import { TermsBlock, type BankDetails } from "./TermsBlock";
import { SignatureBlock } from "./SignatureBlock";
import { taxSplitKind, taxLines, hsnRate, DEFAULT_SAREE_HSN, amountInWords, roundOff, formatPaise } from "../../../lib/gst";

export interface InvoiceLineItem {
  /** Entity code shown above the description, e.g. a saree id. */
  id: string;
  description: string;
  /** HSN code — defaults to 5007 (silk sarees) when omitted. */
  hsn?: string;
  batchLabel?: string;
  qty?: number;
  /** Rate per unit, in integer paise. */
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
  copyLabel?: string;
  pageInfo?: { page: number; of: number };
}

const lineTotal = (it: InvoiceLineItem) => it.ratePaise * (it.qty ?? 1);

export function InvoiceDocument({
  invoiceNumber, invoiceDate, dueDate, firm, bank, customer, items,
  applyGst = true, bulkOrderRef, dispatch, statusLabel, notes, copyLabel, pageInfo,
}: InvoiceDocumentProps) {
  const subtotalPaise = items.reduce((sum, it) => sum + lineTotal(it), 0);
  const kind = taxSplitKind(firm.gstin, customer.placeOfSupplyCode ?? firm.placeOfSupplyCode);

  // Group by HSN for the rate-wise tax summary (Part I.3) — mandatory once
  // more than one rate appears; cheap to always compute, shown when useful.
  const byHsn = new Map<string, { taxablePaise: number; ratePct: number }>();
  for (const it of items) {
    const hsn = it.hsn || DEFAULT_SAREE_HSN;
    const ratePct = hsnRate(hsn);
    const entry = byHsn.get(hsn) ?? { taxablePaise: 0, ratePct };
    entry.taxablePaise += lineTotal(it);
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
  // CGST and SGST always split the rate — and therefore the tax — exactly in
  // half by construction (taxLines), so the totals row halves the sum rather
  // than re-parsing already-formatted display strings.
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
  // Only name a rate in the totals labels when the document actually carries
  // exactly one. With mixed HSN slabs (e.g. 5% sarees + 12% zari) the summed
  // tax belongs to no single rate, and printing "IGST @ 5%" against a figure
  // that includes 12% tax misstates the document — the rate-wise TaxSummary
  // above is what carries the per-slab breakdown in that case.
  const singleRate = byHsn.size === 1 ? hsnRate(items[0]?.hsn || DEFAULT_SAREE_HSN) : null;
  const rateSuffix = (share: number) => (singleRate === null ? "" : ` @ ${singleRate * share}%`);

  const meta: MetaField[] = [
    { label: "Invoice No", value: invoiceNumber, code: true },
    { label: "Date", value: invoiceDate },
    ...(dueDate ? [{ label: "Due Date", value: dueDate }] : []),
    ...(bulkOrderRef ? [{ label: "Order Ref", value: bulkOrderRef, code: true }] : []),
  ];

  const totalsRows: TotalsRow[] = [
    { label: "Taxable Value", amount: formatPaise(subtotalPaise) },
    ...(applyGst
      ? kind === "intra"
        ? [
            { label: `CGST${rateSuffix(0.5)}`, amount: formatPaise(totalTaxPaise / 2) },
            { label: `SGST${rateSuffix(0.5)}`, amount: formatPaise(totalTaxPaise / 2) },
          ]
        : [{ label: `IGST${rateSuffix(1)}`, amount: formatPaise(totalTaxPaise) }]
      : []),
    ...(adjustmentPaise !== 0
      ? [{ label: "Round Off", amount: `${adjustmentPaise > 0 ? "+" : "−"}${formatPaise(Math.abs(adjustmentPaise))}` }]
      : []),
    { label: "Total", amount: formatPaise(roundedPaise), grand: true },
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Tax Invoice" documentNumber={invoiceNumber} copyLabel={copyLabel} />}
    >
      <PartyBlock
        parties={[
          {
            label: "Bill To",
            name: customer.name,
            address: customer.address,
            phone: customer.phone,
            gstin: customer.gstin,
            placeOfSupply: customer.placeOfSupplyName,
          },
        ]}
        meta={meta}
      />

      {statusLabel && (
        <div style={{ marginTop: "4mm" }}>
          <span
            style={{
              display: "inline-block", fontSize: "var(--doc-small)", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--doc-gold-text)",
              background: "rgba(200,155,71,0.14)", border: "0.3mm solid var(--doc-gold)",
              borderRadius: "1.2mm", padding: "1.4mm 4mm",
            }}
          >
            {statusLabel}
          </span>
        </div>
      )}

      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
          {
            header: "Description", width: "82mm",
            cell: row => (
              <div>
                {/* Entity code and batch share one line — they're both codes,
                    and appending the batch to the prose description was
                    wrapping most rows onto a third line. */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "2.5mm", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", fontWeight: 600, color: "var(--doc-burgundy)" }}>
                    {row.id}
                  </span>
                  {row.batchLabel && (
                    <span style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-small)", color: "var(--doc-faint)" }}>
                      {row.batchLabel}
                    </span>
                  )}
                </div>
                <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm", lineHeight: 1.3 }}>{row.description}</div>
              </div>
            ),
          },
          { header: "HSN", width: "15mm", cell: row => <span style={{ fontFamily: "var(--font-code)" }}>{row.hsn || DEFAULT_SAREE_HSN}</span> },
          { header: "Qty", align: "end", width: "13mm", cell: row => row.qty ?? 1 },
          { header: "Rate", align: "end", width: "24mm", cell: row => formatPaise(row.ratePaise) },
          { header: "Amount", align: "end", width: "26mm", cell: row => <strong>{formatPaise(lineTotal(row))}</strong> },
        ]}
        rows={items}
      />

      {/* Part I.3 makes the rate-wise summary mandatory only when the document
          carries MORE THAN ONE GST rate. On a single-rate invoice it just
          restates the totals block line for line, and costs a third of a page
          doing it — so it renders only when it actually adds information. */}
      {applyGst && byHsn.size > 1 && (
        <TaxSummary rows={taxSummaryRows} totalRow={taxSummaryTotal} interState={kind === "inter"} />
      )}

      {/* Amount-in-words beside the money, rather than stacked above it — the
          conventional Indian tax-invoice arrangement, and it keeps a typical
          invoice on one sheet instead of spilling a near-empty second page. */}
      <div
        className="bk-doc__summary"
        style={{ display: "grid", gridTemplateColumns: "1fr 88mm", gap: "5mm", marginTop: "5mm", alignItems: "start" }}
      >
        <AmountInWords words={amountInWords(roundedPaise)} />
        <TotalsBlock rows={totalsRows} />
      </div>

      <TermsBlock
        bank={bank}
        termsLabel={dispatch ? "Dispatch Details" : "Terms & Conditions"}
        terms={
          dispatch
            ? [
                `LR Number — ${dispatch.lrNumber || "—"}`,
                `Transport — ${dispatch.transportCompany || "—"}`,
                `Vehicle — ${dispatch.vehicleNumber || "—"}`,
                `Dispatch Date — ${dispatch.dispatchDate || "—"}`,
              ]
            : undefined
        }
      />

      {notes && (
        <div style={{ marginTop: "4mm", fontSize: "var(--doc-small)", color: "var(--doc-muted)", lineHeight: 1.5 }}>{notes}</div>
      )}

      <SignatureBlock firmName={firm.name} />
    </DocumentPage>
  );
}
