import { Injectable } from "@nestjs/common";
import { Prisma, SalesChannel } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StaffLedgerQueryDto } from "./dto/staff-ledger-query.dto";

/**
 * The four money movements an accountant can be individually credited with.
 * Weaver/vendor/supplier payments leave the business; a retail counter sale
 * brings money in. Wholesale collections (InvoicePayment) are deliberately
 * excluded — they are Shop Staff's channel, not the accountant's.
 */
export type StaffLedgerKind = "WEAVER" | "VENDOR" | "SUPPLIER" | "RETAIL_SALE";

export interface StaffActorSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

/** One money movement, normalised across the four source tables. */
export interface StaffLedgerRow {
  /** Source-table primary key — unique within a kind, so the row id is prefixed. */
  id: string;
  kind: StaffLedgerKind;
  /** OUT = paid out by the business, IN = collected by the business. */
  direction: "OUT" | "IN";
  date: string;
  /** Rupees. Prisma Decimal is narrowed here so the client never parses money. */
  amount: number;
  /** Weaver / vendor / supplier / customer this moved to or from. */
  partyName: string | null;
  partyCode: string | null;
  /** UTR for a payment, UPI/card reference for a counter sale. */
  reference: string | null;
  /**
   * Only where the source table actually stores one. WeaverPayment has no
   * method column, so a weaver payment reports null rather than a guess
   * inferred from the presence of a UTR.
   */
  method: string | null;
  firmName: string | null;
  /** Null for rows recorded before per-user attribution existed. */
  recordedById: string | null;
  recordedBy: StaffActorSummary | null;
}

export interface StaffLedgerResult {
  items: StaffLedgerRow[];
  /** True when `limit` clipped the row list. Totals are unaffected — they
   *  come from staff-summary, which aggregates in the database. */
  truncated: boolean;
}

export interface KindTotal {
  amount: number;
  count: number;
}

/** Exact totals for one recorder over the requested period. */
export interface StaffFinanceTotals {
  /** Null identifies the unattributed bucket. */
  recordedById: string | null;
  paidOut: number;
  collectedIn: number;
  txns: number;
  avgTxn: number;
  lastActivity: string | null;
  byKind: Record<StaffLedgerKind, KindTotal>;
}

export interface StaffFinanceSummaryResult {
  items: StaffFinanceTotals[];
}

const actorSelect = { select: { id: true, firstName: true, lastName: true, role: true } } as const;

/** "unattributed" selects the rows with no recorded actor at all. */
const UNATTRIBUTED = "unattributed";

function toNumber(value: Prisma.Decimal | null): number {
  return value == null ? 0 : Number(value);
}

function emptyByKind(): Record<StaffLedgerKind, KindTotal> {
  return {
    WEAVER: { amount: 0, count: 0 },
    VENDOR: { amount: 0, count: 0 },
    SUPPLIER: { amount: 0, count: 0 },
    RETAIL_SALE: { amount: 0, count: 0 },
  };
}

