import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type StockSource = "factory" | "outsourced" | "external";
export type StockStatus = "available" | "sold" | "wholesale";

/** The SHOP dispatch that physically put a saree on the shop floor. */
export interface ShopDispatchInfo {
  dispatchId: string;
  dispatchDate: string;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  notes: string | null;
  pendingTransport: boolean;
  pendingReceipt: boolean;
}

export interface StockItem {
  sareeId: string;
  source: StockSource;
  status: StockStatus;
  // Weaver / loom
  weaverName: string | null;
  weaverId: string | null;
  /** Human-facing weaver code ("Ramarao-001") — the only weaver id the UI shows. */
  weaverCode: string | null;
  loomNumber: string | null;
  // Design / type
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  // QC timing (ISO string)
  qcDate: string;
  // Sale / dispatch — wired when a SaleRecord row exists (future)
  saleRef: string | null;
  customer: string | null;
}

/**
 * One saree standing on the shop floor. Same fields the admin inventory shows,
 * plus the dispatch that delivered it — the shop portal groups and filters its
 * stock by consignment, so that has to travel with each saree.
 */
export interface ShopStockItem extends StockItem {
  /** Retail price: the per-saree price entered at receipt, else the type rate. */
  retailPrice: number | null;
  /** What it actually sold for, and when — null until it is sold. Kept
   *  alongside retailPrice so the shop can see the two side by side and tell
   *  at a glance where a discount was given at the counter. */
  soldPrice: number | null;
  soldDate: string | null;
  dispatch: ShopDispatchInfo;
  /** How this saree came to be standing in the shop. */
  stockOrigin: "dispatch" | "retail-return" | "wholesale-return";
  /** Set when stockOrigin is a return — the return it came back on. */
  returnRef: string | null;
  returnReason: string | null;
  returnDate: string | null;
  /** Vendor (wholesale return) or customer (retail return) it came back from. */
  returnedFrom: string | null;
  photoUrl: string | null;
  color: string | null;
  weightG: number | null;
}

/** The stand-in consignment used for pieces that entered as a return rather
 *  than on a lorry — returns have no LR, but the shop still groups by
 *  consignment, so they get one of their own. */
