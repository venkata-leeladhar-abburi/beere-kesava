import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { sellingPerPiece } from "../sales/saree-details";

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

/**
 * One woven saree as the shop's copy of the All Sarees table needs it: the
 * batch-row and latest-QC facts the admin table reads from GET /batches and
 * GET /qc, with every money field (making charge, deduction, weaver payable,
 * rates) left out. Shop staff sell sarees; they have no business seeing what
 * the weaver was paid for one, so it never leaves the server for this role.
 */
export interface ProductionCatalogItem {
  sareeId: string;
  batchId: string;
  batchCreatedAt: string;
  recipientType: "weaver" | "factoryLoom" | null;
  weaverId: string | null;
  weaverName: string | null;
  /** The weaver's own loom digit, recovered from the sareeId (-L{n}-B). */
  weaverLoom: number | null;
  factoryLoomId: string | null;
  factoryLoomLabel: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderRef: string | null;
  color: string | null;
  weightG: number | null;
  /** Receipt photo, else the latest QC photo — server-relative path. */
  photoUrl: string | null;
  qcPassed: boolean | null;
  /** Sold, and not since returned and restocked — the same rule
   *  SalesService.createSale applies. Computed here because the client's own
   *  sales list only covers the latest 100 sales. */
  sold: boolean;
  qc: {
    result: "PASSED" | "SEMI" | "DEFECTIVE";
    qcDate: string;
    receivedDate: string | null;
    defects: string[];
  } | null;
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
    // One database query does everything: the exclusions (dispatched / sold /
    // damaged) as NOT EXISTS on the sareeId indexes, the joins, and the latest
    // QC per saree. Previously this loaded every QC-passed saree with five
    // joins, sent the whole id list back in three IN (...) queries (which also
    // breaks past ~32k ids — PostgreSQL's bind-parameter limit) and filtered in
    // the app. A tagged $queryRaw is fully parameterised — no string building,
    // so no injection risk.
    //
    // Latest QC is selected column-by-column on purpose: some legacy
    // QcRecord.photoUrl values are inline base64 blobs, never pulled here.
    const rows = await this.prisma.$queryRaw<
      {
        sareeId: string;
        recipientType: string | null;
        factoryLoomId: string | null;
        weaverId: string | null;
        designCode: string | null;
        sareeTypeCode: string | null;
        createdAt: Date;
        weaverFirstName: string | null;
        weaverLastName: string | null;
        weaverCode: string | null;
        loomCode: string | null;
        loomLabel: string | null;
        sareeTypeName: string | null;
        qcDate: Date | null;
        qcLoomNumber: string | null;
      }[]
    >`
      SELECT b."sareeId", b."recipientType"::text AS "recipientType", b."factoryLoomId", b."weaverId",
             b."designCode", b."sareeTypeCode", b."createdAt",
             w."firstName" AS "weaverFirstName", w."lastName" AS "weaverLastName", w."code" AS "weaverCode",
             fl."code" AS "loomCode", fl."loomNumber" AS "loomLabel",
             st."type" AS "sareeTypeName",
             q."qcDate", q."loomNumber" AS "qcLoomNumber"
      FROM "BatchSareeRow" b
      LEFT JOIN "Weaver" w ON w."id" = b."weaverId"
      LEFT JOIN "FactoryLoom" fl ON fl."id" = b."factoryLoomId"
      LEFT JOIN "SareeTypeRate" st ON st."code" = b."sareeTypeCode"
      LEFT JOIN LATERAL (
        SELECT "qcDate", "loomNumber" FROM "QcRecord"
        WHERE "sareeId" = b."sareeId" ORDER BY "qcDate" DESC LIMIT 1
      ) q ON true
      WHERE b."qcPassed" = true
        AND b."sareeId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "DispatchSaree" d WHERE d."sareeId" = b."sareeId")
        AND NOT EXISTS (SELECT 1 FROM "SaleRecord" s WHERE s."sareeId" = b."sareeId")
        AND NOT EXISTS (
          SELECT 1 FROM "InventoryRecord" i
          WHERE i."sareeId" = b."sareeId" AND i."status" = 'DAMAGED_REVIEW_NEEDED'
        )`;

