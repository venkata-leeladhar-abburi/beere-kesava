/** Vendor account status — like PersonStatus (lib/domain/status.ts) but this
 *  feature's real states add "overdue", which isn't in that taxonomy, so it
 *  keeps its own type rather than forcing a fit. */
export type VendorStatus = "active" | "inactive" | "overdue";
export const VENDOR_STATUS = {
  Active: "active",
  Inactive: "inactive",
  Overdue: "overdue",
} as const satisfies Record<string, VendorStatus>;

/** Vendor bill payment status — 4-state variant of the codebase's payment
 *  concept; kept as this feature's real values rather than PaymentStatus's
 *  8-state kebab-case set. */
export type VendorBillStatus = "Paid" | "Partial" | "Pending" | "Overdue";

export interface Vendor {
  id: string; name: string; initials: string; contactName: string;
  phone: string; whatsapp?: string; city: string; state: string;
  address: string; gstCode: string; type: string; terms: string;
  bankName?: string; accountNo?: string; notes?: string;
  status: VendorStatus;
  totalOrders: number; totalSpend: string; outstanding: string;
  lastOrder: string; rating: number;
}

export interface PurchaseTxn { vendorId: string; date: string; amount: number; material: string; }

export interface VendorBill {
  id: string; invoiceNo: string; date: string; dueDate: string;
  amount: number; paid: number; balance: number;
  status: VendorBillStatus;
  daysOverdue: number;
}
export interface VendorPaymentTxn {
  id: string; billId: string; date: string; amount: number;
  mode: string; reference: string; firm: string; notes: string;
}
