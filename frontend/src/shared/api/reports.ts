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

export const reportsApi = {
  outstandingPayments: () => apiClient.get<OutstandingPaymentsReport>("/reports/outstanding-payments"),
  productionSummary: () => apiClient.get<ProductionSummaryReport>("/reports/production-summary"),
  salesSummary: () => apiClient.get<SalesSummaryReport>("/reports/sales-summary"),
};
