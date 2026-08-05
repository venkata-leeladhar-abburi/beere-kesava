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

export const firmsApi = {
  list: (pageSize = 100) =>
    apiClient.get<PaginatedResponse<BackendFirm>>(`/firms?pageSize=${pageSize}`),
  create: (payload: CreateFirmPayload) => apiClient.post<BackendFirm>("/firms", payload),
  update: (id: string, payload: CreateFirmPayload) =>
    apiClient.patch<BackendFirm>(`/firms/${id}`, payload),
  listEntries: (firmId: string, pageSize = 200) =>
    apiClient.get<PaginatedResponse<BackendFinancialEntry>>(
      `/firms/${firmId}/entries?pageSize=${pageSize}`,
    ),
  addEntry: (firmId: string, payload: CreateFinancialEntryPayload) =>
    apiClient.post<BackendFinancialEntry>(`/firms/${firmId}/entries`, payload),
  ledgerSummary: (firmId: string) =>
    apiClient.get<LedgerSummary>(`/firms/${firmId}/ledger-summary`),
};
