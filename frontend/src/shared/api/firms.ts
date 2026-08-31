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
  /** True on the one firm new retail sales are booked to automatically. */
  isRetailSalesFirm?: boolean;
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
export type FirmPaymentType = "WEAVER" | "VENDOR" | "SUPPLIER" | "INVOICE" | "RETAIL_SALE";

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


// ── Retail sales connected to a firm ─────────────────────────────────────────
// A counter sale is rung up by shop staff with no idea which firm's books it
// belongs in. An accountant connects it afterwards from the Firms page, and the
// firm's activity then counts it as realized income. One sale, one firm.

export interface BackendActorRef {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/** Raw shape from `/firms/.../retail-sales` — carries `date`, not `saleDate`. */
interface RawFirmRetailSale {
  saleRef: string;
  sareeId: string;
  channel: "RETAIL" | "WHOLESALE";
  customerId: string | null;
  amount: string;
  date: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  firmId: string | null;
  firmLinkedAt: string | null;
  firmLinkNote: string | null;
  /** True when the active-firm rule booked it, false when a person did. */
  firmLinkedAuto: boolean;
  customer?: { id: string; name: string; phone: string | null } | null;
  saree?: { id: string; color: string | null; weightG: string | null } | null;
  soldBy?: BackendActorRef | null;
  firmLinkedBy?: BackendActorRef | null;
  firm?: { id: string; firmName: string } | null;
}

/** Normalized to `saleDate`, matching the shop-staff sales API. */
export interface FirmRetailSale extends Omit<RawFirmRetailSale, "date"> {
  saleDate: string;
}

export interface FirmRetailSalesResponse {
  items: FirmRetailSale[];
  total: number;
  page: number;
  pageSize: number;
  /** Summed across the whole filtered set, not just the current page. */
  totalAmount: number;
}

export interface ConnectableRetailSalesResponse {
  items: FirmRetailSale[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LinkRetailSalesPayload {
  saleRefs: string[];
  note?: string;
}

export interface LinkRetailSalesResult {
  firmId: string;
  linked: number;
  /** How many of those were moved off another firm rather than newly linked. */
  moved: number;
  saleRefs: string[];
}

export interface RetailSaleQuery {
  search?: string;
  from?: string;
  to?: string;
  pageSize?: number;
  includeLinked?: boolean;
  paymentMethod?: string;
  soldById?: string;
  linkType?: "all" | "auto" | "manual";
}

/** Filter values a firm's retail sales actually contain. */
export interface RetailSaleFilterOptions {
  paymentMethods: { value: string; count: number }[];
  soldBy: { id: string; name: string }[];
}

export interface SetRetailSalesFirmResult {
  firmId: string;
  /** Unconnected sales booked to the firm when the rule was set. */
  backfilled: number;
}

const normalizeRetailSale = ({ date, ...rest }: RawFirmRetailSale): FirmRetailSale => ({
  ...rest,
  saleDate: date,
});

function retailSaleParams(q: RetailSaleQuery = {}): string {
  const params = new URLSearchParams();
  params.set("pageSize", String(q.pageSize ?? 500));
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.includeLinked) params.set("includeLinked", "true");
  if (q.paymentMethod) params.set("paymentMethod", q.paymentMethod);
  if (q.soldById) params.set("soldById", q.soldById);
  if (q.linkType && q.linkType !== "all") params.set("linkType", q.linkType);
  return params.toString();
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

  /** Retail sales already booked to this firm. */
  listRetailSales: async (firmId: string, query?: RetailSaleQuery): Promise<FirmRetailSalesResponse> => {
    const res = await apiClient.get<Omit<FirmRetailSalesResponse, "items"> & { items: RawFirmRetailSale[] }>(
      `/firms/${firmId}/retail-sales?${retailSaleParams(query)}`,
    );
    return { ...res, items: res.items.map(normalizeRetailSale) };
  },

  /** The pool to pick from — unlinked retail sales, optionally including
   *  sales already sitting on another firm (linking those moves them). */
  listConnectableRetailSales: async (query?: RetailSaleQuery): Promise<ConnectableRetailSalesResponse> => {
    const res = await apiClient.get<Omit<ConnectableRetailSalesResponse, "items"> & { items: RawFirmRetailSale[] }>(
      `/firms/retail-sales/connectable?${retailSaleParams(query)}`,
    );
    return { ...res, items: res.items.map(normalizeRetailSale) };
  },

  linkRetailSales: (firmId: string, payload: LinkRetailSalesPayload) =>
    apiClient.post<LinkRetailSalesResult>(`/firms/${firmId}/retail-sales`, payload),

  unlinkRetailSale: (firmId: string, saleRef: string) =>
    apiClient.delete<void>(`/firms/${firmId}/retail-sales/${encodeURIComponent(saleRef)}`),

  retailSaleFilterOptions: (firmId: string) =>
    apiClient.get<RetailSaleFilterOptions>(`/firms/${firmId}/retail-sales/options`),

  // ── The active retail firm ──────────────────────────────────────────────
  /** The firm new retail sales are booked to, or null when none is set. */
  getRetailSalesFirm: () => apiClient.get<BackendFirm | null>("/firms/retail-sales/active-firm"),

  setRetailSalesFirm: (firmId: string) =>
    apiClient.post<SetRetailSalesFirmResult>(`/firms/${firmId}/retail-sales/active-firm`, {}),

  clearRetailSalesFirm: () =>
    apiClient.delete<{ cleared: number }>("/firms/retail-sales/active-firm"),
};
