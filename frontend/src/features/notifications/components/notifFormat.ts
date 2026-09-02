import { formatMoney, rupees } from "@/lib/domain/money";
import type { BackendNotification } from "@/shared/api/notifications";
import type { Priority, UnifiedNotif } from "./notifTypes";

/** Payload values arrive as free-form JSON — read them defensively. */
type Payload = Record<string, unknown>;

const str = (v: unknown): string | null =>
  v === null || v === undefined || v === "" ? null : String(v);
const num = (v: unknown): number => Number(v ?? 0);
const money = (v: unknown): string => formatMoney(rupees(num(v)));
const pieces = (v: unknown): string => {
  const n = num(v);
  return `${n} ${n === 1 ? "piece" : "pieces"}`;
};
const suffix = (v: unknown): string => {
  const s = str(v);
  return s ? ` — ${s}` : "";
};
const withReason = (body: string, reason: unknown): string => {
  const s = str(reason);
  return s ? `${body} Reason: ${s}` : body;
};

interface TypeConfig {
  category: UnifiedNotif["category"];
  priority: Priority;
  title: (payload: Payload) => string;
  body: (payload: Payload) => string;
}

/**
 * Backend Notification rows only carry a `type` string + free-form JSON
 * payload (no title/body/priority/category) — this table is the only place
 * that turns a real backend event into the rich display shape below.
 *
 * Every type the backend emits has an entry here. That is deliberate: the
 * inferCategory/inferPriority fallbacks underneath work on substrings of the
 * type name, so a type whose name happens not to contain a magic word lands
 * in the default bucket silently — which is exactly how
 * SHOP_RECEIPT_DISCREPANCY_ALERT ended up filed under Production and
 * SHOP_DISPATCH_INCOMING_STOCK under Raw Materials. Inference now only ever
 * covers a type nobody has described yet.
 */
