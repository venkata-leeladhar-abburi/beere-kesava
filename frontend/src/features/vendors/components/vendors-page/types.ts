export interface Vendor {
  id: string; name: string; initials: string; contactName: string;
  phone: string; whatsapp?: string; city: string; state: string;
  address: string; gstCode: string; type: string; terms: string;
  bankName?: string; accountNo?: string; notes?: string;
  // The overloaded-field pattern design-system/06-DOMAIN.md's audit calls out
  // (Part A.3/D.1) — mixes PERSON_STATUS ("active"/"inactive") with a payment
  // concept ("overdue"). Left as one union rather than split into two typed
  // fields here; VendorDirectorySection.tsx's `VENDOR_STATUS` map already
  // splits it into the shared card's separate `status`/`paymentStatus` slots
  // at the render boundary.
  status: "active" | "inactive" | "overdue";
  totalOrders: number; totalSpend: string; outstanding: string;
  lastOrder: string; rating: number;
}

export interface PurchaseTxn { vendorId: string; date: string; amount: number; material: string; }

// PAYMENT_STATUS values (lib/domain/status.ts), left untyped: VendorProfile.tsx
// (out of scope for this pass) keys its own status config off these exact
// literals — see data.ts's `buildVendorLedger` for where they're produced.
export interface VendorBill {
  id: string; invoiceNo: string; date: string; dueDate: string;
  amount: number; paid: number; balance: number;
  status: "Paid" | "Partial" | "Pending" | "Overdue";
  daysOverdue: number;
}
export interface VendorPaymentTxn {
  id: string; billId: string; date: string; amount: number;
  mode: string; reference: string; firm: string; notes: string;
}
