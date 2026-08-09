/**
 * DEV-ONLY document preview harness — NOT part of the app bundle.
 * ═══════════════════════════════════════════════════════════════════════════
 * Reached at /doc-preview.html on the dev server. It mounts the real
 * InvoiceDocument with representative data and no auth/router/providers, so
 * the Phase 7 document layer can be inspected — on screen and in the
 * browser's print preview — without going through OTP login.
 *
 * This exists because every "does the print output match the preview?"
 * question is unanswerable from tsc/build/lint alone.
 */
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./styles/index.css";
import { AuthContext } from "./contexts/AuthContext";
import {
  DocumentViewer,
  InvoiceDocument,
  PurchaseOrderDocument,
  QuotationDocument,
  DeliveryChallanDocument,
  ReceiptDocument,
  StatementOfAccountDocument,
  DEFAULT_LETTERHEAD_FIRM,
  type InvoiceLineItem,
  type PODocumentItem,
  type QuotationLineItem,
  type ChallanLineItem,
  type LedgerEntry,
} from "./shared/ui/document";
import { toPaise } from "./lib/gst";

const items: InvoiceLineItem[] = [
  { id: "SAR-DVM-10241", description: "Kanchipuram Pure Silk · Peacock Zari Border", batchLabel: "BATCH-2026-04", ratePaise: toPaise(18500) },
  { id: "SAR-DVM-10242", description: "Kanchipuram Pure Silk · Peacock Zari Border", batchLabel: "BATCH-2026-04", ratePaise: toPaise(18500) },
  { id: "SAR-DVM-10243", description: "Dharmavaram Silk · Contrast Pallu, Gold Buta", batchLabel: "BATCH-2026-04", ratePaise: toPaise(22750) },
  { id: "SAR-DVM-10244", description: "Dharmavaram Silk · Contrast Pallu, Gold Buta", batchLabel: "BATCH-2026-05", ratePaise: toPaise(22750) },
  { id: "ZAR-9911", description: "Pure Zari Thread · 12% slab", hsn: "5605", qty: 4, ratePaise: toPaise(3250) },
];

// Hoisted so the screen path and the ?print path render byte-identical trees —
// the whole point of the harness is that those two must never diverge.
const invoice = (
  <InvoiceDocument
    invoiceNumber="INV-WS-2026-0184"
    invoiceDate="09 Aug 2026"
    dueDate="08 Sep 2026"
    firm={{
      ...DEFAULT_LETTERHEAD_FIRM,
      address: "12-4-88, Silk Market Road, Dharmavaram, Anantapur Dist., Andhra Pradesh 515671",
      gstin: "37AABCB1429P1ZQ",
      phone: "+91 98490 22145",
      placeOfSupplyCode: "37",
    }}
    bank={{ bankName: "State Bank of India — Dharmavaram Branch", accountNo: "3021 4455 8890", ifsc: "SBIN0021455" }}
    customer={{
      name: "Sree Lakshmi Silk House",
      address: "Shop 14, Commercial Complex, Pantheon Road, Egmore, Chennai 600008",
      phone: "+91 90031 77420",
      gstin: "33AAGCS9021H1Z4",
      placeOfSupplyCode: "33",
      placeOfSupplyName: "Tamil Nadu (33)",
    }}
    items={items}
    applyGst
    bulkOrderRef="BO-2026-0092"
    dispatch={{
      lrNumber: "LR-88213",
      transportCompany: "Sri Balaji Roadways",
      vehicleNumber: "AP 02 TQ 4417",
      dispatchDate: "09 Aug 2026",
    }}
    statusLabel="PARTIALLY PAID"
    copyLabel="Original for Recipient"
  />
);

const poMaterials: PODocumentItem[] = [
  { materialType: "Warp", subtype: "Cotton, 40s count", quantity: 120, unit: "kg", pricePerUnit: 420 },
  { materialType: "Resham", subtype: "Mulberry silk, natural white", quantity: 60, unit: "kg", pricePerUnit: 3850 },
  { materialType: "Jari", subtype: "Real zari, gold tone", quantity: 25, unit: "reels", pricePerUnit: 1650 },
];

const purchaseOrder = (
  <PurchaseOrderDocument
    poNumber="PO-2026-0417"
    submittedDate="09 Aug 2026"
    deliveryDate="20 Aug 2026"
    firm={DEFAULT_LETTERHEAD_FIRM}
    supplier={{ name: "Sri Venkateswara Silk Traders", city: "Kanchipuram, Tamil Nadu", contact: "+91 94430 12876" }}
    materials={poMaterials}
    totalValue={120 * 420 + 60 * 3850 + 25 * 1650}
    urgency="Urgent"
    notesVendor="Please pack Resham separately from Jari to avoid tarnishing."
    notesAdmin="Vendor confirmed 20 Aug delivery over phone — chase if not dispatched by 18th."
    raisedBy="Admin — K. Suresh"
    approvedBy="Superadmin"
    approvedDate="09 Aug 2026"
  />
);

const quotationItems: QuotationLineItem[] = [
  { id: "SAR-DVM-20011", description: "Kanchipuram Pure Silk · Peacock Border", batchLabel: "BATCH-2026-06", ratePaise: toPaise(19500) },
  { id: "SAR-DVM-20012", description: "Dharmavaram Silk · Gold Buta", ratePaise: toPaise(23500) },
];
const quotation = (
  <QuotationDocument
    quotationNumber="QT-2026-0071"
    quotationDate="09 Aug 2026"
    validUntil="23 Aug 2026"
    firm={DEFAULT_LETTERHEAD_FIRM}
    customer={{ name: "Anjali Textiles", city: "Bengaluru, Karnataka" }}
    items={quotationItems}
    estGstPct={5}
    leadTime="10-14 days from order confirmation"
    notes="Sample swatches available on request before order confirmation."
  />
);

