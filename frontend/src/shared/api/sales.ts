import { apiClient } from "./client";

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
  // Included by SalesService's saleInclude, but only the fields this app
  // actually reads are declared here.
  saree?: { designCode: string | null; sareeTypeCode: string | null } | null;
  customer?: { id: string; name: string } | null;
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
  saree?: { designCode: string | null; sareeTypeCode: string | null } | null;
  customer?: { id: string; name: string } | null;
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
  designCode?: string;
  sareeType?: string;
  color?: string;
}

export const salesApi = {
  /** POST /sales — record a completed retail or wholesale sale */
  create: async (payload: CreateSalePayload) =>
    normalizeSale(await apiClient.post<RawSaleRecord>("/sales", payload)),

  /** GET /sales — paginated list of all sales */
  list: async (pageSize = 100): Promise<PaginatedResponse<BackendSaleRecord>> => {
    const res = await apiClient.get<PaginatedResponse<RawSaleRecord>>(`/sales?pageSize=${pageSize}`);
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

  /** GET /sales/returns/all */
  listReturns: async (pageSize = 100): Promise<PaginatedResponse<BackendSaleReturn>> => {
    const res = await apiClient.get<PaginatedResponse<RawReturnRecord>>(`/sales/returns/all?pageSize=${pageSize}`);
    return { ...res, items: res.items.map(normalizeReturn) };
  },
};
