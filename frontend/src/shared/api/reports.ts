import { apiClient } from "./client";

export interface OutstandingPaymentItem {
  source: "invoice" | "bulk_order";
  id: string;
  customerCode: string;
  customerName: string;
  /** Who raised it — the wholesale dispatch's dispatchedBy for an invoice,
   *  the bulk order's createdBy for a bulk order. "—" when neither is set. */
  raisedBy: string;
  /** When it was actually raised (not the payment due date below). */
  raisedAt: string;
  dueDate: string | null;
  /** How many sarees it covers — null for an invoice with no linked dispatch. */
  quantity: number | null;
  total: number;
  paid: number;
  outstanding: number;
  status: string;
}

export interface OutstandingPaymentsReport {
  items: OutstandingPaymentItem[];
  totalOutstanding: number;
  count: number;
}

export interface ProducedSareeRow {
  sareeId: string;
  origin: string;
  weaverCode: string;
  factoryLoomCode: string;
  purchaseId: string;
  batchId: string;
  designCode: string;
  designName: string;
  sareeTypeCode: string;
  weightG: number | null;
  costPrice: number | null;
  color: string;
  sourceName: string;
  qcDate: string | null;
  status: string;
  createdAt: string;
}

export interface ProductionSummaryReport {
  totalSareesProduced: number;
  qcByResult: Record<"PASSED" | "SEMI" | "DEFECTIVE", number>;
  finishingByStatus: Record<string, number>;
  sarees: ProducedSareeRow[];
}

export interface RetailSaleRow {
  saleRef: string;
  soldBy: string;
  soldAt: string;
  customerName: string;
  sareeId: string;
  quantity: number;
  amount: number;
}

export interface WholesaleDispatchRow {
  /** Human-facing reference (invoice number, falling back to the delivery
   *  challan number) — never the raw uuid primary key. */
  dispatchId: string;
  dispatchedBy: string;
  dispatchedAt: string;
  customerName: string;
  quantity: number;
  amount: number;
  invoiceNumber: string;
  invoiceDate: string | null;
  challanNumber: string;
  pricePerSaree: number | null;
  totalAmount: number;
  gstPct: number | null;
  grandTotal: number;
  firmName: string;
  lrNumber: string;
  transportCompany: string;
  vehicleNumber: string;
  driverName: string;
  expectedDelivery: string | null;
  paymentDueDate: string | null;
  bulkOrderRef: string;
  quotationRef: string;
  notes: string;
}

// Flat, matching what the backend's buildReportWorkbook needs (top-level
// arrays become table sheets, top-level scalars land on one Summary sheet)
// — see ReportsService.getSalesSummary's own comment on why this isn't
// nested under `retail`/`wholesale` objects any more.
export interface SalesSummaryReport {
  retailSales: RetailSaleRow[];
  retailTotalSales: number;
  retailCount: number;
  wholesaleSales: WholesaleDispatchRow[];
  wholesaleTotalSales: number;
  wholesaleTotalQuantity: number;
  wholesaleCount: number;
}

