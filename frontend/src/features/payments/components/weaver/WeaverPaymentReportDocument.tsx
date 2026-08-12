/**
 * Real, printable/"Save as PDF" Weaver Payment Report — replaces the old
 * "Download Weaver Payment Report" button, which just faked a 1.2s spinner
 * and a fake success screen without producing any document. Uses the same
 * shared/ui/document pieces (DocumentPage + Letterhead) every other real
 * document in the app is built from, and the browser's print-to-PDF path
 * (useDocument().download) rather than a client-side PDF library, matching
 * how every other "Download …" report in this codebase already works.
 */
import * as React from "react";
import { DocumentPage } from "../../../../shared/ui/document/DocumentPage";
import { Letterhead } from "../../../../shared/ui/document/Letterhead";
import { formatMoney, rupees } from "@/lib/domain/money";

export interface WeaverPaymentReportRow {
  weaverId: string;
  weaverName: string;
  batches: string;
  loomNumber: string;
  noOfSarees: number;
  makingCharges: number;
  deduction: number;
  amountPaid: number;
  utrNumber: string;
  firmName: string;
  paymentDate: string;
}

export function WeaverPaymentReportDocument({
  rows,
  reportNumber,
  generatedDate,
  periodLabel,
}: {
  rows: WeaverPaymentReportRow[];
  reportNumber: string;
  generatedDate: string;
  periodLabel: string;
}) {
  const totals = rows.reduce(
    (acc, r) => ({
      makingCharges: acc.makingCharges + r.makingCharges,
      deduction: acc.deduction + r.deduction,
      amountPaid: acc.amountPaid + r.amountPaid,
    }),
    { makingCharges: 0, deduction: 0, amountPaid: 0 },
  );

  return (
    <DocumentPage band={<Letterhead title="Weaver Payment Report" documentNumber={reportNumber} />}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "5mm" }}>
        <div style={{ fontSize: "var(--doc-heading)", fontWeight: 700, color: "var(--doc-ink)" }}>{periodLabel}</div>
        <div style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>Generated {generatedDate}</div>
      </div>

      <table className="bk-doc__table" style={{ marginTop: "4mm" }}>
        <thead>
          <tr>
            <th>Weaver ID</th>
            <th>Weaver Name</th>
            <th>Batches</th>
            <th>Loom No.</th>
            <th data-num>Sarees</th>
            <th data-num>Making Charges</th>
            <th data-num>Deduction</th>
            <th data-num>Amount Paid</th>
            <th>UTR Number</th>
            <th>Firm</th>
            <th>Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={11} style={{ textAlign: "center", color: "var(--doc-muted)" }}>No weaver payment data for this period.</td>
            </tr>
          ) : rows.map((r, i) => (
            <tr key={`${r.weaverId}-${i}`}>
              <td style={{ fontFamily: "var(--font-code)" }}>{r.weaverId}</td>
              <td>{r.weaverName}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{r.batches || "—"}</td>
              <td>{r.loomNumber || "—"}</td>
              <td data-num>{r.noOfSarees}</td>
              <td data-num>{formatMoney(rupees(r.makingCharges))}</td>
              <td data-num>{formatMoney(rupees(r.deduction))}</td>
              <td data-num style={{ fontWeight: 600 }}>{formatMoney(rupees(r.amountPaid))}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{r.utrNumber || "—"}</td>
              <td>{r.firmName || "—"}</td>
              <td>{r.paymentDate || "—"}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={5}>Totals — {rows.length} weaver{rows.length !== 1 ? "s" : ""}</td>
              <td data-num>{formatMoney(rupees(totals.makingCharges))}</td>
              <td data-num>{formatMoney(rupees(totals.deduction))}</td>
              <td data-num>{formatMoney(rupees(totals.amountPaid))}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        )}
      </table>
    </DocumentPage>
  );
}
