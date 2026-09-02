import { apiClient } from "./client";
import type { BackendActorSummary } from "./batches";

export type SalesChannel = "RETAIL" | "WHOLESALE";

// Raw shapes exactly as Prisma serialises SaleRecord / ReturnRecord — kept
// private so a backend field-name change can only ever break this one file.
interface RawSaleRecord {
  saleRef: string;
  sareeId: string;
  channel: SalesChannel;
  date: string;
  customerId: string | null;
  amount: string; // Prisma Decimal serialised as string
  paymentMethod: string | null;
  paymentRef: string | null;
  // Included by SalesService's saleInclude, but only the fields this app
  // actually reads are declared here.
  saree?: {
    designCode: string | null;
    sareeTypeCode: string | null;
    sareeType: { type: string } | null;
  } | null;
  customer?: { id: string; name: string } | null;
  /** Shop Staff / Accountant who rang up this sale. */
  soldBy?: BackendActorSummary | null;
}

interface RawReturnRecord {
  returnRef: string;
  sareeId: string;
  reason: string | null;
  refundAmount: string | null;
  restocked: boolean;
  createdAt: string;
}

// Normalised shapes the rest of the app reads — `saleDate` / `returnDate`
// instead of Prisma's `date` / `createdAt`, since that's what every existing
// call site already expected (the previous version of this file declared
// those names but never actually produced them, so every reader silently got
// `undefined`).
export interface BackendSaleRecord {
  saleRef: string;
  sareeId: string;
  channel: SalesChannel;
  customerId: string | null;
  amount: string;
  saleDate: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  saree?: {
    designCode: string | null;
    sareeTypeCode: string | null;
    sareeType: { type: string } | null;
  } | null;
  customer?: { id: string; name: string } | null;
  /** Shop Staff / Accountant who rang up this sale. */
  soldBy?: BackendActorSummary | null;
}

export interface BackendSaleReturn {
  returnRef: string;
  sareeId: string;
  reason: string | null;
  refundAmount: string | null;
  restocked: boolean;
  returnDate: string;
}

function normalizeSale(raw: RawSaleRecord): BackendSaleRecord {
  const { date, ...rest } = raw;
  return { ...rest, saleDate: date };
}

