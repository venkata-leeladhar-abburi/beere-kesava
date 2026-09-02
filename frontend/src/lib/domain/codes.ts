/**
 * The entity code registry — design-system/06-DOMAIN.md Part C.
 * ═══════════════════════════════════════════════════════════════════════════
 * The audit found 25 code prefixes with inconsistent shapes and
 * weaver-first-name-based codes (`RAVI-`, `PADMA-`) that collide the moment a
 * second Ravi is onboarded. One registry defines every code's shape;
 * `<EntityCode>` (shared/ui/domain) is the only place that renders one.
 *
 * This registry DESCRIBES what the backend mints — it does not prescribe.
 * Codes are generated server-side only (IdGeneratorService, "IDs must never
 * be invented client-side"), so nothing here builds a code; the parsers exist
 * to validate and split a code the API already returned.
 *
 * Three real shapes come out of IdGeneratorService:
 *
 *   named     `<Segment>-NNN`            `SreeDurga-001`   nextNamed()
 *   prefixed  `<PREFIX>-NNN`             `BATCH-001`       nextFormatted()
 *   scoped    `<PREFIX>-<Parent>-NNN`    `INV-Kamala-002-014`, `DC-2627-001`
 *                                                          nextScoped()
 *
 * plus `freeform` for the two ids that aren't counter-generated at all.
 *
 * The `named` segment is derived from the record's own name — businessSegment
 * ("Sree Durga" → `SreeDurga`) for firms, nameSegment ("padma veni" → `Padma`)
 * for people — while the counter behind it is shared across the whole entity
 * type, so the next supplier of any name gets `-002`.
 *
 * `counterKey` is the backend's IdCounter row, recorded so a code can be
 * traced back to the service that mints it. It is NOT part of the rendered
 * code for `named` types: the supplier counter is keyed "SUPPLIER" but no
 * supplier code ever contains that word.
 *
 * Every prefix the backend mints is registered here, including those nothing
 * renders through `<EntityCode>` yet — an unregistered prefix is how the last
 * round of drift started. When a service adds one, add it here too.
 */
import type { LucideIcon } from "@/shared/ui/primitives/icons";
import { Icons } from "@/shared/ui/primitives/icons";

/** Backend pads every generated serial to this width; counters past 999 simply grow. */
export const SERIAL_PAD = 3;

export type CodeShape = "named" | "prefixed" | "scoped" | "freeform";

export interface EntityCodeSpec {
  shape: CodeShape;
  /**
   * `prefixed`/`scoped` only — the literal leading segment. An array where one
   * entity type mints several (employee codes vary by role).
   */
  prefix?: string | string[];
  /** The IdCounter row(s) behind this type, for traceability. Not rendered. */
  counterKey?: string | string[];
  /**
   * `scoped` only — this type scopes on the financial year (`DC-2627-001`)
   * rather than on a parent record's code. True for the challan and the shop
   * goods receipt that acknowledges it.
   */
  parentIsFinancialYear?: boolean;
  /**
   * `scoped` only — this type has EXISTING ids whose parent is a raw UUID.
   * True for supplier returns alone. The service no longer mints these
   * (SupplierReturnsService now falls back to the name segment like every
   * other scoping service), but the ids it already minted are primary keys
   * and were not rewritten, so the parser still has to accept them.
   */
  parentMayBeUuid?: boolean;
  /** A real code of this shape, for docs and tests. */
  example: string;
  label: string;
  icon: LucideIcon;
  route?: string;
}

