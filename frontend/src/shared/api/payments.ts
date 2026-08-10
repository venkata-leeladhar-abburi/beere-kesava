import { apiClient } from "./client";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: ImportRowError[];
}

export interface CreateSupplierPaymentPayload {
  supplierId: string;
  amount: number;
  date?: string;
  utr?: string;
  method?: string;
  firmId?: string;
}

export interface BackendSupplierPayment {
  id: string;
  supplierId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const supplierPaymentsApi = {
  create: (payload: CreateSupplierPaymentPayload) =>
    apiClient.post<BackendSupplierPayment>("/payments/suppliers", payload),
  list: (supplierId?: string) =>
    apiClient.get<PaginatedResponse<BackendSupplierPayment>>(
      `/payments/suppliers?pageSize=100${supplierId ? `&supplierId=${supplierId}` : ""}`,
    ),
};

export interface CreateWeaverPaymentPayload {
  weaverId: string;
  amountPaid: number;
  utrNumber?: string;
  firmId?: string;
  paymentDate?: string;
  batchNo?: string;
  loomNumber?: string;
  noOfSarees?: number;
  deduction?: number;
}

export interface BackendWeaverPayment {
  id: string;
  weaverId: string;
  amountPaid: string;
  utrNumber: string | null;
  firmId: string | null;
  paymentDate: string;
  uploadedAt: string;
  batchNo: string | null;
  loomNumber: string | null;
  noOfSarees: number | null;
  deduction: string | null;
}

// Per-saree-type earnings breakdown: count of QC-passed sarees x that saree
// type's real making charge (SareeTypeRate). This is what a weaver has
// *earned* — distinct from BackendWeaverPayment, which records what's
// actually been paid out so far.
export interface WeaverEarningsBreakdown {
  sareeTypeCode: string;
  sareeTypeName: string;
  completedCount: number;
  ratePerSaree: number;
  amount: number;
}

export interface WeaverEarnings {
  weaverId: string;
  weaverName: string;
  totalCompletedSarees: number;
  totalEarned: number;
  breakdown: WeaverEarningsBreakdown[];
}

export const weaverPaymentsApi = {
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postForm<ImportResult>("/payments/weavers/import", formData);
  },

  create: (payload: CreateWeaverPaymentPayload) =>
    apiClient.post<BackendWeaverPayment>("/payments/weavers", payload),
  list: (weaverId?: string) =>
    apiClient.get<PaginatedResponse<BackendWeaverPayment>>(
      `/payments/weavers?pageSize=100${weaverId ? `&weaverId=${weaverId}` : ""}`,
    ),
  earnings: (weaverId?: string) =>
    apiClient.get<WeaverEarnings[]>(`/payments/weavers/earnings${weaverId ? `?weaverId=${weaverId}` : ""}`),
};

export interface CreateVendorPaymentPayload {
  vendorId: string;
  amount: number;
  date?: string;
  utr?: string;
  method?: string;
  firmId?: string;
  billId?: string;
}

export interface BackendVendorPayment {
  id: string;
  vendorId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
  billId?: string | null;
}

export const vendorPaymentsApi = {
  create: (payload: CreateVendorPaymentPayload) =>
    apiClient.post<BackendVendorPayment>("/payments/vendors", payload),
  list: (vendorId?: string) =>
    apiClient.get<PaginatedResponse<BackendVendorPayment>>(
      `/payments/vendors?pageSize=100${vendorId ? `&vendorId=${vendorId}` : ""}`,
    ),
};

export interface PaymentSummaryResponse {
  weaverTotal: number;
  vendorTotal: number;
  supplierTotal: number;
  totalExpenses: number;
  totalRevenue: number;
  netCashFlow: number;
  outstandingAmount: number;
  outstandingCount: number;
}

export const paymentsApi = {
  getSummary: () => apiClient.get<PaymentSummaryResponse>("/payments/summary"),
};
