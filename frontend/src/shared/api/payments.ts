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

/** Minimal identity of the staff member who performed an action, for attribution display. */
export interface BackendActorSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CreateSupplierPaymentPayload {
  supplierId: string;
  amount: number;
  date?: string;
  utr?: string;
  method?: string;
  firmId?: string;
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
}

export interface BackendSupplierPayment {
  id: string;
  supplierId: string;
  amount: string;
  date: string;
  utr: string | null;
  method: string | null;
  firmId: string | null;
  /** Accountant who recorded this payment. */
  recordedBy?: BackendActorSummary | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Every list endpoint here caps pageSize server-side (100 for supplier/
// vendor, 500 for weaver) — a single page silently dropped records beyond
// that cap since no caller ever requested page 2+. Walk every page and merge
// so "list" always means the full list, matching how callers already treat
// the result (client-side filtering/derivation over "all payments").
async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  pageSize: number,
): Promise<PaginatedResponse<T>> {
  const first = await fetchPage(1, pageSize);
  const items = [...first.items];
  let page = 1;
  while (items.length < first.total) {
    page += 1;
    const next = await fetchPage(page, pageSize);
    if (next.items.length === 0) break;
    items.push(...next.items);
  }
  return { items, total: first.total, page: 1, pageSize: items.length };
}

export const supplierPaymentsApi = {
  create: (payload: CreateSupplierPaymentPayload) =>
    apiClient.post<BackendSupplierPayment>("/payments/suppliers", payload),
  list: (supplierId?: string) =>
    fetchAllPages<BackendSupplierPayment>(
      (page, pageSize) =>
        apiClient.get<PaginatedResponse<BackendSupplierPayment>>(
          `/payments/suppliers?page=${page}&pageSize=${pageSize}${supplierId ? `&supplierId=${supplierId}` : ""}`,
        ),
      100,
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
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
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
  /** Accountant who recorded this payment. */
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
    fetchAllPages<BackendWeaverPayment>(
      (page, pageSize) =>
        apiClient.get<PaginatedResponse<BackendWeaverPayment>>(
          `/payments/weavers?page=${page}&pageSize=${pageSize}${weaverId ? `&weaverId=${weaverId}` : ""}`,
        ),
      500,
    ),
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
  /** User who performed this — recorded on the action log so the history
   *  names the real person, including an admin working inside a staff portal. */
  actorId?: string;
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
  /** Accountant who recorded this payment. */
  recordedBy?: BackendActorSummary | null;
}

export const vendorPaymentsApi = {
  create: (payload: CreateVendorPaymentPayload) =>
    apiClient.post<BackendVendorPayment>("/payments/vendors", payload),
  list: (vendorId?: string) =>
    fetchAllPages<BackendVendorPayment>(
      (page, pageSize) =>
        apiClient.get<PaginatedResponse<BackendVendorPayment>>(
          `/payments/vendors?page=${page}&pageSize=${pageSize}${vendorId ? `&vendorId=${vendorId}` : ""}`,
        ),
      100,
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
