/**
 * The status taxonomy — design-system/06-DOMAIN.md Part D.
 * ═══════════════════════════════════════════════════════════════════════════
 * The audit found 52 status string literals for ~28 real states, split
 * across case/spelling duplicates ("active"/"Active", "Completed"/
 * "completed"/"complete", "Passed QC"/"QC Passed") — and the `status` field
 * itself overloaded with five unrelated concepts. This file is the fix:
 * five separate typed unions (one per real taxonomy) plus the three sibling
 * concepts that were incorrectly living inside `status` (Part D.1).
 *
 * `<StatusPill taxonomy="payment" status="overdue" />` (shared/ui/domain)
 * resolves label/tone/icon from the registries below — callers never pass a
 * colour, so "Active" rendering differently from "active" becomes a
 * TypeScript error instead of a silent visual bug.
 */
import {
  FileText, Calendar, Loader2, Workflow, Sparkles, Clock, CheckCircle2,
  XCircle, PauseCircle, Ban, PackageCheck, PackageX, PackageSearch,
  Undo2, AlertOctagon, HandCoins, CircleDollarSign, BadgeCheck,
  CalendarClock, RotateCcw, Ban as VoidIcon, Send, FileSignature,
  UserCheck, UserX, AlertTriangle, UserPlus,
  type LucideIcon,
} from "lucide-react";

/** design-system/03-PRIMITIVES.md's 6 verified StatusPill tones. */
export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface StatusEntry {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
}

function taxonomy<K extends string>(entries: Record<K, StatusEntry>) {
  return entries;
}

/* ── Production ───────────────────────────────────────────────────────── */

export const PRODUCTION_STATUS = taxonomy({
  draft: { label: "Draft", tone: "neutral", icon: FileText },
  planned: { label: "Planned", tone: "neutral", icon: Calendar },
  warping: { label: "Warping", tone: "info", icon: Loader2 },
  weaving: { label: "Weaving", tone: "info", icon: Workflow },
  finishing: { label: "Finishing", tone: "info", icon: Sparkles },
  "qc-pending": { label: "Pending QC", tone: "warning", icon: Clock },
  "qc-passed": { label: "QC Passed", tone: "success", icon: CheckCircle2 },
  "qc-failed": { label: "QC Failed", tone: "danger", icon: XCircle },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2 },
  "on-hold": { label: "On Hold", tone: "warning", icon: PauseCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
});
export type ProductionStatus = keyof typeof PRODUCTION_STATUS;

/** design-system/06-DOMAIN.md D.4 — "transitions are validated": a saree
 *  cannot go straight from `qc-pending` to `completed` without passing QC.
 *  Deliberately minimal (production only, the one case the audit calls
 *  out by name) rather than a full state-machine engine for every
 *  taxonomy — extend if a second taxonomy needs enforced transitions. */
const PRODUCTION_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  draft: ["planned", "cancelled"],
  planned: ["warping", "cancelled"],
  warping: ["weaving", "on-hold", "cancelled"],
  weaving: ["finishing", "on-hold", "cancelled"],
  finishing: ["qc-pending", "on-hold", "cancelled"],
  "qc-pending": ["qc-passed", "qc-failed"],
  "qc-passed": ["completed"],
  "qc-failed": ["finishing", "cancelled"],
  completed: [],
  "on-hold": ["warping", "weaving", "finishing", "cancelled"],
  cancelled: [],
};

