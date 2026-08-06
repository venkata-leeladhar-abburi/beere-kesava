import { apiClient } from "./client";

export interface OutstandingPaymentItem {
  source: "invoice" | "bulk_order";
  id: string;
  customerId: string;
  customerName: string;
  dueDate: string | null;
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

export interface ProductionSummaryReport {
  totalSareesProduced: number;
  qcByResult: Record<"PASSED" | "SEMI" | "DEFECTIVE", number>;
  finishingByStatus: Record<string, number>;
}

export interface SalesSummaryReport {
  retail: { totalSales: number; count: number };
  wholesale: { totalSales: number; count: number };
}

export interface ScheduledReportItem {
  id: string;
  reportName: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  format: string;
  recipientEmail: string;
  active: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
}

export interface CreateSchedulePayload {
  reportName: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  format?: string;
  recipientEmail: string;
}

export interface ReportDownloadHistoryItem {
  id: string;
  reportName: string;
  fileType: string;
  downloadUrl?: string | null;
  downloadedBy?: { id: string; firstName: string; lastName: string } | null;
  downloadedAt: string;
  filtersUsed?: any;
}

export interface RecordDownloadPayload {
  reportName: string;
  fileType?: string;
  downloadUrl?: string;
  downloadedById?: string;
  filtersUsed?: any;
}

export const reportsApi = {
  outstandingPayments: () => apiClient.get<OutstandingPaymentsReport>("/reports/outstanding-payments"),
  productionSummary: () => apiClient.get<ProductionSummaryReport>("/reports/production-summary"),
  salesSummary: () => apiClient.get<SalesSummaryReport>("/reports/sales-summary"),
  listSchedules: () => apiClient.get<{ items: ScheduledReportItem[] }>("/reports/schedules"),
  createSchedule: (payload: CreateSchedulePayload) => apiClient.post<ScheduledReportItem>("/reports/schedules", payload),
  listHistory: () => apiClient.get<{ items: ReportDownloadHistoryItem[] }>("/reports/history"),
  recordDownload: (payload: RecordDownloadPayload) => apiClient.post<ReportDownloadHistoryItem>("/reports/history", payload),
};
