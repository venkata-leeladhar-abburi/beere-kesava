import { Receipt } from "lucide-react";

export interface WeaverRecord {
  id: string; name: string; initials: string; bg: string;
  village: string; sb: number; hz: number; ps: number; bs: number; st: number;
  advance: number; status: "Paid" | "Pending";
  // Uploaded overrides
  uploadedAmount?: number;
  uploadedDeduction?: number;
  uploadedNoOfSarees?: number;
  uploadedBatchNo?: string;
  uploadedLoomNumber?: string;
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

export type VendorStatus = "Paid" | "Partial" | "Overdue" | "Pending";

export interface VendorPayment {
  id: string; vendor: string; poNumber: string;
  invoiceAmt: number; paidAmt: number;
  dueDate: string; status: VendorStatus; daysOverdue?: number;
  utr?: string;
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

export type PayHistStatus = "Paid" | "Partial" | "Pending";

export interface PayHistRecord {
  id: string; date: string; type: PayHistType;
  party: string; refNo: string; description: string;
  invoicePO?: string; amount: number; status: PayHistStatus;
  mode: string; utr?: string; recordedBy: string;
}
