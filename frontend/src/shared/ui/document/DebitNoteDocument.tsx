/**
 * DebitNoteDocument — raised to a supplier when purchased sarees go back.
 * ═══════════════════════════════════════════════════════════════════════════
 * Composed from the same shared/ui/document primitives as
 * PurchaseOrderDocument, and laid out the same way: the firm is the letterhead,
 * the supplier is the addressee, and the signature block carries two roles
 * (Prepared by / Approved by).
 *
 * The value is stated at buying price — what the supplier is being debited
 * for the pieces coming back. Once the note is decided, an "Accepted" column
 * appears and the grand total becomes the value of the accepted pieces only,
 * since a partly approved note debits just those.
 */
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable, type LineItemColumn } from "./LineItemTable";
import { TotalsBlock, type TotalsRow } from "./TotalsBlock";
import { TermsBlock } from "./TermsBlock";
import { AmountInWords } from "./AmountInWords";
import { amountInWords, formatPaise, toPaise } from "../../../lib/gst";

export interface DebitNoteItem {
  /** The purchase line's serial code. */
  lineCode: string;
  /** e.g. "Kanchi Silk · Maroon" */
  description?: string;
  /** Codes of the individual pieces picked for return. */
  pieceCodes: string[];
  quantity: number;
  /** Buying price per piece, in rupees. */
  rate: number;
  /** Pieces accepted once decided; undefined while pending. */
  acceptedQuantity?: number;
  /** Codes of the accepted pieces, when known. */
  acceptedPieceCodes?: string[];
}

export interface DebitNoteDocumentProps {
  noteNumber: string;
  date: string;
  firm: LetterheadFirm;
  supplier: { name: string; address?: string; contact?: string; gstin?: string };
  /** The external purchase the pieces were bought on. */
  purchaseRef: string;
  supplierInvoice?: string;
  items: DebitNoteItem[];
  reason?: string;
  decisionNote?: string;
  /** True once an admin has decided the note — shows the Accepted column. */
  decided?: boolean;
  statusLabel?: string;
  raisedBy: string;
  approvedBy?: string;
  approvedDate?: string;
  pageInfo?: { page: number; of: number };
}