const TYPE_CONFIG: Record<string, TypeConfig> = {
  // ── Weavers & Looms ──────────────────────────────────────────────────
  WEAVER_WARP_REQUEST_RAISED: {
    category: "weaver",
    priority: "warning",
    title: p => `Warp Requested${suffix(p.weaverName)}`,
    body: p =>
      `${num(p.lengthMeters)}m of ${str(p.warpType) ?? "warp"} requested${p.loomNumber ? ` for loom ${String(p.loomNumber)}` : ""}. Awaiting approval.`,
  },
  WEAVER_WARP_REQUEST_APPROVED: {
    category: "weaver",
    priority: "success",
    title: () => "Warp Request Approved",
    body: p => `${num(p.lengthMeters)}m of ${str(p.warpType) ?? "warp"} has been approved for issue.`,
  },
  WEAVER_WARP_REQUEST_REJECTED: {
    category: "weaver",
    priority: "critical",
    title: () => "Warp Request Rejected",
    body: p => withReason(`Your request for ${str(p.warpType) ?? "warp"} was not approved.`, p.reason),
  },
  WEAVER_RATE_REQUEST_RAISED: {
    category: "weaver",
    priority: "warning",
    title: p => `Rate Change Requested${suffix(p.sareeTypeCode)}`,
    body: p =>
      `${str(p.requestedByName) ?? "Someone"} asked to change the making charge from ${money(p.oldMakingCharge)} to ${money(p.newMakingCharge)}.`,
  },
  WEAVER_RATE_REQUEST_APPROVED: {
    category: "weaver",
    priority: "success",
    title: p => `Rate Change Approved${suffix(p.sareeTypeCode)}`,
    body: p => `The making charge is now ${money(p.newMakingCharge)}.`,
  },
  WEAVER_RATE_REQUEST_REJECTED: {
    category: "weaver",
    priority: "critical",
    title: p => `Rate Change Rejected${suffix(p.sareeTypeCode)}`,
    body: p => withReason("The existing rate stays in place.", p.reason),
  },
  WEAVER_PAYMENT_PAID: {
    category: "weaver",
    priority: "success",
    title: () => "Payment Received",
    body: p =>
      `${money(p.amountPaid)} has been paid to you${p.utrNumber ? ` (UTR ${String(p.utrNumber)})` : ""}.`,
  },
  WEAVER_DESIGN_ASSIGNED: {
    category: "weaver",
    priority: "info",
    title: () => "New Design Assigned",
    body: p => str(p.instructions) ?? "A new design has been dispatched to you.",
  },
  WEAVER_LOOM_ROW_ASSIGNED: {
    category: "weaver",
    priority: "info",
    title: () => "Sarees Assigned",
    body: p =>
      `${pieces(p.rowCount)} from batch ${str(p.batchId) ?? "—"} assigned to you${p.designCode ? ` (design ${String(p.designCode)})` : ""}.`,
  },
  WEAVER_DEACTIVATED: {
    category: "weaver",
    priority: "warning",
    title: p => `Weaver Removed${suffix(p.weaverName)}`,
    body: p =>
      p.hadPortalAccess
        ? "Their weaver record and portal login have both been deleted."
        : "Their weaver record has been deleted.",
  },

  // ── Production & Batches ─────────────────────────────────────────────
  BATCH_QC_FAILED: {
    category: "production",
    priority: "critical",
    title: p => `QC Failed${suffix(p.sareeId)}`,
    body: p => {
      const defects = Array.isArray(p.defects) && p.defects.length ? ` Defects: ${p.defects.join(", ")}.` : "";
      return `Saree rejected at inspection and sent back for rework.${defects} Deduction ${money(p.deduction)}.`;
    },
  },
  BATCH_QC_SEMI_DEFECT: {
    category: "production",
    priority: "warning",
    title: p => `QC Downgraded${suffix(p.sareeId)}`,
    body: p => {
      const defects = Array.isArray(p.defects) && p.defects.length ? ` Defects: ${p.defects.join(", ")}.` : "";
      return `Passed as semi-defective and sent back for rework.${defects} Deduction ${money(p.deduction)}.`;
    },
  },
  BATCH_FINALIZED: {
    category: "production",
    priority: "success",
    title: p => `Batch Finalized${suffix(p.batchId)}`,
    body: p => `${pieces(p.rowCount)} are now active and out at the looms.`,
  },
  BATCH_ROW_RECEIVED: {
    category: "production",
    priority: "info",
    title: p => `Saree Received${suffix(p.sareeId)}`,
    body: p => `Row ${num(p.serial)} of batch ${str(p.batchId) ?? "—"} received at ${num(p.weight)}g.`,
  },
  BATCH_TALLY_MISMATCH: {
    category: "production",
    priority: "critical",
    title: p => `Tally Corrected${suffix(p.sareeId)}`,
    body: p => {
      const parts = [
        p.correctedWeight != null ? `weight ${num(p.correctedWeight)}g` : null,
        p.correctedWarpG != null ? `warp ${num(p.correctedWarpG)}g` : null,
        p.correctedReshamG != null ? `resham ${num(p.correctedReshamG)}g` : null,
        p.correctedJariReels != null ? `jari ${num(p.correctedJariReels)} reel(s)` : null,
      ].filter(Boolean);
      return `The entered figures disagreed with the tally — corrected to ${parts.join(", ")}.`;
    },
  },
  BATCH_DELIVERY_OVERDUE: {
    category: "production",
    priority: "critical",
    title: p => `Batch Overdue${suffix(p.batchId)}`,
    body: p =>
      `${pieces(p.pendingCount)} of ${num(p.totalCount)} still out at the looms, ${num(p.daysOverdue)} day(s) past the due date.`,
  },
  FINISHING_SENT: {
    category: "production",
    priority: "info",
    title: () => "Sent to Finishing",
    body: p =>
      `${pieces(p.sareeCount)} assigned to ${str(p.finishingStaffName) ?? "finishing staff"}${p.quotationRef ? ` against quotation ${String(p.quotationRef)}` : ""}.`,
  },
  FINISHING_RETURN_RECEIVED: {
    category: "production",
    priority: "success",
    title: p => `Finishing Complete${suffix(p.sareeId)}`,
    body: () => "Returned in perfect condition and ready for dispatch.",
  },
  FINISHING_RETURN_DAMAGED: {
    category: "production",
    priority: "critical",
    title: p => `Damaged in Finishing${suffix(p.sareeId)}`,
    body: p =>
      `Returned damaged${p.damageType ? ` (${String(p.damageType)}` : ""}${p.damageSeverity ? `, ${String(p.damageSeverity)})` : p.damageType ? ")" : ""} and parked for review.`,
  },

  // ── Raw Materials & Stock ────────────────────────────────────────────
  po_stock_received: {
    category: "material",
    priority: "success",
    title: p => `Stock Received${suffix(p.poNumber)}`,
    body: p =>
      `${p.vendorName ? `${String(p.vendorName)} · ` : ""}Goods receipt ${str(p.grnId) ?? ""} has been recorded.`.trim(),
  },
  material_signature_request: {
    category: "material",
    priority: "warning",
    title: p => (p.recordKind === "RETURN" ? "Confirm Material Return" : "Confirm Materials Issued"),
    body: p =>
      `Record ${str(p.recordId) ?? "—"} is waiting for your signature in the portal.`,
  },
  MATERIAL_SIGNATURE_COMPLETED: {
    category: "material",
    priority: "success",
    title: p => (p.recordKind === "RETURN" ? "Material Return Signed" : "Material Issue Signed"),
    body: p =>
      `${str(p.weaverName) ?? "The weaver"} has signed for record ${str(p.recordId) ?? "—"}.`,
  },
  RAW_MATERIAL_LOW_STOCK: {
    category: "material",
    priority: "warning",
    title: p => `Low Stock${suffix(p.materialName)}`,
    body: p =>
      `${num(p.currentStock)} ${str(p.unit) ?? ""} left, at or below the reorder level of ${num(p.reorderLevel)} ${str(p.unit) ?? ""}.`.replace(/\s+/g, " "),
  },
  RAW_MATERIAL_OUT_OF_STOCK: {
    category: "material",
    priority: "critical",
    title: p => `Out of Stock${suffix(p.materialName)}`,
    body: () => "Nothing left to issue — this will stop the looms until it is replenished.",
  },
  PURCHASE_REQUEST_RAISED: {
    category: "material",
    priority: "warning",
    title: p => `Purchase Requested${suffix(p.sareeType)}`,
    body: p =>
      `${str(p.requestedByName) ?? "Someone"} requested ${num(p.quantity)} × ${str(p.sareeType) ?? "item"}${p.estimatedAmount ? ` (est. ${money(p.estimatedAmount)})` : ""}${p.urgency ? ` · ${String(p.urgency)}` : ""}.`,
  },
  PURCHASE_REQUEST_APPROVED: {
    category: "material",
    priority: "success",
    title: p => `Purchase Request Approved${suffix(p.sareeType)}`,
    body: p => withReason(`${num(p.quantity)} × ${str(p.sareeType) ?? "item"} approved for purchase.`, p.decisionNote),
  },
  PURCHASE_REQUEST_REJECTED: {
    category: "material",
    priority: "critical",
    title: p => `Purchase Request Rejected${suffix(p.sareeType)}`,
    body: p => withReason("This request will not be purchased.", p.decisionNote),
  },
  PURCHASE_ORDER_RAISED: {
    category: "material",
    priority: "info",
    title: p => `Purchase Order Raised${suffix(p.poNumber)}`,
    body: p =>
      `${str(p.vendorName) ?? "Vendor"} · ${num(p.itemCount)} line(s), ${money(p.totalValue)}${p.urgency ? ` · ${String(p.urgency)}` : ""}. Awaiting approval.`,
  },
  GRN_QUANTITY_MISMATCH: {
    category: "material",
    priority: "critical",
    title: p => `Short Delivery${suffix(p.poNumber)}`,
    body: p =>
      `${num(p.lineCount)} line(s) from ${str(p.vendorName) ?? "the vendor"} did not match what was ordered.`,
  },
  SUPPLIER_RETURN_RAISED: {
    category: "material",
    priority: "warning",
    title: p => `Return Requested${suffix(p.supplierName)}`,
    body: p =>
      withReason(`${pieces(p.quantity)} to be returned. These stay reserved until decided.`, p.reason),
  },
  SUPPLIER_RETURN_DECIDED: {
    category: "material",
    priority: "info",
    title: p => `Return ${p.decision === "APPROVED" ? "Approved" : "Rejected"}${suffix(p.supplierName)}`,
    body: p => withReason(`${pieces(p.quantity)}.`, p.decisionNote),
  },

  VENDOR_ADDED: {
    category: "material",
    priority: "info",
    title: p => `Vendor Added${suffix(p.name)}`,
    body: p =>
      `${str(p.code) ?? "New vendor"}${p.city ? ` · ${String(p.city)}` : ""}${p.contactName ? ` · contact ${String(p.contactName)}` : ""}.`,
  },
  VENDOR_STATUS_CHANGED: {
    category: "material",
    priority: "warning",
    title: p => `Vendor ${p.status === "OVERDUE" ? "Marked Overdue" : "Deactivated"}${suffix(p.name)}`,
    body: p => `Status changed from ${str(p.previousStatus) ?? "—"} to ${str(p.status) ?? "—"}.`,
  },
  VENDOR_REACTIVATED: {
    category: "material",
    priority: "success",
    title: p => `Vendor Reactivated${suffix(p.name)}`,
    body: p => `Back to active from ${str(p.previousStatus) ?? "—"} — orders can be raised again.`,
  },
  VENDOR_REMOVED: {
    category: "material",
    priority: "warning",
    title: p => `Vendor Removed${suffix(p.name)}`,
    body: p => `${str(p.code) ?? "The vendor"} has been deleted.`,
  },
  SUPPLIER_ADDED: {
    category: "material",
    priority: "info",
    title: p => `Supplier Added${suffix(p.name)}`,
    body: p =>
      `${str(p.code) ?? "New supplier"}${p.city ? ` · ${String(p.city)}` : ""}${p.contactName ? ` · contact ${String(p.contactName)}` : ""}.`,
  },
  SUPPLIER_STATUS_CHANGED: {
    category: "material",
    priority: "warning",
    title: p => `Supplier ${p.status === "OVERDUE" ? "Marked Overdue" : "Deactivated"}${suffix(p.name)}`,
    body: p => `Status changed from ${str(p.previousStatus) ?? "—"} to ${str(p.status) ?? "—"}.`,
  },
  SUPPLIER_REACTIVATED: {
    category: "material",
    priority: "success",
    title: p => `Supplier Reactivated${suffix(p.name)}`,
    body: p => `Back to active from ${str(p.previousStatus) ?? "—"} — purchases can be raised again.`,
  },
  SUPPLIER_REMOVED: {
    category: "material",
    priority: "warning",
    title: p => `Supplier Removed${suffix(p.name)}`,
    body: p => `${str(p.code) ?? "The supplier"} has been deleted.`,
  },

  // ── Payments & Invoices ──────────────────────────────────────────────
  invoice_overdue: {
    category: "payment",
    priority: "critical",
    title: p => `Invoice Overdue${suffix(p.invoiceNumber)}`,
    body: p => `Outstanding amount ${money(p.outstanding)} is more than 45 days overdue.`,
  },
  bulk_order_payment_overdue: {
    category: "payment",
    priority: "critical",
    title: p => `Order Payment Overdue${suffix(p.bulkOrderRef)}`,
    body: p => `Outstanding amount ${money(p.outstanding)} is more than 45 days overdue.`,
  },
  INVOICE_CREATED: {
    category: "payment",
    priority: "info",
    title: p => `Invoice Raised${suffix(p.invoiceNumber)}`,
    body: p => `${money(p.total)} billed to ${str(p.customerName) ?? "customer"}.`,
  },
  INVOICE_PAYMENT_RECEIVED: {
    category: "payment",
    priority: "success",
    title: p => `Part Payment Received${suffix(p.invoiceNumber)}`,
    body: p => `${money(p.amount)} received. ${money(p.outstanding)} still outstanding.`,
  },
  INVOICE_PAID: {
    category: "payment",
    priority: "success",
    title: p => `Invoice Settled${suffix(p.invoiceNumber)}`,
    body: p => `${money(p.total)} paid in full.`,
  },
  VENDOR_BILL_CREATED: {
    category: "payment",
    priority: "info",
    title: p => `Vendor Bill Raised${suffix(p.vendorName)}`,
    body: p => `${money(p.amount)} billed${p.poNumber ? ` against ${String(p.poNumber)}` : ""}.`,
  },
  VENDOR_BILL_MISMATCH: {
    category: "payment",
    priority: "critical",
    title: p => `Bill Does Not Match Order${suffix(p.poNumber)}`,
    body: p =>
      `${str(p.vendorName) ?? "Vendor"} billed ${money(p.billedAmount)} against an order of ${money(p.orderedValue)} — a difference of ${money(Math.abs(num(p.difference)))}.`,
  },
  VENDOR_PAYMENT_PAID: {
    category: "payment",
    priority: "success",
    title: p => `Vendor Paid${suffix(p.vendorName)}`,
    body: p => `${money(p.amount)} paid${p.billId ? " against a bill" : ""}.`,
  },
  SUPPLIER_PAYMENT_PAID: {
    category: "payment",
    priority: "success",
    title: p => `Supplier Paid${suffix(p.supplierName)}`,
    body: p => `${money(p.amount)} paid${p.purchaseId ? " against a purchase" : ""}.`,
  },
  BULK_ORDER_PAYMENT_RECEIVED: {
    category: "payment",
    priority: "success",
    title: p => `Order Payment Received${suffix(p.bulkOrderRef)}`,
    body: p =>
      `${money(p.amount)} received from ${str(p.customerName) ?? "customer"}. ${money(p.amountDue)} still due.`,
  },
  PAYMENT_IMPORT_COMPLETED: {
    category: "payment",
    priority: "success",
    title: p => `${p.kind === "VENDOR" ? "Vendor" : "Weaver"} Payment Import Finished`,
    body: p =>
      `${num(p.created)} payment(s) saved totalling ${money(p.totalAmount)}${num(p.failed) > 0 ? `, ${num(p.failed)} row(s) failed` : ""}.`,
  },

  // ── Shop & Dispatch ──────────────────────────────────────────────────
  SHOP_DISPATCH_INCOMING_STOCK: {
    category: "dispatch",
    priority: "info",
    title: p => `Consignment On Its Way${suffix(p.challanNumber)}`,
    body: p =>
      `${pieces(p.sareeCount)} dispatched to the shop${p.lrNumber ? ` · LR ${String(p.lrNumber)}` : ""}.`,
  },
  SHOP_DISPATCH_RECEIVED: {
    category: "dispatch",
    priority: "success",
    title: p => `Consignment Received${suffix(p.challanNumber)}`,
    body: p => `The shop counter receipted ${pieces(p.received)} in full.`,
  },
  SHOP_RECEIPT_DISCREPANCY_ALERT: {
    category: "dispatch",
    priority: "critical",
    title: p => `Consignment Shortage${suffix(p.challanNumber)}`,
    body: p =>
      `${num(p.damaged)} damaged and ${num(p.missing)} missing out of ${num(p.received) + num(p.damaged) + num(p.missing)} on receipt ${str(p.code) ?? "—"}.`,
  },
  SHOP_DISPATCH_UNCONFIRMED: {
    category: "dispatch",
    priority: "warning",
    title: p => `Consignment Not Receipted${suffix(p.challanNumber)}`,
    body: p =>
      `${pieces(p.sareeCount)} dispatched ${num(p.daysSinceDispatch)} day(s) ago and still not confirmed by the shop.`,
  },
  SHOP_SALE_RECORDED: {
    category: "dispatch",
    priority: "info",
    title: p => `Sale Recorded${suffix(p.saleRef)}`,
    body: p =>
      `${str(p.sareeId) ?? "A saree"} sold to ${str(p.customerName) ?? "customer"} for ${money(p.amount)} (${str(p.channel) ?? "retail"}).`,
  },
  SHOP_SALE_RETURNED: {
    category: "dispatch",
    priority: "warning",
    title: p => `Sale Returned${suffix(p.returnRef)}`,
    body: p =>
      withReason(
        `${str(p.sareeId) ?? "A saree"} returned by ${str(p.customerName) ?? "customer"}${p.refundAmount ? `, refund ${money(p.refundAmount)}` : ""}.`,
        p.reason,
      ),
  },
  SHOP_RETURN_TO_INVENTORY: {
    category: "dispatch",
    priority: "info",
    title: p => `Return Back In Stock${suffix(p.returnRef)}`,
    body: p => `${str(p.sareeId) ?? "A saree"} has been put back on the shop floor.`,
  },
  SHOP_STOCK_LOW: {
    category: "dispatch",
    priority: "warning",
    title: () => "Shop Stock Running Low",
    body: p =>
      `Only ${pieces(p.available)} left on the floor, at or below the threshold of ${num(p.threshold)}.`,
  },
  BULK_ORDER_PLACED: {
    category: "dispatch",
    priority: "info",
    title: p => `Bulk Order Placed${suffix(p.bulkOrderRef)}`,
    body: p =>
      `${str(p.customerName) ?? "Customer"} · ${money(p.total)}${p.designCode ? ` · design ${String(p.designCode)}` : ""}.`,
  },
};

