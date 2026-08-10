import { Receipt } from "lucide-react";

export interface WeaverRecord {
  id: string; name: string; initials: string; bg: string;
  village: string; sb: number; hz: number; ps: number; bs: number; st: number;
  // A genuine PAYMENT_STATUS value ("Paid"→paid, "Pending"→unpaid — lib/domain/status.ts)
  // left untyped here rather than retyped to PaymentStatus: this literal union is
  // compared with `=== "Paid"` / keyed into dropdown filters across several
  // out-of-scope call sites (WeaverCard.tsx, WeaverPaymentDetailModal.tsx,
  // WeaverMakingChargesSection.tsx) — retyping would ripple into those files.
  // StatusBadge (components/common/primitives.tsx) renders it through
  // <StatusPill taxonomy="payment"> at the render boundary instead.
  advance: number; status: "Paid" | "Pending";
  // Uploaded overrides
  uploadedAmount?: number;
  uploadedDeduction?: number;
  uploadedNoOfSarees?: number;
  uploadedBatchNo?: string;
  uploadedLoomNumber?: string;
  // Server-computed earnings: QC-passed saree count x real SareeTypeRate
  // making charge (GET /payments/weavers/earnings) — the real "amount owed"
  // figure, used whenever no manual payment has been uploaded yet.
  earnedAmount?: number;
  completedSarees?: number;
}

// ── Types for Excel upload matching ───────────────────────────────────────────
export interface ExcelRow {
  weaverId: string;
  weaverName: string;
  batchNo: string;
  loomNumber: string;
  noOfSarees: number;
  amount: number;
  deduction: number;
}

export interface MatchedPayment extends ExcelRow { weaverRecord: WeaverRecord; }

export type UnmatchedRow = ExcelRow;

export interface UploadResult {
  fileName: string;
  totalRows: number;
  matched: MatchedPayment[];
  unmatched: UnmatchedRow[];
}

// PAYMENT_STATUS values, same deferral as WeaverRecord.status above — threaded
// through several out-of-scope files (WholesaleCollectionsSection.tsx,
// CustomerCard.tsx, ViewInvoiceModal.tsx, WholesaleTableView.tsx, InvBadge.tsx)
// doing exact-literal comparisons/keyed lookups.
export type InvoiceStatus = "Paid" | "Partial" | "Pending" | "Overdue";

export interface InvoicePayment {
  amount: number;
  date: string;
  utr: string;
  method: string;
  firmName?: string;
}

export interface Invoice {
  id: string; customer: string; city: string;
  invoiceDate: string; dueDate: string;
  total: number; paid: number; status: InvoiceStatus;
  daysOverdue?: number;
  payments?: InvoicePayment[];
  dispatchId?: string | null;
}

// PAYMENT_STATUS values, same deferral — threaded through out-of-scope files
// (VendorDetailModal.tsx, VendorBadge.tsx, RecordVendorPaymentSidebar.tsx,
// VendorPaymentsSection.tsx) doing exact-literal comparisons.
export type VendorStatus = "Paid" | "Partial" | "Overdue" | "Pending";

export interface VendorPayment {
  id: string; vendor: string; poNumber: string;
  invoiceAmt: number; paidAmt: number;
  dueDate: string; status: VendorStatus; daysOverdue?: number;
  utr?: string; vendorId?: string;
}

// ── Vendor payment Excel upload types ─────────────────────────────────────────
export interface VendorExcelRow {
  poNumber: string; amountPaid: number; utrNumber: string; paymentDate: string; firmName: string;
}

export interface VendorMatchedRow extends VendorExcelRow { vendorPayment: VendorPayment; }

export type VendorUnmatchedRow = VendorExcelRow;

export interface VendorUploadResult {
  fileName: string; totalRows: number; matched: VendorMatchedRow[]; unmatched: VendorUnmatchedRow[];
}

export type PayHistType   = "Vendor Payment" | "Weaver Payment" | "Customer Receipt" | "Supplier Payment";

// PAYMENT_STATUS values ("Paid"→paid, "Partial"→partial, "Pending"→unpaid).
// Left as-is: HistoryCard.tsx keys its own HIST_STATUS_CFG off these exact
// literals. PaymentHistorySection.tsx (in scope) already renders through
// <StatusPill taxonomy="payment"> via a local payHistStatusKey() mapper at
// its own render boundary instead of retyping this field.
export type PayHistStatus = "Paid" | "Partial" | "Pending";

export interface PayHistRecord {
  id: string; date: string; type: PayHistType;
  party: string; refNo: string; description: string;
  invoicePO?: string; amount: number; status: PayHistStatus;
  mode: string; utr?: string; recordedBy: string;
}
