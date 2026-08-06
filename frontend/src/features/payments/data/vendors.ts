import { VendorPayment } from "../types";

// MOCK: no backend endpoint maps cleanly to this PO-invoice ledger shape.
// GET /payments/vendors returns { id, vendorId, amount, date, utr, method,
// firmId } — a flat payment log with no PO number, invoice amount, due
// date, or partial/overdue tracking. There's also no purchase-orders module
// (frontend/src/shared/api has no purchase-orders.ts) to source poNumber /
// invoiceAmt from. Wiring this requires either a backend PO entity or
// adding those fields to VendorPayment — flagged as a gap, left mock.
// See payments feature audit.
export const VENDOR_PAYMENTS: VendorPayment[] = [];
export const VENDOR_CONTACTS: Record<string, { phone: string; email: string; city: string; contactPerson: string }> = {};
export const VENDOR_STATIC_PAYMENT_HISTORY: Record<string, { amount: number; date: string; utr: string; method: string; firm: string }[]> = {};
