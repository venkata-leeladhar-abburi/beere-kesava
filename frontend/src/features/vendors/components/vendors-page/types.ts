export interface Vendor {
  id: string; name: string; initials: string; contactName: string;
  phone: string; whatsapp?: string; city: string; state: string;
  address: string; gstCode: string; type: string; terms: string;
  bankName?: string; accountNo?: string; notes?: string;
  status: "active" | "inactive" | "overdue";
  totalOrders: number; totalSpend: string; outstanding: string;
  lastOrder: string; rating: number;
}

export interface PurchaseTxn { vendorId: string; date: string; amount: number; material: string; }

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