const challanItems: ChallanLineItem[] = [
  { id: "SAR-DVM-30021", description: "Kanchipuram Pure Silk, sample for approval", hsn: "5007", transportValuePaise: toPaise(18500) },
  { id: "SAR-DVM-30022", description: "Dharmavaram Silk, sample for approval", hsn: "5007", transportValuePaise: toPaise(21000) },
];
const challan = (
  <DeliveryChallanDocument
    challanNumber="DC-2026-0142"
    challanDate="09 Aug 2026"
    firm={DEFAULT_LETTERHEAD_FIRM}
    party={{ label: "Deliver To", name: "Sri Lakshmi Silk Emporium", address: "T. Nagar, Chennai 600017" }}
    items={challanItems}
    reason="Sample Approval"
    vehicleNumber="TN 09 CD 5521"
    lrNumber="LR-91120"
  />
);

const receipt = (
  <ReceiptDocument
    receiptNumber="PAY-2026-0567"
    receiptDate="09 Aug 2026"
    firmName="Beere Kesava & Brothers Silks"
    receivedFrom="Sree Lakshmi Silk House"
    amountPaise={toPaise(50000)}
    mode="Bank Transfer (NEFT)"
    reference="UTR2608091234"
    againstInvoices={["INV-WS-2026-0184"]}
    balanceOutstandingPaise={toPaise(51185)}
    receivedBy="Admin — K. Suresh"
  />
);

const ledgerEntries: LedgerEntry[] = [
  { date: "02 Aug 2026", particulars: "Invoice INV-WS-2026-0171", ref: "INV-0171", debitPaise: toPaise(42000) },
  { date: "05 Aug 2026", particulars: "Payment received — NEFT", ref: "UTR2608051122", creditPaise: toPaise(30000) },
  { date: "09 Aug 2026", particulars: "Invoice INV-WS-2026-0184", ref: "INV-0184", debitPaise: toPaise(101185) },
];
const statement = (
  <StatementOfAccountDocument
    statementNumber="SOA-2026-0033"
    generatedDate="09 Aug 2026"
    periodFrom="01 Apr 2026"
    periodTo="09 Aug 2026"
    firm={DEFAULT_LETTERHEAD_FIRM}
    party={{ name: "Sree Lakshmi Silk House", address: "Egmore, Chennai 600008", gstin: "33AAGCS9021H1Z4" }}
    openingBalancePaise={toPaise(12000)}
    entries={ledgerEntries}
    ageing={[
      { label: "Current", amountPaise: toPaise(101185) },
      { label: "0-30 days", amountPaise: toPaise(12000) },
      { label: "31-60 days", amountPaise: 0 },
      { label: "61-90 days", amountPaise: 0 },
      { label: "90+ days", amountPaise: 0 },
    ]}
  />
);

const DOC = new URLSearchParams(location.search).get("doc");
const activeDoc =
  DOC === "po" ? purchaseOrder :
  DOC === "qt" ? quotation :
  DOC === "dc" ? challan :
  DOC === "receipt" ? receipt :
  DOC === "soa" ? statement :
  invoice;

// useDocument() → useDownloadsAllowed() → useAuth(), which throws outside a
// real <AuthProvider>. The harness has no login flow, so it supplies a
// minimal fake value directly via the exported context rather than pulling
// in AuthProvider's real localStorage/network wiring. Pass `?restricted` to
// preview the DOWNLOAD_RESTRICTED / blocked-download state.
const RESTRICTED = new URLSearchParams(location.search).has("restricted");
const fakeAuth = {
  isAuthenticated: true, role: "admin" as const, phone: "9999999999", token: "dev",
  user: { id: "dev", name: "Preview User", email: "", mobile: "", role: "admin", accessLevel: RESTRICTED ? "DOWNLOAD_RESTRICTED" : undefined },
  login: () => {}, selectRole: () => {}, logout: () => {}, adminViewingAs: null, clearAdminView: () => {},
};

function App() {
  return (
    <AuthContext.Provider value={fakeAuth}>
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        <DocumentViewer>{activeDoc}</DocumentViewer>
        <Toaster position="bottom-right" />
      </div>
    </AuthContext.Provider>
  );
}

/**
 * `?print` reproduces exactly what useDocument() does before window.print():
 * portal the document tree into #document-print-root and flag the body. It
 * deliberately does NOT call window.print() — that lets headless Chrome
 * (`--print-to-pdf`) render the real print path, so page geometry, @page
 * margins and multi-page breaks can be checked against an actual PDF rather
 * than assumed. Without this, printing this page would just print the grey
 * screen preview, since the isolation rules key off the body attribute.
 */
const PRINT_MODE = new URLSearchParams(location.search).has("print");

if (PRINT_MODE) {
  const printRoot = document.getElementById("document-print-root")! as HTMLElement & { _root?: ReturnType<typeof createRoot> };
  printRoot._root ??= createRoot(printRoot);
  printRoot._root.render(activeDoc);
  document.body.setAttribute("data-printing-document", "");
} else {
  // Reuse the root across HMR updates — calling createRoot twice on the same
  // container is a React error and spams the console during editing.
  const container = document.getElementById("root")! as HTMLElement & { _root?: ReturnType<typeof createRoot> };
  container._root ??= createRoot(container);
  container._root.render(<App />);
}