function normalizeReturn(raw: RawReturnRecord): BackendSaleReturn {
  const { createdAt, ...rest } = raw;
  return { ...rest, returnDate: createdAt };
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSalePayload {
  sareeId: string;
  channel: SalesChannel;
  /** Required when channel === 'WHOLESALE' */
  customerId?: string;
  amount: number;
  /** How the customer paid at the counter — "cash" | "upi" | "card" | "other". */
  paymentMethod?: string;
  /** UPI transaction id or last-4 card digits, when the method has one. */
  paymentRef?: string;
}

export interface CreateReturnPayload {
  sareeId: string;
  reason?: string;
  refundAmount?: number;
  restocked?: boolean;
}

/**
 * A wholesale return whose piece was never tracked: it arrives with no barcode,
 * so it is registered from the operator's description under the tag id being
 * attached to it. Use createReturn instead when the saree was sold by us.
 */
export interface RegisterReturnedSareePayload {
  sareeId: string;
  sourceName: string;
  reason: string;
  weightG: number;
  costPrice?: number;
  sareeType?: string;
  color?: string;
  /** Server-relative path from POST /uploads/photo. */
  photoUrl?: string;
}

/** One piece on a multi-saree wholesale return consignment. */
export interface ReturnedSareeItem {
  /** Omit when the piece has no physical tag — the server generates one. */
  sareeId?: string;
  reason: string;
  /** Free text captured when `reason` is "Other". */
  reasonNote?: string;
  weightG: number;
  costPrice?: number;
  /** A SareeTypeRate code or its human name. */
  sareeType?: string;
  color?: string;
  photoUrl?: string;
}

/** A whole consignment sent back by one vendor, registered in one write. */
export interface RegisterReturnedSareesPayload {
  sourceName: string;
  /** The wholesale Customer the source resolves to, when picked from the list. */
  sourceCustomerId?: string;
  items: ReturnedSareeItem[];
}

/** One piece coming back off a wholesale dispatch we raised. */
export interface DispatchedReturnItem {
  sareeId: string;
  reason: string;
  /** Free text captured when `reason` is "Other". */
  reasonNote?: string;
  /** Server-relative path from POST /uploads/photo. */
  photoUrl?: string;
  /** Overrides the dispatch's per-saree price for this piece only. */
  refundAmount?: number;
}

/** A wholesale buyer returning part of one consignment, in one write. */
export interface RegisterDispatchedReturnsPayload {
  /** The WHOLESALE DispatchRecord the pieces went out on. */
  dispatchId: string;
  items: DispatchedReturnItem[];
}

/**
 * One returned saree as the shop's Inventory screen shows it. `category` is
 * decided server-side by whether the original sale exists, and `inInventory`
 * is the gate: a return is only sellable once it has been sent to inventory.
 */
export interface ReturnStockItem {
  returnRef: string;
  sareeId: string;
  category: "retail" | "wholesale";
  returnDate: string;
  reason: string | null;
  refundAmount: number | null;
  photoUrl: string | null;
  inInventory: boolean;
  source: string | null;
  saleRef: string | null;
  saleDate: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  color: string | null;
  weightG: number | null;
  costPrice: number | null;
  retailPrice: number | null;
}

export const salesApi = {
  /** POST /sales — record a completed retail or wholesale sale */
  create: async (payload: CreateSalePayload) =>
    normalizeSale(await apiClient.post<RawSaleRecord>("/sales", payload)),

  /**
   * GET /sales — paginated list of sales. Pass `customerId` to pull one
   * customer's full purchase history instead of slicing the global list, which
   * silently truncated any customer whose sales fell outside the first page.
   */
  list: async (
    pageSize = 100,
    opts?: { customerId?: string; channel?: SalesChannel; page?: number },
  ): Promise<PaginatedResponse<BackendSaleRecord>> => {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.customerId) params.set("customerId", opts.customerId);
    if (opts?.channel) params.set("channel", opts.channel);
    const res = await apiClient.get<PaginatedResponse<RawSaleRecord>>(`/sales?${params.toString()}`);
    return { ...res, items: res.items.map(normalizeSale) };
  },

  /** GET /sales/:saleRef */
  findOne: async (saleRef: string) =>
    normalizeSale(await apiClient.get<RawSaleRecord>(`/sales/${saleRef}`)),

  /** POST /sales/returns — record a returned saree */
  createReturn: async (payload: CreateReturnPayload) =>
    normalizeReturn(await apiClient.post<RawReturnRecord>("/sales/returns", payload)),

  /** POST /sales/returns/untracked — register a barcode-less wholesale return */
  registerReturnedSaree: async (payload: RegisterReturnedSareePayload) =>
    normalizeReturn(await apiClient.post<RawReturnRecord>("/sales/returns/untracked", payload)),

  /** POST /sales/returns/untracked/bulk — register a whole consignment at once */
  registerReturnedSarees: async (payload: RegisterReturnedSareesPayload) => {
    const raw = await apiClient.post<RawReturnRecord[]>("/sales/returns/untracked/bulk", payload);
    return raw.map(normalizeReturn);
  },

  /**
   * POST /sales/returns/dispatched — a wholesale buyer sending back pieces off
   * a consignment we dispatched to them. The sarees already exist and the
   * dispatch proves where they went, so unlike the untracked path nothing is
   * created from a description.
   */
  registerDispatchedReturns: async (payload: RegisterDispatchedReturnsPayload) => {
    const raw = await apiClient.post<RawReturnRecord[]>("/sales/returns/dispatched", payload);
    return raw.map(normalizeReturn);
  },

  /** GET /sales/returns/stock — every return, categorised, for Inventory */
  listReturnStock: (limit?: number) =>
    apiClient.get<ReturnStockItem[]>(
      `/sales/returns/stock${limit ? `?limit=${limit}` : ""}`,
    ),

  /** POST /sales/returns/:ref/restock — make a held return sellable */
  sendReturnToInventory: (returnRef: string) =>
    apiClient.post<RawReturnRecord>(`/sales/returns/${encodeURIComponent(returnRef)}/restock`, {}),

  /** GET /sales/returns/all */
  listReturns: async (pageSize = 100): Promise<PaginatedResponse<BackendSaleReturn>> => {
    const res = await apiClient.get<PaginatedResponse<RawReturnRecord>>(`/sales/returns/all?pageSize=${pageSize}`);
    return { ...res, items: res.items.map(normalizeReturn) };
  },
};