export const ENTITY_CODES = {
  // ── Entities ──────────────────────────────────────────────────────────────
  // `nextNamed(counter, segment)` — the visible prefix is the record's own
  // name, so two suppliers never share a segment+serial.
  weaver: {
    shape: "named", counterKey: "WEAVER", example: "Padma-001",
    label: "Weaver", icon: Icons.weaver, route: "/weavers/:code",
  },
  supplier: {
    shape: "named", counterKey: "SUPPLIER", example: "SreeDurga-001",
    label: "Supplier", icon: Icons.supplier,
  },
  vendor: {
    shape: "named", counterKey: "VENDOR", example: "ShivaTraders-001",
    label: "Vendor", icon: Icons.vendor,
  },
  // Retail customers carry a first name ("CUST" counter), wholesale customers
  // the whole business name ("WHL") — one type, two counters.
  customer: {
    shape: "named", counterKey: ["CUST", "WHL"], example: "Kamala-002",
    label: "Customer", icon: Icons.customer,
  },
  // Segment is the literal word "Loom", so these read `Loom-001`.
  loom: {
    shape: "named", counterKey: "LOOM", example: "Loom-001",
    label: "Loom", icon: Icons.loom,
  },

  // `nextFormatted(prefix)` — fixed prefix, global counter.
  batch: {
    shape: "prefixed", prefix: "BATCH", counterKey: "BATCH", example: "BATCH-086",
    label: "Batch", icon: Icons.batch, route: "/batches/:code",
  },
  // Gap-filling (sequence-id.util), not an IdCounter row: deleting a user frees
  // their number. Prefix follows the role — weaver-role users reuse their
  // weaver code instead, which is `named`.
  employee: {
    shape: "prefixed", prefix: ["SUPER", "ADMIN", "STAFF", "SHOP", "ACCT", "FIN"],
    example: "ACCT-003", label: "Employee", icon: Icons.employee,
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  // `nextScoped(prefix, parentCode)` — the parent's own code is embedded, and
  // the counter is per-parent, so each customer's invoices start at -001.
  invoice: {
    shape: "scoped", prefix: "INV", counterKey: "INV", example: "INV-Kamala-002-014",
    label: "Invoice", icon: Icons.invoice,
  },
  quotation: {
    shape: "scoped", prefix: "QUO", counterKey: "QUO", example: "QUO-Kamala-002-003",
    label: "Quotation", icon: Icons.quotation,
  },
  purchaseOrder: {
    shape: "scoped", prefix: "PO", counterKey: "PO", example: "PO-ShivaTraders-001-007",
    label: "Purchase Order", icon: Icons.purchaseOrder,
  },
  goodsReceipt: {
    shape: "scoped", prefix: "GRN", counterKey: "GRN", example: "GRN-ShivaTraders-001-007",
    label: "Goods Receipt", icon: Icons.goodsReceipt,
  },
  // The two types whose scope parent is the financial year rather than a
  // record: `nextScoped("DC", financialYearCode())` and its counterpart at the
  // receiving end. A challan leaves the factory; a shop receipt acknowledges
  // it at the counter.
  challan: {
    shape: "scoped", prefix: "DC", counterKey: "DC", parentIsFinancialYear: true,
    example: "DC-2627-042",
    label: "Delivery Challan", icon: Icons.challan,
  },
  // Deliberately NOT the GRN prefix above: that one is the vendor goods
  // receipt raised against a purchase order and is scoped to the vendor, so
  // one prefix would carry two incompatible shapes.
  shopReceipt: {
    shape: "scoped", prefix: "SGR", counterKey: "SGR", parentIsFinancialYear: true,
    example: "SGR-2627-014",
    label: "Shop Goods Receipt", icon: Icons.goodsReceipt,
  },
  order: {
    shape: "scoped", prefix: "ORD", counterKey: "ORD", example: "ORD-Kamala-002-005",
    label: "Order", icon: Icons.order,
  },
  // Generic payment references are `nextFormatted("REFERENCE")`. Supplier and
  // vendor payments use scoped SP-/VP- ids and are not this type.
  payment: {
    shape: "prefixed", prefix: "REFERENCE", counterKey: "REFERENCE",
    example: "REFERENCE-118", label: "Payment", icon: Icons.payment,
  },

  // Payments against a specific party are scoped on that party's code; only
  // the generic `payment` reference above is a flat counter.
  supplierPayment: {
    shape: "scoped", prefix: "SP", counterKey: "SP", example: "SP-SreeDurga-001-004",
    label: "Supplier Payment", icon: Icons.supplierPayment,
  },
  vendorPayment: {
    shape: "scoped", prefix: "VP", counterKey: "VP", example: "VP-ShivaTraders-001-002",
    label: "Vendor Payment", icon: Icons.vendorPayment,
  },
  // An unregistered ("Other, enter manually") supplier still gets its own
  // sequence, keyed off its free-text name rather than a real supplier code.
  purchase: {
    shape: "scoped", prefix: "EXT", counterKey: "EXT", example: "EXT-SreeDurga-001-009",
    label: "External Purchase", icon: Icons.purchase,
  },
  // Mints `RR-<SupplierCode>-NNN` like every other scoped type. Rows created
  // before the fallback was fixed carry a UUID parent instead — see
  // `parentMayBeUuid`.
  supplierReturn: {
    shape: "scoped", prefix: "RR", counterKey: "RR", parentMayBeUuid: true,
    example: "RR-SreeDurga-001-002", label: "Supplier Return", icon: Icons.supplierReturn,
  },
  // Material movements scope on whoever holds the material — a weaver or a
  // factory loom — so both `MIR-Padma-001-003` and `MIR-Loom-001-003` are real.
  materialIssue: {
    shape: "scoped", prefix: "MIR", counterKey: "MIR", example: "MIR-Padma-001-003",
    label: "Material Issue", icon: Icons.materialIssue,
  },
  materialReturn: {
    shape: "scoped", prefix: "MRR", counterKey: "MRR", example: "MRR-Loom-001-003",
    label: "Material Return", icon: Icons.materialReturn,
  },
  warpRequest: {
    shape: "scoped", prefix: "WR", counterKey: "WR", example: "WR-Padma-001-006",
    label: "Warp Request", icon: Icons.warpRequest,
  },
  // Scoped on the requesting user's empId, so the parent is an employee code.
  rateRequest: {
    shape: "scoped", prefix: "RCR", counterKey: "RCR", example: "RCR-ACCT-003-002",
    label: "Rate Change Request", icon: Icons.rateRequest,
  },
  designDispatch: {
    shape: "scoped", prefix: "DISP", counterKey: "DISP", example: "DISP-Padma-001-004",
    label: "Design Dispatch", icon: Icons.designDispatch,
  },
  // One type, two prefixes: the sales channel picks which, and with it whether
  // the customer segment reads as a business or a first name.
  sale: {
    shape: "scoped", prefix: ["RETAIL", "WHOLESALE"], counterKey: ["RETAIL", "WHOLESALE"],
    example: "RETAIL-Kamala-002-011", label: "Sale", icon: Icons.sale,
  },
  // Named, not scoped — the RET counter is global, so a sale return's code is
  // shaped exactly like a supplier's. Nothing but context tells them apart,
  // which is why `parseAnyCode` refuses to guess at named codes.
  saleReturn: {
    shape: "named", counterKey: "RET", example: "SreeDurga-004",
    label: "Sale Return", icon: Icons.saleReturn,
  },
  firm: {
    shape: "prefixed", prefix: "FIRM", counterKey: "FIRM", example: "FIRM-002",
    label: "Firm", icon: Icons.firm,
  },

  // ── Not counter-generated ─────────────────────────────────────────────────
  // Composite, built in BatchesService from the weaver or loom, batch sequence
  // and row serial: `PADMA-L3-B12-007` or `Loom-001-B12-007`. No single serial
  // to parse, so it is only ever validated as non-empty.
  saree: {
    shape: "freeform", example: "PADMA-L3-B12-007",
    label: "Saree", icon: Icons.saree, route: "/inventory/:code",
  },
  // DesignLibrary.code is the primary key and is typed in by the operator.
  design: {
    shape: "freeform", example: "DS-FLORAL-01",
    label: "Design", icon: Icons.design,
  },
} as const satisfies Record<string, EntityCodeSpec>;

export type EntityCodeType = keyof typeof ENTITY_CODES;

/** `ENTITY_CODES[type]` alone narrows to the specific literal shape for that
 *  key (missing `route`/`prefix` entirely on entities that don't set them),
 *  so TS refuses property access across the union. This widens to the full
 *  `EntityCodeSpec` shape, where those fields are simply optional. */
export function getEntitySpec(type: EntityCodeType): EntityCodeSpec {
  return ENTITY_CODES[type];
}

function prefixesOf(spec: EntityCodeSpec): string[] {
  if (!spec.prefix) return [];
  return Array.isArray(spec.prefix) ? spec.prefix : [spec.prefix];
}

/** `2627` for 1 Apr 2026 – 31 Mar 2027 — mirrors the backend's own helper.
 *  Only `challan` embeds it, but the dispatch UI labels by year too. */
export function financialYearCode(date: Date = new Date()): string {
  const year = date.getMonth() >= 3 /* April */ ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(year).slice(2)}${String(year + 1).slice(2)}`;
}

export interface ParsedCode {
  type: EntityCodeType;
  /** `named`: the name segment (`SreeDurga`). `scoped`: the parent code
   *  (`Kamala-002`, or the financial year for challans). Absent otherwise. */
  segment?: string;
  /** The trailing counter value. `NaN` for `freeform` types, which have none. */
  serial: number;
  valid: boolean;
}

/** A name segment is letters and digits only — cleanWord strips everything else. */
const SEGMENT = "[A-Za-z0-9]+";
const SERIAL = `\\d{${SERIAL_PAD},}`;

/**
 * A scope parent is normally the parent record's own code (`Kamala-002`), but
 * every scoping service falls back to a bare segment (`Kamala`) when that
 * record predates codes — `nextScoped("INV", customer.code ?? businessSegment(...))`.
 * Both are accepted; the leading letter is what keeps a financial year from
 * passing as a parent here, so `INV-2627-0142` stays invalid.
 */
const PARENT = new RegExp(`^(?=[A-Za-z0-9]*[A-Za-z])${SEGMENT}(-${SERIAL})?$`);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates and splits a code of a KNOWN type. The type must be passed in:
 * `named` codes lead with the record's own name, so nothing about
 * `SreeDurga-001` identifies it as a supplier rather than a vendor.
 *
 * `parseCode('invoice', 'INV-Kamala-002-014')`
 *   → `{ type:'invoice', segment:'Kamala-002', serial:14, valid:true }`
 */
export function parseCode(type: EntityCodeType, code: string): ParsedCode {
  const spec = getEntitySpec(type);
  const value = code.trim();

  if (spec.shape === "freeform") {
    return { type, serial: NaN, valid: value.length > 0 };
  }

  if (spec.shape === "named") {
    const m = new RegExp(`^(${SEGMENT})-(${SERIAL})$`).exec(value);
    return m
      ? { type, segment: m[1], serial: Number(m[2]), valid: true }
      : { type, serial: NaN, valid: false };
  }

  const prefix = prefixesOf(spec).find(p => value.startsWith(`${p}-`));
  if (!prefix) return { type, serial: NaN, valid: false };
  const rest = value.slice(prefix.length + 1);

  if (spec.shape === "prefixed") {
    const m = new RegExp(`^(${SERIAL})$`).exec(rest);
    return m ? { type, serial: Number(m[1]), valid: true } : { type, serial: NaN, valid: false };
  }

  // scoped — match the trailing serial and treat everything before it as the
  // parent, which is another entity's code (`Kamala-002`) unless this type
  // scopes on the financial year instead.
  const m = new RegExp(`^(.+)-(${SERIAL})$`).exec(rest);
  if (!m) return { type, serial: NaN, valid: false };
  const parent = m[1];
  if (spec.parentIsFinancialYear) {
    return { type, segment: parent, serial: Number(m[2]), valid: /^\d{4}$/.test(parent) };
  }
  const parentOk =
    PARENT.test(parent) || (spec.parentMayBeUuid === true && UUID.test(parent));
  return { type, segment: parent, serial: Number(m[2]), valid: parentOk };
}

/**
 * Identifies a code by its leading prefix, for the `prefixed` and `scoped`
 * types only. Returns null for anything unrecognised — including every valid
 * `named` and `freeform` code, which carry no identifying prefix. Use
 * `parseCode` when the type is already known.
 */
export function parseAnyCode(code: string): ParsedCode | null {
  const value = code.trim();
  const matches = (Object.keys(ENTITY_CODES) as EntityCodeType[])
    .filter(type => {
      const spec = getEntitySpec(type);
      return spec.shape !== "named" && spec.shape !== "freeform"
        && prefixesOf(spec).some(p => value.startsWith(`${p}-`));
    })
    // Longest prefix first so `PO-` never shadows a longer prefix starting the same way.
    .sort((a, b) => Math.max(...prefixesOf(getEntitySpec(b)).map(p => p.length))
                  - Math.max(...prefixesOf(getEntitySpec(a)).map(p => p.length)));

  for (const type of matches) {
    const parsed = parseCode(type, value);
    if (parsed.valid) return parsed;
  }
  return matches.length ? parseCode(matches[0], value) : null;
}

/** `isValidCode('supplier', 'SUP-7141A9E5')` → `false` — supplier codes are
 *  `<BusinessName>-NNN`, not a prefix over a UUID slice. */
export function isValidCode(type: EntityCodeType, code: string): boolean {
  return parseCode(type, code).valid;
}
