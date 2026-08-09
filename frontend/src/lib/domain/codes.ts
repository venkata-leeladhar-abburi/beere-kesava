/**
 * The entity code registry — design-system/06-DOMAIN.md Part C.
 * ═══════════════════════════════════════════════════════════════════════════
 * The audit found 25 code prefixes with inconsistent shapes, 3 incompatible
 * invoice-number formats, and weaver-first-name-based codes (`RAVI-`,
 * `PADMA-`) that collide the moment a second Ravi is onboarded. One registry
 * defines every code's shape; `<EntityCode>` (shared/ui/domain) is the only
 * place that renders one.
 *
 * Financial-year segment: `2627` = 1 Apr 2026 – 31 Mar 2027 (Part C.2). Kept
 * self-contained (not imported from `shared/ui/date`) so this file — pure
 * domain logic — has no dependency on the component layer.
 */
import type { LucideIcon } from "@/shared/ui/primitives/icons";
import { Icons } from "@/shared/ui/primitives/icons";

export interface EntityCodeSpec {
  prefix: string;
  /** `000` = 3-digit zero-padded serial, `0000` = 4-digit, etc. `FY` marks
   *  where the financial-year segment goes for document types. */
  pattern: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  /** Documents carry a financial-year segment (`INV-2627-0142`); entities
   *  (weavers, sarees, …) don't (`WV-001`). */
  yearScoped?: boolean;
}

export const ENTITY_CODES = {
  weaver: { prefix: "WV", pattern: "WV-000", label: "Weaver", icon: Icons.weaver, route: "/weavers/:code" },
  batch: { prefix: "BATCH", pattern: "BATCH-000", label: "Batch", icon: Icons.batch, route: "/batches/:code" },
  saree: { prefix: "SR", pattern: "SR-00000", label: "Saree", icon: Icons.saree, route: "/inventory/:code" },
  design: { prefix: "DS", pattern: "DS-000", label: "Design", icon: Icons.design },
  loom: { prefix: "FL", pattern: "FL-000", label: "Loom", icon: Icons.loom },
  customer: { prefix: "CU", pattern: "CU-0000", label: "Customer", icon: Icons.customer },
  supplier: { prefix: "SUP", pattern: "SUP-000", label: "Supplier", icon: Icons.supplier },
  vendor: { prefix: "VEN", pattern: "VEN-000", label: "Vendor", icon: Icons.vendor },
  employee: { prefix: "EMP", pattern: "EMP-000", label: "Employee", icon: Icons.employee },

  // Documents — year-scoped, financial year (Apr–Mar)
  invoice: { prefix: "INV", pattern: "INV-FY-0000", label: "Invoice", icon: Icons.invoice, yearScoped: true },
  quotation: { prefix: "QTN", pattern: "QTN-FY-0000", label: "Quotation", icon: Icons.quotation, yearScoped: true },
  purchaseOrder: { prefix: "PO", pattern: "PO-FY-0000", label: "Purchase Order", icon: Icons.purchaseOrder, yearScoped: true },
  goodsReceipt: { prefix: "GRN", pattern: "GRN-FY-0000", label: "Goods Receipt", icon: Icons.goodsReceipt, yearScoped: true },
  challan: { prefix: "DC", pattern: "DC-FY-0000", label: "Delivery Challan", icon: Icons.challan, yearScoped: true },
  payment: { prefix: "PAY", pattern: "PAY-FY-0000", label: "Payment", icon: Icons.payment, yearScoped: true },
  order: { prefix: "ORD", pattern: "ORD-FY-0000", label: "Order", icon: Icons.order, yearScoped: true },
} as const satisfies Record<string, EntityCodeSpec>;

export type EntityCodeType = keyof typeof ENTITY_CODES;

/** `ENTITY_CODES[type]` alone narrows to the specific literal shape for that
 *  key (missing `route`/`yearScoped` entirely on entities that don't set
 *  them), so TS refuses property access across the union. This widens to
 *  the full `EntityCodeSpec` shape, where those fields are simply optional. */
export function getEntitySpec(type: EntityCodeType): EntityCodeSpec {
  return ENTITY_CODES[type];
}

/** Serial width from a pattern's zero digits, e.g. `"WV-000"` → 3. */
function serialWidth(pattern: string): number {
  const match = pattern.match(/0+$/);
  return match ? match[0].length : 3;
}

/** `2627` for 1 Apr 2026 – 31 Mar 2027. */
export function financialYearCode(date: Date = new Date()): string {
  const year = date.getMonth() >= 3 /* April */ ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(year).slice(2)}${String(year + 1).slice(2)}`;
}

export interface NextCodeOpts {
  /** Defaults to the current financial year. Ignored for non-year-scoped types. */
  fy?: string;
  lastSerial: number;
}

/** `nextCode('invoice', { fy: '2627', lastSerial: 141 })` → `'INV-2627-0142'` */
export function nextCode(type: EntityCodeType, opts: NextCodeOpts): string {
  const spec = getEntitySpec(type);
  const width = serialWidth(spec.pattern);
  const serial = String(opts.lastSerial + 1).padStart(width, "0");
  if (spec.yearScoped) {
    return `${spec.prefix}-${opts.fy ?? financialYearCode()}-${serial}`;
  }
  return `${spec.prefix}-${serial}`;
}

export interface ParsedCode {
  type: EntityCodeType;
  fy?: string;
  serial: number;
  valid: boolean;
}

/** `parseCode('INV-2627-0142')` → `{ type:'invoice', fy:'2627', serial:142, valid:true }` */
export function parseCode(code: string): ParsedCode | null {
  const parts = code.split("-");
  if (parts.length < 2) return null;

  const prefix = parts[0];
  const entry = (Object.entries(ENTITY_CODES) as [EntityCodeType, EntityCodeSpec][]).find(
    ([, spec]) => spec.prefix === prefix
  );
  if (!entry) return null;
  const [type, spec] = entry;

  if (spec.yearScoped) {
    if (parts.length !== 3) return { type, serial: NaN, valid: false };
    const [, fy, serialStr] = parts;
    const serial = Number(serialStr);
    const valid = /^\d{4}$/.test(fy) && /^\d+$/.test(serialStr) && serialStr.length === serialWidth(spec.pattern);
    return { type, fy, serial, valid };
  }

  if (parts.length !== 2) return { type, serial: NaN, valid: false };
  const [, serialStr] = parts;
  const serial = Number(serialStr);
  const valid = /^\d+$/.test(serialStr) && serialStr.length === serialWidth(spec.pattern);
  return { type, serial, valid };
}

/** `isValidCode('INV-999')` → `false` — missing the FY segment. */
export function isValidCode(code: string): boolean {
  return parseCode(code)?.valid ?? false;
}