// Wholesale/retail-only reports — used by the scheduled Retail/Wholesale
// Sales Report deliveries so each carries only its own rows, not the other
// channel's too (that's what made a "Wholesale Sales Report" delivery show
// the same content as a "Retail Sales Report" one).
export interface RetailSalesReport {
  retailSales: RetailSaleRow[];
  totalSales: number;
  totalQuantity: number;
  count: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface WholesaleSalesReport {
  wholesaleSales: WholesaleDispatchRow[];
  totalSales: number;
  totalQuantity: number;
  count: number;
  periodStart: string | null;
  periodEnd: string | null;
}

/** paymentsCollectedPct here spans every invoice ever raised, unlike
 *  outstandingPayments (which only covers invoices still owed) — the one to
 *  use for "what fraction of everything invoiced has actually been paid". */
export interface ProductionAnalyticsReport {
  activeBatchesCount: number;
  weaversWorkingCount: number;
  designCodesCount: number;
  overdueInvoicesCount: number;
  paymentsCollectedPct: number;
  rawMaterialStockKg: number;
  dispatchCount: number;
  inStockSareesCount: number;
}

export interface RawMaterialReceiptRow {
  grnId: string;
  vendorName: string;
  receivedBy: string;
  receivedAt: string;
  materialType: string;
  materialName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
}

export interface RawMaterialReport {
  materialReceipts: RawMaterialReceiptRow[];
  totalReceipts: number;
  totalLineItems: number;
  totalSpend: number;
}

export interface WeaverPaymentRow {
  paymentId: string;
  weaverName: string;
  recordedBy: string;
  paidAt: string;
  quantity: number | null;
  amount: number;
  deduction: number;
}

export interface WeaverPaymentReport {
  weaverPayments: WeaverPaymentRow[];
  totalPayments: number;
  totalPaid: number;
  totalDeducted: number;
}

export interface CustomerReportRow {
  customerCode: string;
  customerName: string;
  type: string;
  city: string;
  joinedAt: string;
  lastOrderAt: string | null;
  quantity: number;
  totalSpend: number;
}

export interface CustomerReport {
  customers: CustomerReportRow[];
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface ProfitAndLossLine {
  source: string;
  type: "Revenue" | "Cost";
  quantity: number;
  amount: number;
  /** The earliest/latest record date backing this line's figure. */
  periodStart: string | null;
  periodEnd: string | null;
}

export interface ProfitAndLossNetResultRow {
  source: string;
  type: "Profit" | "Loss";
  quantity: number;
  amount: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface ProfitAndLossReport {
  lines: ProfitAndLossLine[];
  /** Single-row table, kept as its own sheet separate from `lines` — the
   *  net profit/loss across everything, not mixed in with the individual
   *  revenue/cost rows. */
  netResult: ProfitAndLossNetResultRow[];
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  /** Spelled out plainly rather than left to the reader to infer from
   *  netProfit's sign. */
  result: "Profit" | "Loss";
  resultAmount: number;
  /** e.g. "Profit of ₹4,000" / "Loss of ₹1,200". */
  resultSummary: string;
  /** Net profit as a % of total revenue. */
  profitMarginPct: number | null;
  /** The overall span the whole report covers, across every line. */
  reportPeriodStart: string | null;
  reportPeriodEnd: string | null;
}

export type ReportFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";

export interface ScheduledReportItem {
  id: string;
  reportName: string;
  frequency: ReportFrequency;
  format: string;
  /** Bare 10-digit WhatsApp number the report is delivered to. */
  recipientPhone?: string | null;
  /** Legacy column, kept only so pre-WhatsApp rows still render. */
  recipientEmail?: string | null;
  /** Delivery hour/minute in IST. */
  deliveryHour: number;
  deliveryMinute: number;
  active: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  /** Next few delivery instants, computed server-side. Empty when paused. */
  upcomingRuns?: string[];
}

export interface CreateSchedulePayload {
  reportName: string;
  frequency: ReportFrequency;
  format?: string;
  recipientPhone: string;
  /** "HH:mm" in IST. */
  deliveryTime?: string;
  actorId?: string;
}

export interface UpdateSchedulePayload {
  reportName?: string;
  frequency?: ReportFrequency;
  format?: string;
  recipientPhone?: string;
  deliveryTime?: string;
  active?: boolean;
  actorId?: string;
}

export interface ReportDownloadHistoryItem {
  id: string;
  reportName: string;
  fileType: string;
  downloadUrl?: string | null;
  downloadedBy?: { id: string; firstName: string; lastName: string } | null;
  downloadedAt: string;
  filtersUsed?: Record<string, unknown>;
}

export interface RecordDownloadPayload {
  reportName: string;
  fileType?: string;
  downloadUrl?: string;
  downloadedById?: string;
  filtersUsed?: Record<string, unknown>;
}

export const reportsApi = {
  outstandingPayments: () => apiClient.get<OutstandingPaymentsReport>("/reports/outstanding-payments"),
  productionSummary: () => apiClient.get<ProductionSummaryReport>("/reports/production-summary"),
  salesSummary: () => apiClient.get<SalesSummaryReport>("/reports/sales-summary"),
  retailSalesReport: () => apiClient.get<RetailSalesReport>("/reports/retail-sales"),
  wholesaleSalesReport: () => apiClient.get<WholesaleSalesReport>("/reports/wholesale-sales"),
  productionAnalytics: () => apiClient.get<ProductionAnalyticsReport>("/reports/production-analytics"),
  rawMaterialReport: () => apiClient.get<RawMaterialReport>("/reports/raw-material"),
  weaverPaymentReport: () => apiClient.get<WeaverPaymentReport>("/reports/weaver-payments"),
  customerReport: () => apiClient.get<CustomerReport>("/reports/customers"),
  profitAndLossReport: () => apiClient.get<ProfitAndLossReport>("/reports/profit-loss"),
  listSchedules: () => apiClient.get<{ items: ScheduledReportItem[] }>("/reports/schedules"),
  // Dates an unsaved schedule would fire on — same server-side maths the
  // scheduler uses, so the preview cannot disagree with reality.
  previewSchedule: (frequency: ReportFrequency, deliveryTime: string, count = 5) =>
    apiClient.get<{ runs: string[] }>(
      `/reports/schedules/preview?frequency=${encodeURIComponent(frequency)}` +
        `&deliveryTime=${encodeURIComponent(deliveryTime)}&count=${count}`,
    ),
  createSchedule: (payload: CreateSchedulePayload) => apiClient.post<ScheduledReportItem>("/reports/schedules", payload),
  updateSchedule: (id: string, payload: UpdateSchedulePayload) =>
    apiClient.patch<ScheduledReportItem>(`/reports/schedules/${id}`, payload),
  deleteSchedule: (id: string) => apiClient.delete<{ success: boolean }>(`/reports/schedules/${id}`),
  listHistory: () => apiClient.get<{ items: ReportDownloadHistoryItem[]; total: number }>("/reports/history"),
  recordDownload: (payload: RecordDownloadPayload) => apiClient.post<ReportDownloadHistoryItem>("/reports/history", payload),
};
