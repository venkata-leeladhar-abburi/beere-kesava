import { apiClient } from "./client";

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface ProductionTrends {
  passed: number;
  pending: number;
  total: number;
}

export interface RevenueSplit {
  retail: number;
  wholesale: number;
  total: number;
}

export interface TopWeaverStat {
  name: string;
  amount: number;
}

export interface CashFlowMonthlyPoint {
  month: string; // "YYYY-MM"
  income: number;
  expenses: number;
}

export interface ProductionTrendMonthlyPoint {
  month: string; // "YYYY-MM"
  produced: number;
  passed: number;
}

export interface CustomersNewVsReturningMonthlyPoint {
  month: string; // "YYYY-MM"
  newCustomers: number;
  returningCustomers: number;
}

export const analyticsApi = {
  getCashFlow: () => apiClient.get<{ items: CashFlowPoint[] }>("/analytics/cash-flow"),
  getCashFlowMonthly: (months?: number) =>
    apiClient.get<{ items: CashFlowMonthlyPoint[] }>(
      `/analytics/cash-flow-monthly${months ? `?months=${months}` : ""}`,
    ),
  getProductionTrends: () => apiClient.get<ProductionTrends>("/analytics/production-trends"),
  getProductionTrendMonthly: (months?: number) =>
    apiClient.get<{ items: ProductionTrendMonthlyPoint[] }>(
      `/analytics/production-trend-monthly${months ? `?months=${months}` : ""}`,
    ),
  getRevenueSplit: () => apiClient.get<RevenueSplit>("/analytics/revenue-split"),
  getTopWeavers: () => apiClient.get<{ items: TopWeaverStat[] }>("/analytics/top-weavers"),
  getCustomersNewVsReturningMonthly: (months?: number) =>
    apiClient.get<{ items: CustomersNewVsReturningMonthlyPoint[] }>(
      `/analytics/customers-new-vs-returning-monthly${months ? `?months=${months}` : ""}`,
    ),
};
