// ── Shared types ───────────────────────────────────────────────────────────
// The original file kept these records loosely typed (`any`) throughout —
// preserved as-is here rather than retrofitting stricter types, to keep the
// split a pure refactor.
import { wholesaleData, retailData } from "./data";

export type WholesaleCustomer = typeof wholesaleData[number];
export type RetailCustomer = typeof retailData[number];

export type WholesaleTab = "Overview" | "Order History" | "Payment History" | "Contact Details" | "Edit Profile";
export type ViewMode = "card" | "list" | "table";