function returnConsignment(returnDate: string): ShopDispatchInfo {
  return {
    dispatchId: "RETURNED-STOCK",
    dispatchDate: returnDate,
    lrNumber: null,
    transportCompany: null,
    vehicleNumber: null,
    driverName: null,
    notes: "Entered stock as a return",
    pendingTransport: false,
    pendingReceipt: false,
  };
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns every QC-passed saree that hasn't left the shop yet — i.e.
   * `qcPassed: true` (a clean PASSED verdict — see QcService, SEMI/DEFECTIVE
   * never set this), minus anything already dispatched or already sold.
   * Deliberately NOT gated on finishing/InventoryRecord status — a saree is
   * "in stock" as soon as QC passes, whether or not it's separately gone
   * through the finishing department.
   *   - DispatchSaree row exists → already sent out (excluded)
   *   - SaleRecord row exists → already sold (excluded, see SalesService.createSale)
   *   - InventoryRecord.status === DAMAGED_REVIEW_NEEDED → not sellable (excluded)
   *
   * Scope — woven sarees only (outsourced/factory). External-purchase sarees
   * (Purchase records) are not yet joined here; they'll be added once the
   * purchase → inventory flow is fully persisted.
   *
   * Fields deliberately omitted (not in DB yet):
   *   - weight (no weightG column on BatchSareeRow yet — show "—" on frontend)
   *   - assignedBy / assignedAt (no actor-tracking on InventoryRecord yet)
   */
  async findAll(): Promise<StockItem[]> {
    const rows = await this.prisma.batchSareeRow.findMany({
      where: { qcPassed: true, sareeId: { not: null } },
      include: {
        weaver: true,
        factoryLoom: true,
        sareeType: true,
        design: true,
        // select, not include: some legacy QcRecord.photoUrl values are still
        // inline base64 data URLs (pre-disk-storage rows) rather than upload
        // paths — pulling the whole row here drags multi-MB blobs through
        // Supabase's pooler and can time the query out. Only loomNumber/qcDate
        // are ever read below.
        qcRecords: { orderBy: { qcDate: "desc" }, take: 1, select: { qcDate: true, loomNumber: true } },
      },
    });
    if (rows.length === 0) {
      return [];
    }
    const sareeIds = rows.map((r) => r.sareeId!);

    const [dispatched, sold, inventoryRecords] = await Promise.all([
      this.prisma.dispatchSaree.findMany({
        where: { sareeId: { in: sareeIds } },
        select: { sareeId: true },
      }),
      this.prisma.saleRecord.findMany({
        where: { sareeId: { in: sareeIds } },
        select: { sareeId: true },
      }),
      this.prisma.inventoryRecord.findMany({
        where: { sareeId: { in: sareeIds }, status: "DAMAGED_REVIEW_NEEDED" },
        select: { sareeId: true },
      }),
    ]);
    const excluded = new Set([
      ...dispatched.map((d) => d.sareeId),
      ...sold.map((s) => s.sareeId),
      ...inventoryRecords.map((i) => i.sareeId),
    ]);

    return rows
      .filter((row) => !excluded.has(row.sareeId!))
      .map((row): StockItem => {
        const isFactory =
          row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;
        const source: StockSource = isFactory ? "factory" : "outsourced";
        const latestQc = row.qcRecords[0];
        // The human-facing loom code ("Loom-002") when this saree came off a
        // factory loom — loomNumber is the legacy machine label and is only a
        // fallback, matching loomLabel() on the frontend.
        const loomNumber = row.factoryLoom?.code ?? row.factoryLoom?.loomNumber ?? latestQc?.loomNumber ?? null;

        return {
          sareeId: row.sareeId!,
          source,
          status: "available",
          weaverName: row.weaver
            ? `${row.weaver.firstName} ${row.weaver.lastName}`.trim()
            : null,
          weaverId: row.weaverId ?? null,
          weaverCode: row.weaver?.code ?? null,
          loomNumber,
          designCode: row.designCode ?? null,
          sareeTypeCode: row.sareeTypeCode ?? null,
          sareeTypeLabel: row.sareeType
            ? `${row.sareeTypeCode} · ${row.sareeType.type}`
            : row.sareeTypeCode ?? null,
          qcDate: (latestQc?.qcDate ?? row.createdAt).toISOString(),
          saleRef: null,
          customer: null,
        };
      })
      .sort((a, b) => new Date(b.qcDate).getTime() - new Date(a.qcDate).getTime());
  }

  /**
   * Stock standing in the shop: every saree delivered by a SHOP dispatch that
   * has not since been sold. This is deliberately the mirror image of
   * `findAll()` — that one lists what is still in the factory and drops a saree
   * the moment it is dispatched, which is exactly the moment it becomes the
   * shop's to sell. The shop portal's Inventory tab and the New Sale picker
   * both read this, so the counter can only ever sell what was actually sent
   * to it.
   *
   * A WHOLESALE dispatch is not shop stock — those goods left the business.
   */
  /**
   * @param dispatchId Narrows the query to one SHOP dispatch. The challan
   *   screen only ever needs the pieces on a single lorry, and asking for the
   *   whole shop's stock to filter it down client-side meant the printed
   *   document depended on a read that grows forever.
   */
  async findShopStock(dispatchId?: string): Promise<ShopStockItem[]> {
    // Returns are read first: they decide whether a dispatched saree that was
    // sold is back on the shelf, and they carry the pieces that entered stock
    // as a wholesale return without ever being on a lorry.
    const [consignments, returns] = await Promise.all([
      this.prisma.dispatchSaree.findMany({
        where: { dispatch: { type: "SHOP", ...(dispatchId ? { id: dispatchId } : {}) } },
        include: { dispatch: true },
        orderBy: { dispatch: { dispatchDate: "desc" } },
      }),
      // Only the newest return per saree is ever consulted — `latestReturn`
      // below used to build exactly this by reading every return ever written
      // and keeping the first of each. `distinct` states that directly, so the
      // read is one row per saree instead of one per return. Filtering to
      // `restocked: true` here would be wrong: a piece that was restocked and
      // has since come back again must not read as on-the-shelf.
      this.prisma.returnRecord.findMany({
        orderBy: { createdAt: "desc" },
        distinct: ["sareeId"],
        include: { saree: { include: { sareeType: true } } },
      }),
    ]);

    // Latest return per saree — an earlier one being restocked says nothing
    // about a piece that has since come back again.
    const latestReturn = new Map<string, (typeof returns)[number]>();
    for (const r of returns) {
      if (!latestReturn.has(r.sareeId)) latestReturn.set(r.sareeId, r);
    }

    // ── Dispatched stock ────────────────────────────────────────────────
    // A saree can appear on more than one SHOP dispatch if an earlier one was
    // corrected and re-sent — the most recent delivery is the one that counts.
    const latestBySaree = new Map<string, (typeof consignments)[number]>();
    for (const c of consignments) {
      if (!latestBySaree.has(c.sareeId)) {
        latestBySaree.set(c.sareeId, c);
      }
    }
    const dispatchedIds = [...latestBySaree.keys()];

    const [rows, sold] = await Promise.all([
      dispatchedIds.length
        ? this.prisma.batchSareeRow.findMany({
            where: { sareeId: { in: dispatchedIds } },
            include: {
              weaver: true,
              factoryLoom: true,
              sareeType: true,
              design: true,
              // See findAll() above: select only, never include — QcRecord.photoUrl
              // can still be inline base64 on legacy rows.
              qcRecords: { orderBy: { qcDate: "desc" }, take: 1, select: { qcDate: true, loomNumber: true } },
            },
          })
        : Promise.resolve([]),
      dispatchedIds.length
        ? this.prisma.saleRecord.findMany({
            where: { sareeId: { in: dispatchedIds } },
            orderBy: { date: "desc" },
            select: {
              sareeId: true,
              saleRef: true,
              date: true,
              amount: true,
              customer: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
    ]);
    // Newest sale per saree — a piece that was sold, returned, restocked and
    // sold again has two, and only the latest one says where it is now.
    const soldBySaree = new Map<string, (typeof sold)[number]>();
    for (const sale of sold) {
      if (!soldBySaree.has(sale.sareeId)) soldBySaree.set(sale.sareeId, sale);
    }
    const rowBySaree = new Map(rows.map((r) => [r.sareeId!, r]));

    const dispatchedStock = dispatchedIds
      // A saree dispatched to the shop but with no woven row behind it has
      // nothing to display; skip rather than emit a card full of dashes.
      .filter((id) => rowBySaree.has(id))
      .map((sareeId): ShopStockItem => {
        const row = rowBySaree.get(sareeId)!;
        const consignment = latestBySaree.get(sareeId)!;
        const dispatch = consignment.dispatch;
        const sale = soldBySaree.get(sareeId);
        const ret = latestReturn.get(sareeId) ?? null;
        const latestQc = row.qcRecords[0];
        const isFactory =
          row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;

        // Sold, then returned and sent back into stock → on the shelf again.
        // Sold and returned but still held for inspection stays out of the
        // available count, and so does a piece that was simply sold. The dates
        // decide: a piece sold *after* its last return is sold, not back.
        const backOnShelf =
          ret?.restocked === true && (!sale || ret.createdAt > sale.date);

        return {
          sareeId,
          source: isFactory ? "factory" : "outsourced",
          status: sale && !backOnShelf ? "sold" : "available",
          weaverName: row.weaver
            ? `${row.weaver.firstName} ${row.weaver.lastName}`.trim()
            : null,
          weaverId: row.weaverId ?? null,
          weaverCode: row.weaver?.code ?? null,
          loomNumber: row.factoryLoom?.code ?? row.factoryLoom?.loomNumber ?? latestQc?.loomNumber ?? null,
          designCode: row.designCode ?? null,
          sareeTypeCode: row.sareeTypeCode ?? null,
          sareeTypeLabel: row.sareeType
            ? `${row.sareeTypeCode} · ${row.sareeType.type}`
            : row.sareeTypeCode ?? null,
          qcDate: (latestQc?.qcDate ?? row.createdAt).toISOString(),
          saleRef: sale?.saleRef ?? null,
          customer: sale?.customer?.name ?? null,
          soldPrice: sale?.amount != null ? Number(sale.amount) : null,
          soldDate: sale?.date.toISOString() ?? null,
          retailPrice: row.receivedSellingPrice
            ? Number(row.receivedSellingPrice)
            : row.sareeType
              ? Number(row.sareeType.retailPrice)
              : null,
          dispatch: {
            dispatchId: dispatch.id,
            dispatchDate: dispatch.dispatchDate.toISOString(),
            lrNumber: dispatch.lrNumber,
            transportCompany: dispatch.transportCompany,
            vehicleNumber: dispatch.vehicleNumber,
            driverName: dispatch.driverName,
            notes: dispatch.notes,
            pendingTransport: dispatch.pendingTransport,
            pendingReceipt: dispatch.pendingReceipt,
          },
          stockOrigin: backOnShelf ? "retail-return" : "dispatch",
          returnRef: backOnShelf ? ret.returnRef : null,
          returnReason: backOnShelf ? ret.reason : null,
          returnDate: backOnShelf ? ret.createdAt.toISOString() : null,
          returnedFrom: backOnShelf ? sale?.customer?.name ?? null : null,
          photoUrl: backOnShelf ? ret.photoUrl : null,
          color: null,
          weightG: null,
        };
      });

    // ── Wholesale returns that were sent into stock ─────────────────────
    // Two kinds land here, and neither is visible to the branch above:
    //   - a hand-registered piece that was never woven here and never
    //     dispatched (it exists only as a Saree row plus its return), and
    //   - one of our own sarees that went out on a WHOLESALE dispatch and came
    //     back. That one has no SHOP dispatch, so `latestBySaree` never had it.
    // The `!latestBySaree.has()` guard is what keeps the two branches from
    // both emitting the same saree.
    // Scoped to one dispatch, the caller wants that lorry's pieces — a
    // wholesale return that was never on it does not belong in the answer.
    const returnedStock = (dispatchId ? [] : returns)
      .filter((r) => r.restocked && !latestBySaree.has(r.sareeId))
      // The latest return is the live one — an older restocked return on the
      // same piece must not emit a duplicate row.
      .filter((r) => latestReturn.get(r.sareeId)?.returnRef === r.returnRef)
      .map((r): ShopStockItem => {
        const saree = r.saree;
        return {
          sareeId: r.sareeId,
          source: saree.origin === "EXTERNAL" ? "external" : "outsourced",
          status: saree.status === "UNSOLD" ? "available" : "sold",
          weaverName: null,
          weaverId: null,
          weaverCode: null,
          loomNumber: null,
          designCode: saree.designCode,
          sareeTypeCode: saree.sareeTypeCode,
          sareeTypeLabel: saree.sareeType
            ? `${saree.sareeTypeCode} · ${saree.sareeType.type}`
            : saree.sareeTypeCode,
          qcDate: r.createdAt.toISOString(),
          saleRef: null,
          customer: null,
          // A restocked wholesale return has been put back on the shelf but not
          // sold again, so there is no sale price to show yet.
          soldPrice: null,
          soldDate: null,
          retailPrice: saree.sareeType ? Number(saree.sareeType.retailPrice) : null,
          dispatch: returnConsignment(r.createdAt.toISOString()),
          stockOrigin: "wholesale-return",
          returnRef: r.returnRef,
          returnReason: r.reason,
          returnDate: r.createdAt.toISOString(),
          returnedFrom: saree.sourceName,
          photoUrl: r.photoUrl,
          color: saree.color,
          weightG: saree.weightG != null ? Number(saree.weightG) : null,
        };
      });

    return [...dispatchedStock, ...returnedStock];
  }
}