@Injectable()
export class StaffFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * An explicit `null` actor filter (the unattributed bucket) means something
   * different from no actor filter at all, so it is resolved separately
   * rather than spread into a where clause.
   */
  private resolveActor(recordedById?: string): string | null | undefined {
    if (recordedById === undefined) return undefined;
    return recordedById === UNATTRIBUTED ? null : recordedById;
  }

  private dateRange(query: StaffLedgerQueryDto): { gte?: Date; lte?: Date } | undefined {
    const { from, to } = query;
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  /**
   * The four where clauses, each built against its own Prisma type.
   *
   * Assembled by assignment rather than object spread, and deliberately not
   * by one generic builder keyed by field name. Both of the shorter forms
   * compile a mistyped column cleanly — `Record<string, unknown>` is
   * assignable to every WhereInput, and spreading skips excess-property
   * checking — leaving the mistake to surface as a Prisma error at runtime.
   * Property assignment is the form the compiler actually checks.
   */
  private buildWheres(query: StaffLedgerQueryDto) {
    const actor = this.resolveActor(query.recordedById);
    const range = this.dateRange(query);

    const weaver: Prisma.WeaverPaymentWhereInput = {};
    const vendor: Prisma.VendorPaymentWhereInput = {};
    const supplier: Prisma.SupplierPaymentWhereInput = {};
    // Retail only — wholesale sales are invoiced and collected separately,
    // and are not the accountant's counter takings.
    const retail: Prisma.SaleRecordWhereInput = { channel: SalesChannel.RETAIL };

    if (actor !== undefined) {
      weaver.recordedById = actor;
      vendor.recordedById = actor;
      supplier.recordedById = actor;
      retail.soldById = actor;
    }
    if (range) {
      weaver.paymentDate = range;
      vendor.date = range;
      supplier.date = range;
      retail.date = range;
    }

    return { weaver, vendor, supplier, retail };
  }

  private wants(query: StaffLedgerQueryDto, kind: StaffLedgerKind): boolean {
    return !query.kind || query.kind === kind;
  }

  /**
   * Exact per-recorder totals for the requested period, aggregated in the
   * database.
   *
   * This is what every headline figure on the two Accountant Staff screens
   * reads from. `getStaffLedger` below returns the individual rows for the
   * table, and is row-capped; keeping the totals here means a cap can shorten
   * a list without ever making a total wrong.
   */
  async getStaffFinanceSummary(query: StaffLedgerQueryDto): Promise<StaffFinanceSummaryResult> {
    const where = this.buildWheres(query);
    const [weaver, vendor, supplier, retail] = await Promise.all([
      this.wants(query, "WEAVER")
        ? this.prisma.weaverPayment.groupBy({
            by: ["recordedById"],
            where: where.weaver,
            _sum: { amountPaid: true },
            _count: { _all: true },
            _max: { paymentDate: true },
          })
        : [],
      this.wants(query, "VENDOR")
        ? this.prisma.vendorPayment.groupBy({
            by: ["recordedById"],
            where: where.vendor,
            _sum: { amount: true },
            _count: { _all: true },
            _max: { date: true },
          })
        : [],
      this.wants(query, "SUPPLIER")
        ? this.prisma.supplierPayment.groupBy({
            by: ["recordedById"],
            where: where.supplier,
            _sum: { amount: true },
            _count: { _all: true },
            _max: { date: true },
          })
        : [],
      this.wants(query, "RETAIL_SALE")
        ? this.prisma.saleRecord.groupBy({
            by: ["soldById"],
            where: where.retail,
            _sum: { amount: true },
            _count: { _all: true },
            _max: { date: true },
          })
        : [],
    ]);

    // Keyed by recorder id, with "" standing in for null so the unattributed
    // bucket survives a Map lookup.
    const totals = new Map<string, StaffFinanceTotals>();

    const add = (
      recordedById: string | null,
      kind: StaffLedgerKind,
      amount: number,
      count: number,
      last: Date | null,
    ) => {
      if (count === 0) return;
      const key = recordedById ?? "";
      let entry = totals.get(key);
      if (!entry) {
        entry = {
          recordedById,
          paidOut: 0,
          collectedIn: 0,
          txns: 0,
          avgTxn: 0,
          lastActivity: null,
          byKind: emptyByKind(),
        };
        totals.set(key, entry);
      }
      entry.byKind[kind] = { amount, count };
      if (kind === "RETAIL_SALE") entry.collectedIn += amount;
      else entry.paidOut += amount;
      entry.txns += count;
      const iso = last ? last.toISOString() : null;
      if (iso && (!entry.lastActivity || iso > entry.lastActivity)) entry.lastActivity = iso;
    };

    for (const g of weaver) {
      add(g.recordedById, "WEAVER", toNumber(g._sum.amountPaid), g._count._all, g._max.paymentDate);
    }
    for (const g of vendor) {
      add(g.recordedById, "VENDOR", toNumber(g._sum.amount), g._count._all, g._max.date);
    }
    for (const g of supplier) {
      add(g.recordedById, "SUPPLIER", toNumber(g._sum.amount), g._count._all, g._max.date);
    }
    for (const g of retail) {
      add(g.soldById, "RETAIL_SALE", toNumber(g._sum.amount), g._count._all, g._max.date);
    }

    for (const entry of totals.values()) {
      entry.avgTxn = entry.txns === 0 ? 0 : (entry.paidOut + entry.collectedIn) / entry.txns;
    }

    return { items: [...totals.values()] };
  }

  /**
   * The individual money movements behind those totals, as one sorted list.
   *
   * Row-capped by `limit`, and the caller is told when the cap bit. The
   * headline figures never read from here, so a clipped list shortens a table
   * without ever understating a total.
   */
  async getStaffLedger(query: StaffLedgerQueryDto): Promise<StaffLedgerResult> {
    const take = query.limit;
    const where = this.buildWheres(query);

    const [weaverPayments, vendorPayments, supplierPayments, retailSales] = await Promise.all([
      this.wants(query, "WEAVER")
        ? this.prisma.weaverPayment.findMany({
            where: where.weaver,
            orderBy: { paymentDate: "desc" },
            take,
            include: {
              weaver: { select: { code: true, name: true } },
              firm: { select: { firmName: true } },
              recordedBy: actorSelect,
            },
          })
        : [],
      this.wants(query, "VENDOR")
        ? this.prisma.vendorPayment.findMany({
            where: where.vendor,
            orderBy: { date: "desc" },
            take,
            include: {
              vendor: { select: { code: true, name: true } },
              firm: { select: { firmName: true } },
              recordedBy: actorSelect,
            },
          })
        : [],
      this.wants(query, "SUPPLIER")
        ? this.prisma.supplierPayment.findMany({
            where: where.supplier,
            orderBy: { date: "desc" },
            take,
            include: {
              supplier: { select: { code: true, name: true } },
              firm: { select: { firmName: true } },
              recordedBy: actorSelect,
            },
          })
        : [],
      this.wants(query, "RETAIL_SALE")
        ? this.prisma.saleRecord.findMany({
            where: where.retail,
            orderBy: { date: "desc" },
            take,
            include: {
              customer: { select: { code: true, name: true } },
              soldBy: actorSelect,
            },
          })
        : [],
    ]);

    const rows: StaffLedgerRow[] = [
      ...weaverPayments.map<StaffLedgerRow>((p) => ({
        id: `weaver:${p.id}`,
        kind: "WEAVER",
        direction: "OUT",
        date: p.paymentDate.toISOString(),
        amount: toNumber(p.amountPaid),
        partyName: p.weaver?.name ?? null,
        partyCode: p.weaver?.code ?? null,
        reference: p.utrNumber,
        // WeaverPayment stores no method — a UTR does not make it safe to
        // print "Bank transfer" as though the table said so.
        method: null,
        firmName: p.firm?.firmName ?? null,
        recordedById: p.recordedById,
        recordedBy: p.recordedBy,
      })),
      ...vendorPayments.map<StaffLedgerRow>((p) => ({
        id: `vendor:${p.id}`,
        kind: "VENDOR",
        direction: "OUT",
        date: p.date.toISOString(),
        amount: toNumber(p.amount),
        partyName: p.vendor?.name ?? null,
        partyCode: p.vendor?.code ?? null,
        reference: p.utr,
        method: p.method,
        firmName: p.firm?.firmName ?? null,
        recordedById: p.recordedById,
        recordedBy: p.recordedBy,
      })),
      ...supplierPayments.map<StaffLedgerRow>((p) => ({
        id: `supplier:${p.id}`,
        kind: "SUPPLIER",
        direction: "OUT",
        date: p.date.toISOString(),
        amount: toNumber(p.amount),
        partyName: p.supplier?.name ?? null,
        partyCode: p.supplier?.code ?? null,
        reference: p.utr,
        method: p.method,
        firmName: p.firm?.firmName ?? null,
        recordedById: p.recordedById,
        recordedBy: p.recordedBy,
      })),
      ...retailSales.map<StaffLedgerRow>((s) => ({
        id: `sale:${s.saleRef}`,
        kind: "RETAIL_SALE",
        direction: "IN",
        date: s.date.toISOString(),
        amount: toNumber(s.amount),
        partyName: s.customer?.name ?? null,
        partyCode: s.customer?.code ?? null,
        reference: s.paymentRef ?? s.saleRef,
        method: s.paymentMethod,
        firmName: null,
        recordedById: s.soldById,
        recordedBy: s.soldBy,
      })),
    ];

    rows.sort((a, b) => b.date.localeCompare(a.date));

    // Any source hitting its own cap means the merged list may be missing
    // older rows from the others, so the whole list is flagged.
    const truncated = [weaverPayments, vendorPayments, supplierPayments, retailSales].some(
      (source) => source.length === take,
    );

    return { items: rows.slice(0, query.limit), truncated };
  }
}
