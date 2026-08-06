import { Receipt } from "lucide-react";

import { Invoice, PayHistRecord } from "../types";

// MOCK — unused by PaymentHistorySection.tsx. It now builds all rows live
// from GET /payments/weavers, /payments/vendors, /payments/suppliers, and
// each invoice's payments[] (GET /invoices — there IS a real customer
// invoice-payments endpoint even though the payments module itself has
// none). Kept only as a shape reference for PayHistRecord.
export const PAY_HISTORY: PayHistRecord[] = [];
