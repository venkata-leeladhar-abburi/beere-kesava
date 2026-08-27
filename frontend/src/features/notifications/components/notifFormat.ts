import { formatMoney, rupees } from "@/lib/domain/money";
import type { BackendNotification } from "@/shared/api/notifications";
import type { Priority, UnifiedNotif } from "./notifTypes";

// Backend Notification rows only carry a `type` string + free-form JSON
// payload (no title/body/priority/category) — this table is the only place
// that turns a real backend event into the rich display shape below. Unknown
// types fall back to an inferred info card so a new notification type never
// disappears silently.
const TYPE_CONFIG: Record<string, {
  category: UnifiedNotif["category"];
  priority: Priority;
  title: (payload: Record<string, unknown>) => string;
  body: (payload: Record<string, unknown>) => string;
}> = {
  invoice_overdue: {
    category: "payment",
    priority: "critical",
    title: p => `Invoice Overdue${p.invoiceNumber ? ` — ${String(p.invoiceNumber)}` : ""}`,
    body: p => `Outstanding amount ${formatMoney(rupees(Number(p.outstandingAmount ?? 0)))} is more than 45 days overdue.`,
  },
  po_stock_received: {
    category: "material",
    priority: "success",
    title: p => `Stock Received${p.poNumber ? ` — ${String(p.poNumber)}` : ""}`,
    body: p => `${p.vendorName ? `${String(p.vendorName)} · ` : ""}Goods receipt ${p.grnId ? String(p.grnId) : ""} has been recorded.`.trim(),
  },
};

export function humanizeType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function inferCategory(type: string): UnifiedNotif["category"] {
  const t = type.toUpperCase();
  if (t.includes("PAYMENT") || t.includes("INVOICE") || t.includes("BILL")) return "payment";
  if (t.includes("WARP") || t.includes("MATERIAL") || t.includes("STOCK") || t.includes("GRN")) return "material";
  if (t.includes("BATCH") || t.includes("SAREE") || t.includes("QC") || t.includes("FINISHING")) return "production";
  if (t.includes("WEAVER") || t.includes("LOOM")) return "weaver";
  if (t.includes("DISPATCH") || t.includes("ORDER") || t.includes("SALE")) return "dispatch";
  return "production";
}

export function inferPriority(type: string): Priority {
  const t = type.toUpperCase();
  if (t.includes("REJECT") || t.includes("FAIL") || t.includes("DEFECT") || t.includes("OVERDUE") || t.includes("CRITICAL")) return "critical";
  if (t.includes("PENDING") || t.includes("WARN") || t.includes("RISK")) return "warning";
  if (t.includes("APPROVE") || t.includes("PAID") || t.includes("SUCCESS") || t.includes("COMPLETE") || t.includes("SIGNED")) return "success";
  return "info";
}

/** Readable one-liner for a payload with no TYPE_CONFIG entry — never raw JSON. */
export function formatPayloadBody(payload?: Record<string, unknown> | null): string {
  if (!payload || Object.keys(payload).length === 0) return "No details provided.";
  return Object.entries(payload)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${humanizeType(k)}: ${String(v)}`)
    .join(" · ");
}

/** Title/body a bell popover shows for a raw backend row. */
export function notificationTitle(n: BackendNotification): string {
  const cfg = TYPE_CONFIG[n.type];
  return cfg ? cfg.title(n.payload ?? {}) : humanizeType(n.type);
}

export function notificationBody(n: BackendNotification): string {
  const cfg = TYPE_CONFIG[n.type];
  return cfg ? cfg.body(n.payload ?? {}) : formatPayloadBody(n.payload);
}

export function formatRelativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function toUnifiedNotif(n: BackendNotification): UnifiedNotif {
  const cfg = TYPE_CONFIG[n.type];
  return {
    id: n.id,
    priority: cfg?.priority ?? inferPriority(n.type),
    category: cfg?.category ?? inferCategory(n.type),
    title: notificationTitle(n),
    body: notificationBody(n),
    time: formatRelativeTime(n.createdAt),
    read: n.readAt !== null,
  };
}