export function DebitNoteDocument({
  noteNumber, date, firm, supplier, purchaseRef, supplierInvoice, items, reason, decisionNote,
  decided, statusLabel, raisedBy, approvedBy, approvedDate, pageInfo,
}: DebitNoteDocumentProps) {
  const meta: MetaField[] = [
    { label: "Debit Note No", value: noteNumber, code: true },
    { label: "Date", value: date },
    { label: "Against Purchase", value: purchaseRef, code: true },
    ...(supplierInvoice ? [{ label: "Supplier Invoice", value: supplierInvoice, code: true }] : []),
  ];

  const requestedPaise = items.reduce((sum, it) => sum + toPaise(it.rate * it.quantity), 0);
  const acceptedPaise = items.reduce((sum, it) => sum + toPaise(it.rate * (it.acceptedQuantity ?? 0)), 0);
  const totalPieces = items.reduce((sum, it) => sum + it.quantity, 0);
  const acceptedPieces = items.reduce((sum, it) => sum + (it.acceptedQuantity ?? 0), 0);
  const debitPaise = decided ? acceptedPaise : requestedPaise;

  const totalsRows: TotalsRow[] = decided
    ? [
        { label: `Requested (${totalPieces} pc${totalPieces === 1 ? "" : "s"})`, amount: formatPaise(requestedPaise) },
        { label: `Not accepted (${totalPieces - acceptedPieces} pc${totalPieces - acceptedPieces === 1 ? "" : "s"})`, amount: `− ${formatPaise(requestedPaise - acceptedPaise)}` },
        { label: "Total Debit", amount: formatPaise(acceptedPaise), grand: true },
      ]
    : [{ label: `Total Debit (${totalPieces} pc${totalPieces === 1 ? "" : "s"})`, amount: formatPaise(requestedPaise), grand: true }];

  const columns: LineItemColumn<DebitNoteItem>[] = [
    { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
    {
      header: "Saree", width: decided ? "72mm" : "88mm",
      cell: row => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--doc-ink)", fontFamily: "var(--font-code)" }}>{row.lineCode}</div>
          {row.description && <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm" }}>{row.description}</div>}
          {row.pieceCodes.length > 0 && (
            <div style={{ color: "var(--doc-muted)", marginTop: "0.8mm", fontFamily: "var(--font-code)", fontSize: "var(--doc-small)", lineHeight: 1.5 }}>
              {row.pieceCodes.map(code => {
                const refused = decided && row.acceptedPieceCodes && !row.acceptedPieceCodes.includes(code);
                return (
                  <span key={code} style={{ marginRight: "2.5mm", textDecoration: refused ? "line-through" : undefined }}>
                    {code}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    { header: "Qty", align: "end", width: "14mm", cell: row => row.quantity },
    ...(decided
      ? [{ header: "Accepted", align: "end" as const, width: "20mm", cell: (row: DebitNoteItem) => <strong>{row.acceptedQuantity ?? 0}</strong> }]
      : []),
    { header: "Rate", align: "end", width: "26mm", cell: row => formatPaise(toPaise(row.rate)) },
    {
      header: "Amount", align: "end", width: "30mm",
      cell: row => <strong>{formatPaise(toPaise(row.rate * (decided ? row.acceptedQuantity ?? 0 : row.quantity)))}</strong>,
    },
  ];

  const terms = [
    "The pieces listed above are returned against the purchase stated.",
    "The supplier's account is debited by the total shown on this note.",
    "Please adjust this amount against the next payment or issue a matching credit note.",
    ...(decided ? ["Struck-through pieces were not accepted for return and remain with BK Loom."] : []),
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Debit Note" documentNumber={noteNumber} />}
    >
      <PartyBlock
        parties={[
          {
            label: "Supplier",
            name: supplier.name,
            address: supplier.address,
            phone: supplier.contact,
            gstin: supplier.gstin,
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

      <LineItemTable columns={columns} rows={items} />

      <TotalsBlock rows={totalsRows} />
      <AmountInWords words={amountInWords(debitPaise)} />

      {(reason || decisionNote) && (
        <div style={{ display: "grid", gridTemplateColumns: reason && decisionNote ? "1fr 1fr" : "1fr", gap: "4mm", marginTop: "5mm" }}>
          {reason && (
            <div className="bk-doc__card">
              <div className="bk-doc__eyebrow">Reason for Return</div>
              <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", marginTop: "1.5mm", lineHeight: 1.5 }}>{reason}</div>
            </div>
          )}
          {decisionNote && (
            <div className="bk-doc__card bk-doc__card--accent">
              <div className="bk-doc__eyebrow">Approval Note</div>
              <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", marginTop: "1.5mm", lineHeight: 1.5, fontStyle: "italic" }}>{decisionNote}</div>
            </div>
          )}
        </div>
      )}

      <TermsBlock terms={terms} termsLabel="Terms & Conditions" />

      <div
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm",
          marginTop: "6mm", paddingTop: "3.5mm", borderTop: "0.3mm solid var(--doc-rule)",
        }}
      >
        <div>
          <div style={{ fontSize: "var(--doc-body)", fontWeight: 600, color: "var(--doc-burgundy)", marginBottom: "8mm" }}>
            Prepared by
          </div>
          <div style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>{raisedBy}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "var(--doc-body)", fontWeight: 600, color: "var(--doc-burgundy)", marginBottom: "8mm" }}>
            Approved by
          </div>
          <div style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm" }}>
            <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>
              {approvedBy ? `${approvedBy}${approvedDate ? ` · ${approvedDate}` : ""}` : "Pending approval"}
            </span>
          </div>
        </div>
      </div>
    </DocumentPage>
  );
}
