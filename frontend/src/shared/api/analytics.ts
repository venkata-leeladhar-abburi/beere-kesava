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

export const analyticsApi = {
  getCashFlow: () => apiClient.get<{ items: CashFlowPoint[] }>("/analytics/cash-flow"),
  getProductionTrends: () => apiClient.get<ProductionTrends>("/analytics/production-trends"),
  getRevenueSplit: () => apiClient.get<RevenueSplit>("/analytics/revenue-split"),
  getTopWeavers: () => apiClient.get<{ items: TopWeaverStat[] }>("/analytics/top-weavers"),
};
