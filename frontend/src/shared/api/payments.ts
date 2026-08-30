import { apiClient } from "./client";
import type { BackendActorSummary } from "./invoices";

export type { BackendActorSummary };

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: ImportRowError[];
  /** Sum of amountPaid across rows actually saved — 0 when nothing was created. */
  totalAmount: number;
}

export interface CreateSupplierPaymentPayload {
  supplierId: string;
  amount: number;
  date?: string;
  utr?: string;
  method?: string;
  firmId?: string;
  purchaseId?: string;
}

export interface BackendSupplierPayment {
  id: string;
  supplierId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
  purchaseId?: string | null;
  /** Accountant / Shop Staff who recorded this payment. */
  recordedBy?: BackendActorSummary | null;
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
  /** Accountant / Shop Staff who recorded this payment. */
  recordedBy?: BackendActorSummary | null;
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

// One row per QC-passed saree with a weaver attached — the raw material
// behind the Weaver Payments page's production-summary table/template.
// Grouping by (weaverId, batchId, loomNumber) and date filtering both
// happen client-side.
export interface WeaverProductionRow {
  sareeId: string;
  weaverId: string;
  /** Human-facing weaver code ("Ramarao-001") — what the UI displays. */
  weaverCode: string;
  weaverName: string;
  batchId: string | null;
  loomNumber: string | null;
  qcDate: string;
  makingCharge: number;
  deduction: number;
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
  /**
   * Every payment row, walking past the single capped page `list` returns.
   * Callers that total money (per-weaver "Total Paid") must use this — a
   * capped page silently under-reports the total once there are more than
   * `pageSize` payments on record.
   */
  listAll: async (weaverId?: string, pageSize = 200): Promise<BackendWeaverPayment[]> => {
    const q = (page: number) =>
      `/payments/weavers?page=${page}&pageSize=${pageSize}${weaverId ? `&weaverId=${weaverId}` : ""}`;
    const first = await apiClient.get<PaginatedResponse<BackendWeaverPayment>>(q(1));
    const items = [...first.items];
    let page = 1;
    while (items.length < first.total) {
      page += 1;
      const next = await apiClient.get<PaginatedResponse<BackendWeaverPayment>>(q(page));
      if (next.items.length === 0) break;
      items.push(...next.items);
    }
    return items;
  },
  earnings: (weaverId?: string) =>
    apiClient.get<WeaverEarnings[]>(`/payments/weavers/earnings${weaverId ? `?weaverId=${weaverId}` : ""}`),
  productionRows: () => apiClient.get<WeaverProductionRow[]>("/payments/weavers/production-rows"),
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
  /** Accountant / Shop Staff who recorded this payment. */
  recordedBy?: BackendActorSummary | null;
}

export const vendorPaymentsApi = {
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postForm<ImportResult>("/payments/vendors/import", formData);
  },

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