export function humanizeType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Fallback only — every type the backend emits has a TYPE_CONFIG entry above.
 * DISPATCH is tested before STOCK on purpose: a name like
 * SHOP_DISPATCH_INCOMING_STOCK contains both, and it is a dispatch.
 */
export function inferCategory(type: string): UnifiedNotif["category"] {
  const t = type.toUpperCase();
  if (t.includes("PAYMENT") || t.includes("INVOICE") || t.includes("BILL")) return "payment";
  if (t.includes("DISPATCH") || t.includes("SHOP") || t.includes("ORDER") || t.includes("SALE")) return "dispatch";
  if (t.includes("WEAVER") || t.includes("LOOM")) return "weaver";
  if (t.includes("WARP") || t.includes("MATERIAL") || t.includes("STOCK") || t.includes("GRN")) return "material";
  if (t.includes("BATCH") || t.includes("SAREE") || t.includes("QC") || t.includes("FINISHING")) return "production";
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

/**
 * A config's title/body run against a payload written by the backend, so a
 * renamed or missing field must not blank the whole feed — fall back to the
 * humanized type / raw payload line if one throws.
 */
function safely(render: (p: Payload) => string, payload: Payload, fallback: () => string): string {
  try {
    return render(payload);
  } catch {
    return fallback();
  }
}

/** Title/body a bell popover shows for a raw backend row. */
export function notificationTitle(n: BackendNotification): string {
  const cfg = TYPE_CONFIG[n.type];
  if (!cfg) return humanizeType(n.type);
  return safely(cfg.title, n.payload ?? {}, () => humanizeType(n.type));
}

export function notificationBody(n: BackendNotification): string {
  const cfg = TYPE_CONFIG[n.type];
  if (!cfg) return formatPayloadBody(n.payload);
  return safely(cfg.body, n.payload ?? {}, () => formatPayloadBody(n.payload));
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
