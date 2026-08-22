import { apiClient } from "./client";

export interface BackendFirm {
  id: string;
  firmName: string;
  gstNumber: string | null;
  address: string | null;
  purchaseAmount: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  createdAt: string;
}

export type BackendFinancialEntryKind = "INCOME" | "EXPENSE" | "MISC";

export interface BackendFinancialEntry {
  id: string;
  firmId: string;
  kind: BackendFinancialEntryKind;
  category: string;
  description: string | null;
  amount: string;
  date: string;
  notes: string | null;
}

export interface LedgerSummary {
  firmId: string;
  income: number;
  expense: number;
  misc: number;
  balance: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateFirmPayload {
  firmName: string;
  gstNumber?: string;
  address?: string;
  purchaseAmount?: number;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export interface CreateFinancialEntryPayload {
  kind: BackendFinancialEntryKind;
  category: string;
  description?: string;
  amount: number;
  date?: string;
  notes?: string;
}

// ── Firm activity (auto-tracked) ──────────────────────────────────────────────
// Documents that NAME this firm (purchase orders, goods receipts, quotations,
// dispatch invoices) plus the payments actually recorded against it. Committed
// and realized money are kept apart — see FirmActivityService on the backend.

export type FirmActivityDirection = "INCOME" | "EXPENSE";
export type FirmActivityStatus = "PENDING" | "PARTIAL" | "PAID";
export type FirmDocumentType =
  | "PURCHASE_ORDER"
  | "GOODS_RECEIPT"
  | "QUOTATION"
  | "DISPATCH_INVOICE";
export type FirmPaymentType = "WEAVER" | "VENDOR" | "SUPPLIER" | "INVOICE";

export interface FirmDocument {
  id: string;
  type: FirmDocumentType;
  direction: FirmActivityDirection;
  reference: string;
  party: string;
  date: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: FirmActivityStatus;
  category: string;
}

export interface FirmPayment {
  id: string;
  type: FirmPaymentType;
  direction: FirmActivityDirection;
  reference: string;
  party: string;
  date: string;
  amount: number;
  category: string;
}

export interface FirmActivity {
  firmId: string;
  documents: FirmDocument[];
  payments: FirmPayment[];
  totals: {
    realizedIncome: number;
    realizedExpense: number;
    net: number;
    pendingIncome: number;
    pendingExpense: number;
    quotedPipeline: number;
  };
}

export const firmsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendFirm>>(`/firms?pageSize=${pageSize}`),
  create: (payload: CreateFirmPayload) => apiClient.post<BackendFirm>("/firms", payload),
  update: (id: string, payload: CreateFirmPayload) =>
    apiClient.patch<BackendFirm>(`/firms/${id}`, payload),
  remove: (id: string) => apiClient.delete<void>(`/firms/${id}`),
  listEntries: (firmId: string, pageSize = 200) =>
    apiClient.get<PaginatedResponse<BackendFinancialEntry>>(
      `/firms/${firmId}/entries?pageSize=${pageSize}`,
    ),
  addEntry: (firmId: string, payload: CreateFinancialEntryPayload) =>
    apiClient.post<BackendFinancialEntry>(`/firms/${firmId}/entries`, payload),
  updateEntry: (firmId: string, entryId: string, payload: Partial<CreateFinancialEntryPayload>) =>
    apiClient.patch<BackendFinancialEntry>(`/firms/${firmId}/entries/${entryId}`, payload),
  removeEntry: (firmId: string, entryId: string) =>
    apiClient.delete<void>(`/firms/${firmId}/entries/${entryId}`),
  ledgerSummary: (firmId: string) =>
    apiClient.get<LedgerSummary>(`/firms/${firmId}/ledger-summary`),
  activity: (firmId: string) => apiClient.get<FirmActivity>(`/firms/${firmId}/activity`),
};
