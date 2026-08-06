import { Invoice } from "../types";

// MOCK fallback: there IS a real customer-invoice/payments endpoint
// (GET /invoices, with a nested `payments` array recorded via
// POST /invoices/:id/payments) even though the payments module itself has
// no customer-receipt endpoint. PaymentAnalyticsSection.tsx and
// PaymentHistorySection.tsx now source real invoices/customer-receipt rows
// from shared/api/invoices.ts. This static array is kept only as a
// fallback shape reference.
export const INVOICES: Invoice[] = [];
