import type { BackendRole } from "@/shared/api/users";

/**
 * Which ActionLog modules belong to which staff portal.
 *
 * A person's history is shown scoped to the portal they work in — "what has
 * this worker done?" means their receipts, QC and finishing, not every module
 * in the system. Module names are the literals passed to
 * AuditLogService.recordAction (see backend `module: "..."` call sites).
 */
export interface PortalScope {
  /** Backend User.role this directory lists. */
  role: BackendRole;
  /** Plural heading, e.g. "Worker Staff". */
  label: string;
  /** Singular, for one person's page. */
  singular: string;
  blurb: string;
  /** ActionLog.module values that belong to this portal. */
  modules: string[];
}

export const WORKER_SCOPE: PortalScope = {
  role: "WORKER",
  label: "Worker Staff",
  singular: "Worker",
  blurb: "Everyone with Worker Staff access, and everything each of them has recorded in the Worker portal.",
  modules: ["BATCHES", "QC", "FINISHING", "DISPATCH", "MATERIALS"],
};

export const ACCOUNTANT_SCOPE: PortalScope = {
  role: "ACCOUNTANT",
  label: "Accountant Staff",
  singular: "Accountant",
  blurb: "Everyone with Accountant access, the money each of them has moved, and everything they have recorded in the Accountant portal.",
  modules: [
    "PAYMENTS", "WEAVERS", "VENDORS", "SUPPLIERS", "CUSTOMERS", "SALES",
    "PURCHASE", "PURCHASE_REQUESTS", "RATES", "RATE_REQUESTS", "APPROVALS", "REPORTS",
  ],
};

export const SHOP_SCOPE: PortalScope = {
  role: "SHOP",
  label: "Shop Staff",
  singular: "Shop Staff",
  blurb: "Everyone with Shop Staff access, and everything each of them has recorded in the Shop portal.",
  modules: ["SALES", "CUSTOMERS", "PAYMENTS", "REPORTS"],
};

/** Display label for an ActionLog module code. */
export const MODULE_LABELS: Record<string, string> = {
  BATCHES: "Receive Sarees",
  QC: "Quality Check",
  FINISHING: "Finishing",
  DISPATCH: "Dispatch",
  MATERIALS: "Materials",
  SALES: "Sales",
  CUSTOMERS: "Customers",
  PAYMENTS: "Payments",
  REPORTS: "Reports",
  WEAVERS: "Weavers",
  VENDORS: "Vendors",
  SUPPLIERS: "Suppliers",
  PURCHASE: "Purchases",
  PURCHASE_REQUESTS: "Purchase Requests",
  RATES: "Rates",
  RATE_REQUESTS: "Rate Requests",
  APPROVALS: "Approvals",
};

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module.replace(/_/g, " ");
}
