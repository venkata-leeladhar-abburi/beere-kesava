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
};

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module.replace(/_/g, " ");
}
