import { apiClient } from "./client";

export interface OutstandingPaymentItem {
  source: "invoice" | "bulk_order";
  id: string;
  customerCode: string;
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
