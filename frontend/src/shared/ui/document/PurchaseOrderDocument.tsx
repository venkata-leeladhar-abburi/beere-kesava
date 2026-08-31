/**
 * PurchaseOrderDocument — design-system/07-DOCUMENTS.md Part H.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Second of the six document types, composed from the same shared/ui/document
 * primitives as InvoiceDocument. Per H.3 the parties are REVERSED from an
 * invoice — the firm is the buyer, the supplier is the addressee — and the
 * signature block carries two roles (Prepared by / Approved by) rather than
 * Invoice's single "Authorised Signatory".
 *
 * This is not a tax document (no GST/HSN split): a PO records what's being
 * ordered and its estimated value, not a taxable supply.
 */
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { TotalsBlock } from "./TotalsBlock";
import { TermsBlock } from "./TermsBlock";
import { formatPaise, toPaise } from "../../../lib/gst";

export interface PODocumentItem {
  materialType: string;
  subtype?: string;
  description?: string;
  quantity: number;
  unit: string;
  /** Rupees — POs deal in estimates, not tax-exact paise, but still render via formatPaise for one consistent money format across every document type. */
  pricePerUnit?: number;
  subtotal?: number;
}

export interface PurchaseOrderDocumentProps {
  poNumber: string;
  submittedDate: string;
  deliveryDate?: string;
  firm: LetterheadFirm;
  supplier: { name: string; city?: string; contact?: string; address?: string; gstin?: string };
  materials: PODocumentItem[];
  totalValue: number;
  urgency?: "Normal" | "Urgent";
  notesVendor?: string;
  notesAdmin?: string;
  raisedBy: string;
  approvedBy?: string;
  approvedDate?: string;
  statusLabel?: string;
  pageInfo?: { page: number; of: number };
}

export function PurchaseOrderDocument({
  poNumber, submittedDate, deliveryDate, firm, supplier, materials, totalValue,
  urgency, notesVendor, notesAdmin, raisedBy, approvedBy, approvedDate, statusLabel, pageInfo,
}: PurchaseOrderDocumentProps) {
  const meta: MetaField[] = [
    { label: "PO No", value: poNumber, code: true },
    { label: "Date", value: submittedDate },
    ...(deliveryDate ? [{ label: "Required By", value: deliveryDate }] : []),
    ...(urgency === "Urgent" ? [{ label: "Priority", value: "URGENT" }] : []),
  ];

  // A PO raised without agreed rates (the create form no longer asks for a
  // price per kg / per reel) would otherwise print an "Est. Amount" column of
  // ₹0.00 and a ₹0.00 grand total, which reads as a priced order worth
  // nothing. When nothing is priced, the money column is dropped entirely and
  // the sheet is a pure quantity order.
  const hasAmounts = materials.some(m => (m.subtotal ?? 0) > 0 || (m.pricePerUnit ?? 0) > 0) || totalValue > 0;

  const totalsRows = [{ label: "Estimated Total", amount: formatPaise(toPaise(totalValue)), grand: true }];

  const terms = [
    "Goods must match the specification and quantity stated above.",
    "The supplier must confirm acceptance before dispatch.",
    "BK Loom reserves the right to reject goods that do not meet quality standards.",
    "Payment terms as per the standing agreement with the supplier.",
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Purchase Order" documentNumber={poNumber} />}
    >
      {/* Parties are reversed from Invoice/H.1 — the firm is the buyer, so
          the addressee card names the SUPPLIER, per H.3. */}
      <PartyBlock
        parties={[
          {
            label: "Supplier",
            name: supplier.name,
            address: [supplier.city, supplier.address].filter(Boolean).join(", ") || undefined,
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

      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
          {
            header: "Material", width: "70mm",
            cell: row => (
              <div>
                <div style={{ fontWeight: 600, color: "var(--doc-ink)" }}>{row.materialType}</div>
                {(row.subtype || row.description) && (
                  <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm" }}>{row.subtype || row.description}</div>
                )}
              </div>
            ),
          },
          { header: "Qty", align: "end", width: hasAmounts ? "20mm" : "26mm", cell: row => row.quantity },
          { header: "Unit", width: hasAmounts ? "18mm" : "24mm", cell: row => row.unit },
          ...(hasAmounts
            ? [{
                header: "Est. Amount", align: "end" as const, width: "35mm",
                cell: (row: PODocumentItem) => <strong>{formatPaise(toPaise(row.subtotal ?? (row.pricePerUnit ?? 0) * row.quantity))}</strong>,
              }]
            : []),
        ]}
        rows={materials}
      />

      {hasAmounts && <TotalsBlock rows={totalsRows} />}

      {(notesVendor || notesAdmin) && (
        <div style={{ display: "grid", gridTemplateColumns: notesVendor && notesAdmin ? "1fr 1fr" : "1fr", gap: "4mm", marginTop: "5mm" }}>
          {notesVendor && (
            <div className="bk-doc__card">
              <div className="bk-doc__eyebrow">Instructions for Supplier</div>
              <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", marginTop: "1.5mm", lineHeight: 1.5 }}>{notesVendor}</div>
            </div>
          )}
          {notesAdmin && (
            <div className="bk-doc__card bk-doc__card--accent">
              <div className="bk-doc__eyebrow">Internal Note</div>
              <div style={{ fontSize: "var(--doc-body)", color: "var(--doc-ink)", marginTop: "1.5mm", lineHeight: 1.5, fontStyle: "italic" }}>{notesAdmin}</div>
            </div>
          )}
        </div>
      )}

      <TermsBlock terms={terms} termsLabel="Terms & Conditions" />

      {/* Two signature roles, not Invoice's single block — Part H.3. */}
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
