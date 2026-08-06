import { T } from "./theme";

// ── Data ───────────────────────────────────────────────────────────────────────
export const top10Customers: { name: string; spend: number }[] = [];

export const revenueSplit = [
  { name: "Wholesale", value: 0, fill: T.royalBurgundy },
  { name: "Retail", value: 0, fill: T.antiqueGold },
];

export const newVsReturning: { month: string; new: number; returning: number }[] = [];

export const frequentBuyers: { name: string; count: number; freq: string }[] = [];

export const inactiveAlerts: { name: string; type: string; time: string }[] = [];

export const wholesaleData: any[] = [];

export const retailData: any[] = [];

export const inactiveData: any[] = [];

export const top10RetailCustomers: { name: string; spend: number }[] = [];

export const retailCategorySplit: { name: string; value: number; fill: string }[] = [];

export const frequentRetailBuyers: { name: string; count: number; freq: string }[] = [];

export const inactiveRetailAlerts: { name: string; type: string; time: string }[] = [];

export const newVsReturningRetail: { month: string; new: number; returning: number }[] = [];
