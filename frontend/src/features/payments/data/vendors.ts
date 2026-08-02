import { VendorDetailModal } from "../components/vendor/VendorDetailModal";
import { VendorPayment } from "../types";

export const VENDOR_PAYMENTS: VendorPayment[] = [
  { id: "VP-001", vendor: "Surat Zari Works",           poNumber: "PO-2026-020", invoiceAmt: 192000, paidAmt: 192000, dueDate: "05 May 2026", status: "Paid",    utr: "UTR20260505001" },
  { id: "VP-002", vendor: "Kanchipuram Silks",          poNumber: "PO-2026-021", invoiceAmt: 375000, paidAmt: 375000, dueDate: "08 May 2026", status: "Paid",    utr: "UTR20260508002" },
  { id: "VP-003", vendor: "Sri Venkateswara Textiles",  poNumber: "PO-2026-022", invoiceAmt: 140000, paidAmt: 140000, dueDate: "12 May 2026", status: "Paid",    utr: "UTR20260512003" },
  { id: "VP-004", vendor: "Sri Venkateswara Textiles",  poNumber: "PO-2026-023", invoiceAmt: 140000, paidAmt: 80000,  dueDate: "18 May 2026", status: "Overdue", daysOverdue: 13 },
  { id: "VP-005", vendor: "Ratan Zari Works",           poNumber: "PO-2026-031", invoiceAmt: 150000, paidAmt: 0,      dueDate: "12 May 2026", status: "Overdue", daysOverdue: 18 },
];

// Vendor contact info (static demo — in production would come from vendor master)
export const VENDOR_CONTACTS: Record<string, { phone: string; email: string; city: string; contactPerson: string }> = {
  "Surat Zari Works":           { phone: "+91 98765 43210", email: "suratZari@example.com",      city: "Surat, Gujarat",       contactPerson: "Ramesh Patel"    },
  "Kanchipuram Silks":          { phone: "+91 97654 32109", email: "kanchSilks@example.com",      city: "Kanchipuram, Tamil Nadu", contactPerson: "S. Sundaram"    },
  "Sri Venkateswara Textiles":  { phone: "+91 96543 21098", email: "sriVenkat@example.com",       city: "Hyderabad, Telangana",  contactPerson: "Venkat Reddy"   },
  "Ratan Zari Works":           { phone: "+91 95432 10987", email: "ratanZari@example.com",       city: "Varanasi, UP",          contactPerson: "Ratan Gupta"    },
};

// Static sample payment history per vendor PO (for VendorDetailModal — no live payment ledger exists yet)
export const VENDOR_STATIC_PAYMENT_HISTORY: Record<string, { amount: number; date: string; utr: string; method: string; firm: string }[]> = {
  "VP-001": [{ amount: 192000, date: "05 May 2026", utr: "UTR20260505001", method: "Bank Transfer", firm: "Surat Zari Works" }],
  "VP-002": [{ amount: 375000, date: "08 May 2026", utr: "UTR20260508002", method: "RTGS", firm: "Surat Zari Works" }],
  "VP-003": [{ amount: 140000, date: "12 May 2026", utr: "UTR20260512003", method: "NEFT", firm: "Beere Kesava" }],
  "VP-004": [{ amount: 80000, date: "01 May 2026", utr: "UTR20260501004", method: "Bank Transfer", firm: "Beere Kesava" }],
};