export function isValidProductionTransition(from: ProductionStatus, to: ProductionStatus): boolean {
  return PRODUCTION_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ── Inventory ────────────────────────────────────────────────────────── */

export const INVENTORY_STATUS = taxonomy({
  "in-stock": { label: "In Stock", tone: "success", icon: PackageCheck },
  "low-stock": { label: "Low Stock", tone: "warning", icon: AlertTriangle },
  "out-of-stock": { label: "Out of Stock", tone: "danger", icon: PackageX },
  reserved: { label: "Reserved", tone: "info", icon: PackageSearch },
  dispatched: { label: "Dispatched", tone: "info", icon: Send },
  sold: { label: "Sold", tone: "success", icon: BadgeCheck },
  returned: { label: "Returned", tone: "warning", icon: Undo2 },
  damaged: { label: "Damaged", tone: "danger", icon: AlertOctagon },
});
export type InventoryStatus = keyof typeof INVENTORY_STATUS;

/* ── Payment ──────────────────────────────────────────────────────────── */

export const PAYMENT_STATUS = taxonomy({
  unpaid: { label: "Unpaid", tone: "neutral", icon: CircleDollarSign },
  partial: { label: "Partially Paid", tone: "warning", icon: HandCoins },
  paid: { label: "Paid", tone: "success", icon: BadgeCheck },
  overdue: { label: "Overdue", tone: "danger", icon: AlertOctagon },
  "due-soon": { label: "Due Soon", tone: "warning", icon: CalendarClock },
  settled: { label: "Settled", tone: "success", icon: CheckCircle2 },
  refunded: { label: "Refunded", tone: "info", icon: RotateCcw },
  "written-off": { label: "Written Off", tone: "neutral", icon: VoidIcon },
});
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

/* ── Document ─────────────────────────────────────────────────────────── */

export const DOCUMENT_STATUS = taxonomy({
  draft: { label: "Draft", tone: "neutral", icon: FileText },
  raised: { label: "Raised", tone: "info", icon: FileSignature },
  sent: { label: "Sent", tone: "info", icon: Send },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  signed: { label: "Signed", tone: "success", icon: BadgeCheck },
  received: { label: "Received", tone: "success", icon: PackageCheck },
  void: { label: "Void", tone: "neutral", icon: VoidIcon },
});
export type DocumentStatus = keyof typeof DOCUMENT_STATUS;

/* ── Person / partner ─────────────────────────────────────────────────── */

export const PERSON_STATUS = taxonomy({
  active: { label: "Active", tone: "success", icon: UserCheck },
  inactive: { label: "Inactive", tone: "neutral", icon: UserX },
  "at-risk": { label: "At Risk", tone: "warning", icon: AlertTriangle },
  suspended: { label: "Suspended", tone: "danger", icon: Ban },
  onboarding: { label: "Onboarding", tone: "info", icon: UserPlus },
});
export type PersonStatus = keyof typeof PERSON_STATUS;

/* ── Resource condition ───────────────────────────────────────────────── */

/** Not one of Part D.2's five *lifecycle* taxonomies, but Part G.2's Loom
 *  card explicitly renders `ResourceCondition` as a status pill ("Status:
 *  condition") — this gives it the same dot+tone+label shape as the other
 *  five so `<StatusPill taxonomy="condition" .../>` works uniformly. */
export const CONDITION_STATUS = taxonomy({
  available: { label: "Available", tone: "success", icon: CheckCircle2 },
  reserved: { label: "Reserved", tone: "info", icon: PackageSearch },
  "in-use": { label: "In Use", tone: "info", icon: Loader2 },
  idle: { label: "Idle", tone: "neutral", icon: PauseCircle },
  maintenance: { label: "Maintenance", tone: "warning", icon: AlertTriangle },
});

/* ── The taxonomies, one lookup surface ──────────────────────────────── */

export const STATUS_TAXONOMIES = {
  production: PRODUCTION_STATUS,
  inventory: INVENTORY_STATUS,
  payment: PAYMENT_STATUS,
  document: DOCUMENT_STATUS,
  person: PERSON_STATUS,
  condition: CONDITION_STATUS,
} as const;

export type StatusTaxonomyName = keyof typeof STATUS_TAXONOMIES;
export type StatusValueOf<T extends StatusTaxonomyName> = keyof (typeof STATUS_TAXONOMIES)[T];

export function resolveStatus<T extends StatusTaxonomyName>(taxonomyName: T, status: StatusValueOf<T>): StatusEntry {
  const entry = (STATUS_TAXONOMIES[taxonomyName] as Record<string, StatusEntry>)[status as string];
  if (!entry) {
    // A status value that doesn't exist in its taxonomy — surface it loudly
    // in dev rather than silently rendering a blank pill (M4: this should
    // already be a compile error at the call site; this is the runtime
    // backstop for data coming from an untyped API response).
    if (import.meta.env.DEV) {
      console.error(`[StatusPill] "${String(status)}" is not a valid "${taxonomyName}" status`);
    }
    return { label: String(status), tone: "neutral", icon: FileText };
  }
  return entry;
}

/* ── Part D.1 — the three concepts that don't belong in `status` ────── */

/** Was found living inside `status` as `"retail"` / `"wholesale"` — an
 *  entity classification, not a lifecycle state. Render as a `Tag`, not a
 *  `StatusPill`. */
export type EntityType = "retail" | "wholesale";

/** Was found living inside `status` as `"idle"` / `"maintenance"` / etc. —
 *  a resource's physical condition (looms), not a document/order lifecycle. */
export type ResourceCondition = "available" | "reserved" | "in-use" | "idle" | "maintenance";

/** Was found living inside `status` as `"login"` / `"logout"` — belongs in
 *  an audit log's own event column, never a status pill. */
export type AuditEvent = "login" | "logout" | "create" | "update" | "delete" | "export";

/** Was found living inside `status` as `"Match"` / `"Short"` / `"Excess"` —
 *  a reconciliation result, its own column with a distinct visual treatment. */
export type ReconResult = "match" | "short" | "excess";
