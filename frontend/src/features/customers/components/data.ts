import { T } from "./theme";
import type { InactiveCustomerRow } from "./sections/InactiveCustomersSection";

// Shape mirrors the objects CustomersPage.tsx builds for its `wholesaleList`
// memo (see the `mapped` array there) so `[...mapped, ...wholesaleData]`
// stays a uniform array.
export interface WholesaleCustomerRow {
  id: string;
  name: string;
  code: string;
  city: string;
  status: string;
  orders: number;
  spend: string;
  out: string;
  terms: string;
  lastOrder: string;
  activeOrder: unknown;
  duesMsg: string;
  gstNumber: string;
  visitingCard: string;
}

// Shape mirrors the objects CustomersPage.tsx builds for its `retailList`
// memo (see the `mapped` array there).
export interface RetailCustomerRow {
  id: string;
  name: string;
  initials: string;
  phone: string;
  city: string;
  purchases: number;
  spend: string;
  totalSpend: number;
  totalPurchases: number;
  lastVisit: string;
  regular: boolean;
  inactive: boolean;
}

// ── Data ───────────────────────────────────────────────────────────────────────
export const top10Customers: { name: string; spend: number }[] = [];

export const revenueSplit = [
  { name: "Wholesale", value: 0, fill: T.royalBurgundy },
  { name: "Retail", value: 0, fill: T.antiqueGold },
];

export const newVsReturning: { month: string; new: number; returning: number }[] = [];

export const frequentBuyers: { name: string; count: number; freq: string }[] = [];

export const inactiveAlerts: { name: string; type: string; time: string }[] = [];

export const wholesaleData: WholesaleCustomerRow[] = [];

export const retailData: RetailCustomerRow[] = [];

export const inactiveData: InactiveCustomerRow[] = [];

export const top10RetailCustomers: { name: string; spend: number }[] = [];

export const retailCategorySplit: { name: string; value: number; fill: string }[] = [];

export const frequentRetailBuyers: { name: string; count: number; freq: string }[] = [];

export const inactiveRetailAlerts: { name: string; type: string; time: string }[] = [];

export const newVsReturningRetail: { month: string; new: number; returning: number }[] = [];
