/**
 * DeliveryChallanDocument — design-system/07-DOCUMENTS.md Part H.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fourth of the six document types. Records goods movement WITHOUT a sale —
 * job work, samples, inter-branch transfer — so unlike Invoice/Quotation
 * there is no "Amount" column with real pricing; H.4 specifies a single
 * "Value for transport purposes only" figure per line, and the mandatory
 * footer disclaims it as not a tax document.
 */
import * as React from "react";
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { LineItemTable } from "./LineItemTable";
import { formatPaise } from "../../../lib/gst";

export interface ChallanLineItem {
  id: string;
  description: string;
  hsn?: string;
  qty?: number;
  unit?: string;
  /** "Value for transport purposes only" — integer paise, per H.4. Never billed. */
  transportValuePaise: number;
}

export interface DeliveryChallanDocumentProps {
  challanNumber: string;
  challanDate: string;
  firm: LetterheadFirm;
  party: { label?: string; name: string; address?: string; phone?: string };
  items: ChallanLineItem[];
  reason: string;
  vehicleNumber?: string;
  lrNumber?: string;
  ewayBillNumber?: string;
  pageInfo?: { page: number; of: number };
}

export function DeliveryChallanDocument({
  challanNumber, challanDate, firm, party, items, reason, vehicleNumber, lrNumber, ewayBillNumber, pageInfo,
}: DeliveryChallanDocumentProps) {
  const totalTransportValuePaise = items.reduce((sum, it) => sum + it.transportValuePaise * (it.qty ?? 1), 0);

  const meta: MetaField[] = [
    { label: "Challan No", value: challanNumber, code: true },
    { label: "Date", value: challanDate },
    { label: "Reason", value: reason },
    ...(vehicleNumber ? [{ label: "Vehicle No", value: vehicleNumber, code: true }] : []),
    ...(lrNumber ? [{ label: "LR No", value: lrNumber, code: true }] : []),
    ...(ewayBillNumber ? [{ label: "E-Way Bill", value: ewayBillNumber, code: true }] : []),
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Delivery Challan" documentNumber={challanNumber} />}
    >
      <PartyBlock
        parties={[{ label: party.label || "Deliver To", name: party.name, address: party.address, phone: party.phone }]}
        meta={meta}
      />

      <LineItemTable
        columns={[
          { header: "#", align: "center", width: "9mm", cell: (_row, i) => i + 1 },
          {
            header: "Description", width: "80mm",
            cell: row => (
              <div>
                <div style={{ fontFamily: "var(--font-code)", fontSize: "var(--doc-code)", fontWeight: 600, color: "var(--doc-burgundy)" }}>{row.id}</div>
                <div style={{ color: "var(--doc-muted)", marginTop: "0.3mm" }}>{row.description}</div>
              </div>
            ),
          },
          { header: "HSN", width: "16mm", cell: row => <span style={{ fontFamily: "var(--font-code)" }}>{row.hsn || "—"}</span> },
          { header: "Qty", align: "end", width: "16mm", cell: row => `${row.qty ?? 1}${row.unit ? ` ${row.unit}` : ""}` },
          {
            header: "Value (Transport Only)", align: "end", width: "38mm",
            cell: row => formatPaise(row.transportValuePaise * (row.qty ?? 1)),
          },
        ]}
        rows={items}
      />

      <div style={{ marginTop: "5mm", display: "flex", justifyContent: "flex-end" }}>
        <div className="bk-doc__card" style={{ width: "70mm", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--doc-body)", color: "var(--doc-muted)" }}>Total (transport value only)</span>
          <span style={{ fontSize: "var(--doc-body)", fontWeight: 700, color: "var(--doc-ink)" }}>{formatPaise(totalTransportValuePaise)}</span>
        </div>
      </div>

      {/* H.4's mandatory disclaimer — this is what stops a challan being
          mistaken for (or misused as) a tax invoice. */}
      <div style={{ marginTop: "4mm", fontSize: "var(--doc-small)", color: "var(--doc-faint)", fontStyle: "italic" }}>
        Not a tax invoice. Goods sent for {reason.toLowerCase()}.
      </div>

      {/* H.4's receiver-acknowledgement block — distinct from a signatory
          block: it exists to prove delivery, not authorise the document. */}
      <div style={{ marginTop: "8mm", paddingTop: "3.5mm", borderTop: "0.3mm solid var(--doc-rule)" }}>
        <div className="bk-doc__eyebrow" style={{ marginBottom: "3mm" }}>Received in good condition by</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6mm" }}>
          {["Name", "Date & Time", "Signature"].map(label => (
            <div key={label} style={{ borderTop: "0.4mm solid var(--doc-rule)", paddingTop: "1.5mm", minHeight: "8mm" }}>
              <span style={{ fontSize: "var(--doc-small)", color: "var(--doc-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </DocumentPage>
  );
}