    return rows
      .map((row): StockItem => {
        const isFactory = row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;
        const source: StockSource = isFactory ? "factory" : "outsourced";
        // The human-facing loom code ("Loom-002") when this saree came off a
        // factory loom — loomNumber is the legacy machine label and is only a
        // fallback, matching loomLabel() on the frontend.
        const loomNumber = row.loomCode ?? row.loomLabel ?? row.qcLoomNumber ?? null;

        return {
          sareeId: row.sareeId,
          source,
          status: "available",
          weaverName: row.weaverFirstName != null ? `${row.weaverFirstName} ${row.weaverLastName ?? ""}`.trim() : null,
          weaverId: row.weaverId ?? null,
          weaverCode: row.weaverCode ?? null,
          loomNumber,
          designCode: row.designCode ?? null,
          sareeTypeCode: row.sareeTypeCode ?? null,
          sareeTypeLabel: row.sareeTypeName != null ? `${row.sareeTypeCode} · ${row.sareeTypeName}` : row.sareeTypeCode ?? null,
          qcDate: (row.qcDate ?? row.createdAt).toISOString(),
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
        // Only pieces the shop counter has actually receipted (GRN — see
        // ShopReceiptsService). A dispatch that has left the factory but not
        // been received is in transit: it is neither factory stock (it is on a
        // DispatchSaree row, so findAll() excludes it) nor sellable here. A
        // piece receipted MISSING or DAMAGED stays out for the same reason —
        // it is not on the shelf to sell.
        //
        // Scoped to one dispatch (the Delivery Challan), the receipt gate is
        // dropped: the challan is printed when the lorry leaves, before the
        // shop has receipted anything, and it must list every piece that was
        // SENT. Gating it made every line read "Saree · ₹0.00".
        where: {
          ...(dispatchId ? {} : { receiptStatus: "RECEIVED" as const }),
          dispatch: { type: "SHOP", ...(dispatchId ? { id: dispatchId } : {}) },
        },
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

    // A dispatched piece with no BatchSareeRow was never woven here — it is an
    // external purchase (or a hand-registered piece), living in the generic
    // Saree table instead. Previously dropped outright ("nothing to display"),
    // which meant a dispatched-and-received external purchase never appeared
    // in shop stock at all.
    const unwovenIds = dispatchedIds.filter((id) => !rowBySaree.has(id));
    const unwovenSarees = unwovenIds.length
      ? await this.prisma.saree.findMany({
          where: { id: { in: unwovenIds } },
          include: { sareeType: true },
        })
      : [];
    const sareeById = new Map(unwovenSarees.map((s) => [s.id, s]));

    // An external-purchase piece's Saree row is created at dispatch with no
    // sareeTypeCode — its type, colour, weight and selling price live on the
    // PurchaseSareeLine it came from (piece id "{lineCode}-{pieceNo}", see
    // ScanService.lookupExternalPiece). Without this those pieces showed no
    // type and a ₹0 price on the challan and in shop stock.
    const lineCodeOf = (sareeId: string) => sareeId.match(/^(.+)-(\d{2,})$/)?.[1] ?? null;
    const externalLineCodes = [
      ...new Set(
        unwovenSarees
          .filter((s) => !s.sareeType)
          .map((s) => lineCodeOf(s.id))
          .filter((c): c is string => c !== null),
      ),
    ];
    const purchaseLines = externalLineCodes.length
      ? await this.prisma.purchaseSareeLine.findMany({
          where: { code: { in: externalLineCodes } },
          select: { code: true, sareeType: true, color: true, weight: true, price: true, sellPercent: true },
        })
      : [];
    const purchaseLineByCode = new Map(purchaseLines.map((l) => [l.code, l]));

    const dispatchedStock = dispatchedIds
      .filter((id) => rowBySaree.has(id) || sareeById.has(id))
      .map((sareeId): ShopStockItem => {
        const unwoven = rowBySaree.has(sareeId) ? null : sareeById.get(sareeId)!;
        if (unwoven) {
          const consignment = latestBySaree.get(sareeId)!;
          const dispatch = consignment.dispatch;
          const sale = soldBySaree.get(sareeId);
          const ret = latestReturn.get(sareeId) ?? null;
          const backOnShelf = ret?.restocked === true && (!sale || ret.createdAt > sale.date);
          const lineCode = unwoven.sareeType ? null : lineCodeOf(sareeId);
          const line = lineCode ? purchaseLineByCode.get(lineCode) ?? null : null;
          const lineWeightG = line?.weight ? Number(line.weight.replace(/g$/i, "")) || null : null;

          return {
            sareeId,
            source: unwoven.origin === "EXTERNAL" ? "external" : "outsourced",
            status: sale && !backOnShelf ? "sold" : "available",
            weaverName: null,
            weaverId: null,
            weaverCode: null,
            loomNumber: null,
            designCode: unwoven.designCode,
            sareeTypeCode: unwoven.sareeTypeCode,
            sareeTypeLabel: unwoven.sareeType
              ? `${unwoven.sareeTypeCode} · ${unwoven.sareeType.type}`
              : unwoven.sareeTypeCode ?? (line?.sareeType?.trim() || null),
            qcDate: (unwoven.qcDate ?? unwoven.createdAt).toISOString(),
            saleRef: sale?.saleRef ?? null,
            customer: sale?.customer?.name ?? null,
            soldPrice: sale?.amount != null ? Number(sale.amount) : null,
            soldDate: sale?.date.toISOString() ?? null,
            retailPrice: unwoven.sareeType
              ? Number(unwoven.sareeType.retailPrice)
              : line
                ? sellingPerPiece(Number(line.price), Number(line.sellPercent))
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
            color: unwoven.color ?? line?.color ?? null,
            weightG: unwoven.weightG != null ? Number(unwoven.weightG) : lineWeightG,
          };
        }
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

  /**
   * Every assigned woven saree, with its batch and latest-QC facts and no
   * money — see ProductionCatalogItem. Backs the shop's New Sale stock table,
   * which is the admin All Sarees table rendered for a role that cannot read
   * GET /batches or GET /qc (both carry weaver pay).
   */
  async findProductionCatalog(): Promise<ProductionCatalogItem[]> {
    const rows = await this.prisma.batchSareeRow.findMany({
      where: { sareeId: { not: null } },
      select: {
        sareeId: true,
        batchId: true,
        recipientType: true,
        weaverId: true,
        factoryLoomId: true,
        designCode: true,
        sareeTypeCode: true,
        bulkOrderRef: true,
        qcPassed: true,
        receivedColor: true,
        receivedWeight: true,
        receivedPhotoUrl: true,
        batch: { select: { createdAt: true } },
        weaver: { select: { firstName: true, lastName: true } },
        factoryLoom: { select: { code: true, loomNumber: true } },
        sareeType: { select: { type: true } },
        // select, never include — see findAll(): legacy photoUrl values can be
        // multi-MB inline base64. The photo is fetched separately below.
        qcRecords: {
          orderBy: { qcDate: "desc" },
          take: 1,
          select: { id: true, result: true, qcDate: true, receivedDate: true, defects: true },
        },
      },
    });

    // Latest-QC photos, only where the photo is a stored file path. Filtering
    // in the query keeps the legacy base64 blobs in the database.
    const latestQcIds = rows.map((r) => r.qcRecords[0]?.id).filter((id): id is string => !!id);
    const qcPhotos = latestQcIds.length
      ? await this.prisma.qcRecord.findMany({
          where: { id: { in: latestQcIds }, photoUrl: { not: null }, NOT: { photoUrl: { startsWith: "data:" } } },
          select: { id: true, photoUrl: true },
        })
      : [];
    const photoByQcId = new Map(qcPhotos.map((p) => [p.id, p.photoUrl]));

    // Newest sale and newest return per saree decide whether it is sold now.
    const [sales, returns] = await Promise.all([
      this.prisma.saleRecord.findMany({
        orderBy: { date: "desc" },
        distinct: ["sareeId"],
        select: { sareeId: true, date: true },
      }),
      this.prisma.returnRecord.findMany({
        orderBy: { createdAt: "desc" },
        distinct: ["sareeId"],
        select: { sareeId: true, createdAt: true, restocked: true },
      }),
    ]);
    const returnBySaree = new Map(returns.map((r) => [r.sareeId, r]));
    const soldIds = new Set(
      sales
        .filter((s) => {
          const ret = returnBySaree.get(s.sareeId);
          return !(ret?.restocked === true && ret.createdAt > s.date);
        })
        .map((s) => s.sareeId),
    );

    return rows.map((row): ProductionCatalogItem => {
      const qc = row.qcRecords[0];
      const loomMatch = row.weaver ? row.sareeId!.match(/-L(\d+)-B/) : null;
      const receiptPhoto = row.receivedPhotoUrl?.startsWith("data:") ? null : row.receivedPhotoUrl;
      return {
        sareeId: row.sareeId!,
        batchId: row.batchId,
        batchCreatedAt: row.batch.createdAt.toISOString(),
        recipientType:
          row.recipientType === "WEAVER" ? "weaver" : row.recipientType === "FACTORY_LOOM" ? "factoryLoom" : null,
        weaverId: row.weaverId,
        weaverName: row.weaver ? `${row.weaver.firstName} ${row.weaver.lastName}`.trim() : null,
        weaverLoom: loomMatch ? Number(loomMatch[1]) : null,
        factoryLoomId: row.factoryLoomId,
        factoryLoomLabel: row.factoryLoom ? row.factoryLoom.code ?? row.factoryLoom.loomNumber : null,
        designCode: row.designCode,
        sareeTypeCode: row.sareeTypeCode,
        sareeTypeName: row.sareeType?.type ?? row.sareeTypeCode,
        bulkOrderRef: row.bulkOrderRef,
        color: row.receivedColor,
        weightG: row.receivedWeight != null ? Number(row.receivedWeight) : null,
        photoUrl: receiptPhoto ?? (qc ? photoByQcId.get(qc.id) ?? null : null),
        qcPassed: row.qcPassed,
        sold: soldIds.has(row.sareeId!),
        qc: qc
          ? {
              result: qc.result,
              qcDate: qc.qcDate.toISOString(),
              receivedDate: qc.receivedDate?.toISOString() ?? null,
              defects: qc.defects,
            }
          : null,
      };
    });
  }
}
