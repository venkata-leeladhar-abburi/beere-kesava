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
  /** Rupees — the retail rate before any counter discount. */
  originalPrice?: number;
  /** "10%" when the discount was given as a percentage. */
  discountNote?: string;
  /** Where the saree came from. Printed only on the admin copy. */
  source?: { kind: "weaver" | "factory" | "external"; name: string; detail?: string };
}

const SOURCE_KIND: Record<NonNullable<RetailBillLineItem["source"]>["kind"], string> = {
  weaver: "Weaver",
  factory: "Factory loom",
  external: "External purchase",
};

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
  /** "admin" adds each saree's source (weaver / factory loom / supplier) —
   *  the copy that goes to the admin team, never to the customer. */
  copy?: "customer" | "admin";
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
  copy = "customer",
}: RetailBillDocumentProps) {
  const retailTotal = lines.reduce((sum, l) => sum + (l.originalPrice ?? l.soldPrice), 0);
  const discount = retailTotal - total;

  const meta: MetaField[] = [
    { label: "Bill No", value: billRef, code: true },
    { label: "Date", value: billDate },
    { label: "Payment", value: paymentLabel(paymentMethod) },
    { label: "Sarees", value: String(lines.length) },
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

  const admin = copy === "admin";
  const money = (n: number) => formatPaise(toPaise(n));
  const typeOf = (row: RetailBillLineItem) =>
    row.type && row.type !== "—" ? row.type : row.name && row.name !== "—" ? row.name : "—";

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title={admin ? "Retail Bill · Admin Copy" : "Retail Bill"} documentNumber={billRef} />}
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
          { header: "#", align: "center", width: "8mm", cell: (_row, i) => i + 1 },
          {
            header: "Saree",
            cell: (row: RetailBillLineItem) => (
              <span style={{ fontFamily: "var(--font-code)", fontWeight: 700, color: "var(--doc-burgundy)", overflowWrap: "anywhere" }}>
                {row.sareeId}
              </span>
            ),
          },
          {
            header: "Saree Type",
            width: admin ? "28mm" : "38mm",
            cell: (row: RetailBillLineItem) => <span style={{ color: "var(--doc-ink)" }}>{typeOf(row)}</span>,
          },
          ...(admin
            ? [{
                header: "Source",
                width: "34mm",
                cell: (row: RetailBillLineItem) =>
                  row.source ? (
                    <div>
                      <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                        {SOURCE_KIND[row.source.kind]}
                      </div>
                      <div style={{ color: "var(--doc-ink)", fontWeight: 600 }}>{row.source.name}</div>
                      {row.source.detail && <div style={{ color: "var(--doc-muted)" }}>{row.source.detail}</div>}
                    </div>
                  ) : <span style={{ color: "var(--doc-muted)" }}>—</span>,
              }]
            : []),
          {
            header: "Rate",
            align: "end",
            width: "24mm",
            cell: (row: RetailBillLineItem) => (
              <span style={{ color: "var(--doc-muted)" }}>{money(row.originalPrice ?? row.soldPrice)}</span>
            ),
          },
          {
            header: "Discount",
            align: "end",
            width: "24mm",
            cell: (row: RetailBillLineItem) => {
              const off = (row.originalPrice ?? row.soldPrice) - row.soldPrice;
              if (off <= 0) return <span style={{ color: "var(--doc-muted)" }}>—</span>;
              return (
                <div>
                  <div style={{ color: "var(--doc-gold-text)" }}>− {money(off)}</div>
                  {row.discountNote && <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>({row.discountNote})</div>}
                </div>
              );
            },
          },
          {
            header: "Final Amount",
            align: "end",
            width: "27mm",
            cell: (row: RetailBillLineItem) => <strong>{money(row.soldPrice)}</strong>,
          },
        ]}
        rows={lines}
      />

      <TotalsBlock rows={totalsRows} />

      {discount > 0 && (
        <div
          className="bk-doc__card"
          style={{ marginTop: "4mm", display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: "var(--doc-gold-text)" }}
        >
          <span style={{ fontWeight: 700, color: "var(--doc-gold-text)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            You saved
          </span>
          <span style={{ fontWeight: 700, fontSize: "var(--doc-heading)", color: "var(--doc-gold-text)" }}>
            {money(discount)}
          </span>
        </div>
      )}

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
