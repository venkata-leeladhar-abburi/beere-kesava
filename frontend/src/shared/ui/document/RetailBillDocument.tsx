/**
 * RetailBillDocument — the counter bill for a retail sale.
 * ═══════════════════════════════════════════════════════════════════════════
 * Composed from the same primitives as the other document types, so a bill
 * handed to a customer over the counter is recognisably the same stationery
 * as the invoices and POs the firm sends out.
 *
 * Unlike InvoiceDocument this is not a tax document — no GSTIN, no HSN, no
 * CGST/SGST split. A shop bill records what was bought and what was paid; the
 * taxable-supply paperwork is the wholesale flow's job.
 *
 * One bill covers the whole basket. The backend records one SaleRecord per
 * saree, so `saleRefs` carries every reference on the bill and `billRef` (the
 * first) is what the document is numbered and filed under.
 */
import { DocumentPage } from "./DocumentPage";
import { Letterhead, DEFAULT_LETTERHEAD_FIRM, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { TotalsBlock, type TotalsRow } from "./TotalsBlock";
import { amountInWords, formatPaise, toPaise } from "../../../lib/gst";

export interface RetailBillLineItem {
  /** The physical saree tag — what the customer can point at. */
  sareeId: string;
  /** Design name, e.g. "Kanchi Border Pattu". */
  name?: string;
  /** "CODE · Type", as the sale flow builds it. */
  type?: string;
  design?: string;
  /** Rupees. */
  soldPrice: number;
  /** Rupees — shown struck through when it differs from soldPrice. */
  originalPrice?: number;
}

export interface RetailBillDocumentProps {
  billRef: string;
  billDate: string;
  firm?: LetterheadFirm;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  lines: RetailBillLineItem[];
  /** Rupees. */
  total: number;
  paymentMethod?: string;
  paymentRef?: string;
  soldBy?: string;
  /** Every SaleRecord reference on this bill — listed when the basket has more than one. */
  saleRefs?: string[];
  pageInfo?: { page: number; of: number };
}

/** "upi" → "UPI", "cash" → "Cash". */
function paymentLabel(method?: string): string {
  if (!method) return "—";
  const upper = method.toUpperCase();
  return upper === "UPI" ? "UPI" : upper.charAt(0) + method.slice(1).toLowerCase();
}

export function RetailBillDocument({
  billRef, billDate, firm = DEFAULT_LETTERHEAD_FIRM, customerName, customerPhone,
  customerAddress, lines, total, paymentMethod, paymentRef, soldBy, saleRefs, pageInfo,
}: RetailBillDocumentProps) {
  const retailTotal = lines.reduce((sum, l) => sum + (l.originalPrice ?? l.soldPrice), 0);
  const discount = retailTotal - total;

  const meta: MetaField[] = [
    { label: "Bill No", value: billRef, code: true },
    { label: "Date", value: billDate },
    { label: "Payment", value: paymentLabel(paymentMethod) },
    ...(paymentRef ? [{ label: "Reference", value: paymentRef, code: true }] : []),
  ];

  const totalsRows: TotalsRow[] = [
    // The struck-through retail price sits on each line already; this row is
    // what makes the saving legible as one number.
    ...(discount > 0
      ? [
          { label: "Retail Total", amount: formatPaise(toPaise(retailTotal)) },
          { label: "Discount", amount: `− ${formatPaise(toPaise(discount))}` },
        ]
      : []),
    { label: "Total Paid", amount: formatPaise(toPaise(total)), grand: true },
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Retail Bill" documentNumber={billRef} />}
    >
      <PartyBlock
        parties={[
          {
            label: "Billed To",
            name: customerName || "Walk-in Customer",
            address: customerAddress,
            phone: customerPhone,
          },
        ]}
        meta={meta}
      />

      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
          {
            header: "Saree",
            width: "58mm",
            cell: (row: RetailBillLineItem) => (
              <div>
                <div style={{ fontFamily: "var(--font-code)", fontWeight: 700, color: "var(--doc-burgundy)" }}>
                  {row.sareeId}
                </div>
                {(row.type || row.name) && (
                  <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm" }}>
                    {row.type && row.type !== "—" ? row.type : row.name}
                  </div>
                )}
              </div>
            ),
          },
          {
            header: "Design",
            width: "38mm",
            cell: (row: RetailBillLineItem) => (
              <span style={{ color: "var(--doc-ink)" }}>
                {row.design && row.design !== "—" ? row.design : row.name || "—"}
              </span>
            ),
          },
          {
            header: "Rate",
            align: "end",
            width: "28mm",
            cell: (row: RetailBillLineItem) =>
              row.originalPrice !== undefined && row.originalPrice !== row.soldPrice ? (
                <span style={{ color: "var(--doc-muted)", textDecoration: "line-through" }}>
                  {formatPaise(toPaise(row.originalPrice))}
                </span>
              ) : (
                <span style={{ color: "var(--doc-muted)" }}>{formatPaise(toPaise(row.soldPrice))}</span>
              ),
          },
          {
            header: "Amount",
            align: "end",
            width: "30mm",
            cell: (row: RetailBillLineItem) => <strong>{formatPaise(toPaise(row.soldPrice))}</strong>,
          },
        ]}
        rows={lines}
      />

      <TotalsBlock rows={totalsRows} />

      <div style={{ marginTop: "4mm" }}>
        <div className="bk-doc__words" style={{ padding: "2.5mm 3.5mm" }}>
          <div style={{ fontSize: "var(--doc-amount-words)", fontWeight: 600, color: "var(--doc-ink)" }}>
            {amountInWords(toPaise(total))}
          </div>
        </div>
      </div>

      {/* A multi-saree basket is several SaleRecords sharing one bill — the
          refs are printed so a piece can be traced back to its own row when a
          customer returns just one of them. */}
      {saleRefs && saleRefs.length > 1 && (
        <div className="bk-doc__card" style={{ marginTop: "4mm" }}>
          <div className="bk-doc__eyebrow">Sale References</div>
          <div
            style={{
              fontFamily: "var(--font-code)", fontSize: "var(--doc-code)",
              color: "var(--doc-muted)", marginTop: "1.5mm", lineHeight: 1.6,
            }}
          >
            {saleRefs.join(" · ")}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "6mm", paddingTop: "3.5mm", borderTop: "0.3mm solid var(--doc-rule)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "10mm",
        }}
      >
        <div style={{ maxWidth: "105mm" }}>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "var(--doc-heading)", color: "var(--doc-burgundy)" }}>
            Thank you for shopping with {firm.name}.
          </div>
          <div
            style={{
              fontSize: "var(--doc-small)", color: "var(--doc-gold-text)", marginTop: "1.5mm",
              letterSpacing: "0.16em", textTransform: "uppercase",
            }}
          >
            Tradition · Trust · Timeless Quality
          </div>
          <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", marginTop: "2.5mm", lineHeight: 1.5 }}>
            Goods once sold are exchangeable within 7 days against this bill, unworn and with the
            tag intact. This is a computer-generated bill.
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: "45mm", flexShrink: 0 }}>
          <div style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>
              Billed by — {soldBy || "Shop Staff"}
            </span>
          </div>
        </div>
      </div>
    </DocumentPage>
  );
}
