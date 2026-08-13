import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { VendorBillsService } from "../vendor-bills/vendor-bills.service";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { CreateVendorPaymentDto } from "./dto/create-vendor-payment.dto";
import { CreateWeaverPaymentDto } from "./dto/create-weaver-payment.dto";
import { ListSupplierPaymentsQueryDto } from "./dto/list-supplier-payments-query.dto";
import { ListVendorPaymentsQueryDto } from "./dto/list-vendor-payments-query.dto";
import { ListWeaverPaymentsQueryDto } from "./dto/list-weaver-payments-query.dto";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  failed: number;
  errors: ImportRowError[];
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly vendorBillsService: VendorBillsService,
  ) {}

  async createWeaverPayment(dto: CreateWeaverPaymentDto) {
    const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
    }
    const payment = await this.prisma.weaverPayment.create({
      data: {
        weaverId: dto.weaverId,
        amountPaid: dto.amountPaid,
        utrNumber: dto.utrNumber,
        firmId: dto.firmId,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        batchNo: dto.batchNo,
        loomNumber: dto.loomNumber,
        noOfSarees: dto.noOfSarees,
        deduction: dto.deduction,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PAYMENTS",
      action: `Recorded payment of ${dto.amountPaid} to weaver ${weaver.name}`,
      entityType: "WeaverPayment",
      entityId: payment.id,
      recordLabel: weaver.name,
      newValue: String(dto.amountPaid),
    });

    return payment;
  }

  async findAllWeaverPayments(
    query: ListWeaverPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.WeaverPaymentGetPayload<object>>> {
    const where: Prisma.WeaverPaymentWhereInput = {
      weaverId: query.weaverId,
      firmId: query.firmId,
    };
    const [items, total] = await Promise.all([
      this.prisma.weaverPayment.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { paymentDate: "desc" },
      }),
      this.prisma.weaverPayment.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async createSupplierPayment(dto: CreateSupplierPaymentDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
    }
    const payment = await this.prisma.supplierPayment.create({
      data: {
        supplierId: dto.supplierId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        utr: dto.utr,
        method: dto.method,
        firmId: dto.firmId,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PAYMENTS",
      action: `Recorded payment of ${dto.amount} to supplier ${supplier.name}`,
      entityType: "SupplierPayment",
      entityId: payment.id,
      recordLabel: supplier.name,
      newValue: String(dto.amount),
    });

    return payment;
  }

  async findAllSupplierPayments(
    query: ListSupplierPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.SupplierPaymentGetPayload<object>>> {
    const where: Prisma.SupplierPaymentWhereInput = {
      supplierId: query.supplierId,
      firmId: query.firmId,
    };
    const [items, total] = await Promise.all([
      this.prisma.supplierPayment.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.supplierPayment.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async createVendorPayment(dto: CreateVendorPaymentDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    if (dto.billId) {
      // Validates existence and vendor ownership up front so a payment is
      // never recorded against a bill that doesn't belong to this vendor.
      const bill = await this.prisma.vendorBill.findUnique({ where: { id: dto.billId } });
      if (!bill) {
        throw new NotFoundException(`Vendor bill ${dto.billId} not found`);
      }
      if (bill.vendorId !== dto.vendorId) {
        throw new NotFoundException(`Vendor bill ${dto.billId} does not belong to this vendor`);
      }
    }

    const payment = await this.prisma.vendorPayment.create({
      data: {
        vendorId: dto.vendorId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        utr: dto.utr,
        method: dto.method,
        firmId: dto.firmId,
        billId: dto.billId,
      },
    });

    if (dto.billId) {
      await this.vendorBillsService.recomputeStatus(dto.billId);
    }

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PAYMENTS",
      action: dto.billId
        ? `Recorded payment of ${dto.amount} to vendor ${vendor.name} against bill ${dto.billId}`
        : `Recorded payment of ${dto.amount} to vendor ${vendor.name}`,
      entityType: "VendorPayment",
      entityId: payment.id,
      recordLabel: vendor.name,
      newValue: String(dto.amount),
    });

    return payment;
  }

  async findAllVendorPayments(
    query: ListVendorPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.VendorPaymentGetPayload<object>>> {
    const where: Prisma.VendorPaymentWhereInput = {
      vendorId: query.vendorId,
      firmId: query.firmId,
    };
    const [items, total] = await Promise.all([
      this.prisma.vendorPayment.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.vendorPayment.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  // Earnings a weaver is owed for completed work: every BatchSareeRow that's
  // QC-passed OR finished via the Raise Quotation receive flow (either
  // milestone alone counts it), deduplicated per saree, priced at that saree
  // type's making charge (SareeTypeRate.makingCharge) — never a
  // hardcoded/mock figure. This is what a weaver has *earned*, distinct from
  // WeaverPayment rows (which record what's actually been paid out so far).
  async getWeaverEarnings(weaverId?: string) {
    const rowWhere = weaverId ? { weaverId } : { weaverId: { not: null } };
    const [qcPassedRows, returnedAssignments] = await Promise.all([
      this.prisma.batchSareeRow.findMany({
        where: { ...rowWhere, qcPassed: true },
        select: { sareeId: true, weaverId: true, sareeTypeCode: true },
      }),
      this.prisma.finishingAssignment.findMany({
        where: { status: "RETURNED", batchSareeRow: rowWhere },
        select: {
          sareeId: true,
          batchSareeRow: { select: { weaverId: true, sareeTypeCode: true } },
        },
      }),
    ]);

    const rows = new Map<string, { weaverId: string; sareeTypeCode: string | null }>();
    qcPassedRows.forEach((r) => {
      if (r.sareeId && r.weaverId) rows.set(r.sareeId, { weaverId: r.weaverId, sareeTypeCode: r.sareeTypeCode });
    });
    returnedAssignments.forEach((r) => {
      const wId = r.batchSareeRow.weaverId;
      if (wId && !rows.has(r.sareeId)) {
        rows.set(r.sareeId, { weaverId: wId, sareeTypeCode: r.batchSareeRow.sareeTypeCode });
      }
    });

    const rates = await this.prisma.sareeTypeRate.findMany({
      select: { code: true, type: true, makingCharge: true },
    });
    const rateByCode = new Map(rates.map((r) => [r.code, r]));

    const weaverIds = Array.from(new Set(Array.from(rows.values()).map((r) => r.weaverId)));
    const weavers = await this.prisma.weaver.findMany({
      where: { id: { in: weaverIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const weaverById = new Map(weavers.map((w) => [w.id, `${w.firstName} ${w.lastName}`.trim()]));

    // weaverId -> sareeTypeCode -> count
    const counts = new Map<string, Map<string, number>>();
    for (const row of rows.values()) {
      if (!row.sareeTypeCode) continue;
      const byType = counts.get(row.weaverId) ?? new Map<string, number>();
      byType.set(row.sareeTypeCode, (byType.get(row.sareeTypeCode) ?? 0) + 1);
      counts.set(row.weaverId, byType);
    }

    return Array.from(counts.entries()).map(([wId, byType]) => {
      const breakdown = Array.from(byType.entries()).map(([code, completedCount]) => {
        const rate = rateByCode.get(code);
        const ratePerSaree = Number(rate?.makingCharge ?? 0);
        return {
          sareeTypeCode: code,
          sareeTypeName: rate?.type ?? code,
          completedCount,
          ratePerSaree,
          amount: completedCount * ratePerSaree,
        };
      });
      return {
        weaverId: wId,
        weaverName: weaverById.get(wId) ?? wId,
        totalCompletedSarees: breakdown.reduce((s, b) => s + b.completedCount, 0),
        totalEarned: breakdown.reduce((s, b) => s + b.amount, 0),
        breakdown,
      };
    });
  }

  // Every inspected saree with a weaver attached — the raw material the
  // Weaver Payments page's production-summary table/template is built from.
  // All three verdicts carry a real deduction figure (QcService.
  // computeQcPayment): PASSED is 0, SEMI is the partial withhold, and
  // DEFECTIVE withholds the making charge in full (deduction === makingCharge,
  // payable 0) — dropping SEMI or DEFECTIVE here would silently hide real
  // money withheld from a weaver's payment summary. Grouping by (weaverId,
  // batchId, loomNumber) and date-range filtering both happen client-side,
  // matching how every other date-filtered list in this app works, so this
  // stays a flat per-saree list.
  async getWeaverProductionRows() {
    const records = await this.prisma.qcRecord.findMany({
      where: { weaverId: { not: null } },
      select: {
        sareeId: true,
        weaverId: true,
        weaver: { select: { firstName: true, lastName: true } },
        batchId: true,
        loomNumber: true,
        qcDate: true,
        makingCharge: true,
        deduction: true,
      },
      orderBy: { qcDate: "asc" },
    });

    return records.map((r) => {
      // A weaver's own loom isn't a stored column on QcRecord (loomNumber
      // there is only ever set for factory-loom rows) — it's baked into the
      // generated sareeId as -L{n}- (see generateSareeId on the frontend),
      // so recover it from there when the column itself is empty. Without
      // this every weaver-loom row collapses onto the same blank "—" bucket
      // regardless of which of their looms actually produced it.
      const loomMatch = r.sareeId.match(/-L(\d+)-B/);
      const loomNumber = r.loomNumber ?? (loomMatch ? loomMatch[1] : null);

      return {
        sareeId: r.sareeId,
        weaverId: r.weaverId as string,
        weaverName: r.weaver ? `${r.weaver.firstName} ${r.weaver.lastName}`.trim() : (r.weaverId as string),
        batchId: r.batchId,
        loomNumber,
        qcDate: r.qcDate,
        makingCharge: Number(r.makingCharge),
        deduction: Number(r.deduction),
      };
    });
  }

  async getPaymentSummary() {
    const [
      weaverAggregate,
      vendorAggregate,
      supplierAggregate,
      invoiceAggregate,
      salesAggregate,
      outstandingInvoices,
    ] = await Promise.all([
      this.prisma.weaverPayment.aggregate({ _sum: { amountPaid: true } }),
      this.prisma.vendorPayment.aggregate({ _sum: { amount: true } }),
      this.prisma.supplierPayment.aggregate({ _sum: { amount: true } }),
      this.prisma.invoice.aggregate({ _sum: { paid: true, total: true } }),
      this.prisma.saleRecord.aggregate({ _sum: { amount: true } }),
      this.prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        select: { total: true, paid: true, status: true },
      }),
    ]);

    const weaverTotal = Number(weaverAggregate._sum.amountPaid || 0);
    const vendorTotal = Number(vendorAggregate._sum.amount || 0);
    const supplierTotal = Number(supplierAggregate._sum.amount || 0);
    const invoicePaidTotal = Number(invoiceAggregate._sum.paid || 0);
    const salesTotal = Number(salesAggregate._sum.amount || 0);

    const totalRevenue = invoicePaidTotal + salesTotal;
    const totalExpenses = weaverTotal + vendorTotal + supplierTotal;
    const netCashFlow = totalRevenue - totalExpenses;

    const outstandingAmount = outstandingInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.paid)),
      0,
    );

    return {
      weaverTotal,
      vendorTotal,
      supplierTotal,
      totalExpenses,
      totalRevenue,
      netCashFlow,
      outstandingAmount,
      outstandingCount: outstandingInvoices.length,
    };
  }

  /**
   * Synchronous Excel import (no job queue available yet — see payments.module.ts note).
   * Expected columns (header row required): weaverId, amountPaid, utrNumber, firmId,
   * paymentDate, batchNo, loomNumber, noOfSarees, deduction.
   */
  async importWeaverPaymentsFromExcel(buffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      // exceljs's bundled .d.ts predates the newer generic Buffer<T>/Uint8Array<T> typings
      // shipped in current @types/node, so this Buffer-to-Buffer call trips a structural
      // mismatch that doesn't exist at runtime.
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    } catch {
      return { created: 0, failed: 0, errors: [{ row: 0, message: "Couldn't read this file — make sure it's a valid .xlsx exported from the template." }] };
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { created: 0, failed: 0, errors: [{ row: 0, message: "No worksheet found" }] };
    }

    const headerRow = sheet.getRow(1).values as unknown[];
    const columnIndex = new Map<string, number>();
    headerRow.forEach((value, index) => {
      if (typeof value === "string") {
        columnIndex.set(value.trim(), index);
      }
    });

    const requiredColumns = ["weaverId", "amountPaid"];
    for (const column of requiredColumns) {
      if (!columnIndex.has(column)) {
        return {
          created: 0,
          failed: 0,
          errors: [{ row: 1, message: `Missing required column "${column}"` }],
        };
      }
    }

    const cell = (row: ExcelJS.Row, name: string) => {
      const index = columnIndex.get(name);
      return index === undefined ? undefined : row.getCell(index).value;
    };
    const asString = (value: unknown): string | undefined => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "string") return value.trim();
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (value instanceof Date) return value.toISOString();
      return undefined;
    };
    const asNumber = (value: unknown): number | undefined => {
      const str = asString(value);
      if (str === undefined) return undefined;
      const num = Number(str);
      return Number.isNaN(num) ? undefined : num;
    };

    const errors: ImportRowError[] = [];
    const validRows: Prisma.WeaverPaymentCreateManyInput[] = [];
    const weaverIds = new Set<string>();
    const rowsRaw: { rowNumber: number; weaverId: string; amountPaid: number; firmRaw?: string; data: Prisma.WeaverPaymentCreateManyInput }[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const weaverId = asString(cell(row, "weaverId"));
      const amountPaid = asNumber(cell(row, "amountPaid"));

      if (!weaverId) {
        errors.push({ row: rowNumber, message: "Missing weaverId" });
        return;
      }
      if (amountPaid === undefined || amountPaid <= 0) {
        errors.push({ row: rowNumber, message: "Missing or invalid amountPaid" });
        return;
      }

      const paymentDateStr = asString(cell(row, "paymentDate"));
      const paymentDate = paymentDateStr ? new Date(paymentDateStr) : undefined;
      if (paymentDate && Number.isNaN(paymentDate.getTime())) {
        errors.push({ row: rowNumber, message: `Invalid paymentDate "${paymentDateStr}"` });
        return;
      }

      const firmRaw = asString(cell(row, "firmId"));
      const data: Prisma.WeaverPaymentCreateManyInput = {
        weaverId,
        amountPaid,
        utrNumber: asString(cell(row, "utrNumber")),
        firmId: firmRaw, // resolved (id-or-name -> real id) once firms are loaded below
        paymentDate,
        batchNo: asString(cell(row, "batchNo")),
        loomNumber: asString(cell(row, "loomNumber")),
        noOfSarees: asNumber(cell(row, "noOfSarees")),
        deduction: asNumber(cell(row, "deduction")),
      };

      weaverIds.add(weaverId);
      rowsRaw.push({ rowNumber, weaverId, amountPaid, firmRaw, data });
    });

    const [allWeavers, firms] = await Promise.all([
      // Fetched in full (not just the ids seen in the sheet) so a row that
      // typed the weaver's code or display name instead of the raw id can
      // still be resolved below.
      this.prisma.weaver.findMany({ select: { id: true, code: true, name: true } }),
      this.prisma.firm.findMany({ select: { id: true, firmName: true } }),
    ]);
    const weaverIdById = new Set(allWeavers.map((w) => w.id));
    const weaverIdByCode = new Map(allWeavers.map((w) => [w.code.trim().toLowerCase(), w.id]));
    const weaverIdByName = new Map(allWeavers.map((w) => [w.name.trim().toLowerCase(), w.id]));
    const firmIds = new Set(firms.map((f) => f.id));
    // The production-summary table shows "Firm Name", not the raw firmId, so
    // an admin filling the template by hand naturally types the name they
    // can see — accept either instead of hard-failing (or worse, letting an
    // unmatched value hit the DB as a broken foreign key, which previously
    // crashed the whole import with an uncaught 500).
    const firmIdByName = new Map(firms.map((f) => [f.firmName.trim().toLowerCase(), f.id]));

    // Resolve weaverId to its real id up front (rather than inline in the
    // loop below) so the owed/already-paid lookup below can be scoped to the
    // exact set of real weaver ids this sheet touches.
    const resolvedWeaverIdByRow = new Map<number, string>();
    for (const row of rowsRaw) {
      if (weaverIdById.has(row.weaverId)) {
        resolvedWeaverIdByRow.set(row.rowNumber, row.weaverId);
        continue;
      }
      const resolved =
        weaverIdByCode.get(row.weaverId.trim().toLowerCase()) ??
        weaverIdByName.get(row.weaverId.trim().toLowerCase());
      if (resolved) resolvedWeaverIdByRow.set(row.rowNumber, resolved);
    }
    const touchedWeaverIds = Array.from(new Set(resolvedWeaverIdByRow.values()));

    // A payment can never push a weaver's total paid past what they've
    // actually earned — "owed" is the same Making Charges − Deduction figure
    // shown on the Production Summary table (QcRecord.makingCharge minus
    // QcRecord.deduction, summed per weaver), and "already paid" is every
    // WeaverPayment row saved for them so far, across all previous uploads.
    const [qcRecordsForOwed, existingPayments] = await Promise.all([
      this.prisma.qcRecord.findMany({
        where: { weaverId: { in: touchedWeaverIds } },
        select: { sareeId: true, weaverId: true, makingCharge: true, deduction: true, qcDate: true },
        orderBy: { qcDate: "asc" },
      }),
      this.prisma.weaverPayment.findMany({
        where: { weaverId: { in: touchedWeaverIds } },
        select: { weaverId: true, amountPaid: true },
      }),
    ]);
    // Same rework dedup as getWeaverProductionRows: a reworked saree has more
    // than one QcRecord (its failed attempt(s) plus the final verdict) — only
    // the latest one is real, otherwise a superseded DEFECTIVE/SEMI record's
    // making charge and deduction get double-counted into "owed".
    const latestQcBySareeId = new Map<string, (typeof qcRecordsForOwed)[number]>();
    for (const r of qcRecordsForOwed) {
      latestQcBySareeId.set(r.sareeId, r);
    }
    const owedByWeaver = new Map<string, number>();
    for (const r of latestQcBySareeId.values()) {
      if (!r.weaverId) continue;
      const net = Number(r.makingCharge) - Number(r.deduction);
      owedByWeaver.set(r.weaverId, (owedByWeaver.get(r.weaverId) ?? 0) + net);
    }
    // Running total per weaver — starts at what's already saved, then grows
    // as each row in *this* sheet is accepted, so two rows for the same
    // weaver in one upload are checked against each other too, not just
    // against the pre-existing DB total.
    const runningPaidByWeaver = new Map<string, number>();
    for (const p of existingPayments) {
      runningPaidByWeaver.set(p.weaverId, (runningPaidByWeaver.get(p.weaverId) ?? 0) + Number(p.amountPaid));
    }

    const weaverNameById = new Map(allWeavers.map((w) => [w.id, w.name]));

    for (const row of rowsRaw) {
      const resolvedWeaverId = resolvedWeaverIdByRow.get(row.rowNumber);
      if (!resolvedWeaverId) {
        errors.push({ row: row.rowNumber, message: `Weaver "${row.weaverId}" not found (checked weaver ID, code, and name)` });
        continue;
      }
      row.data.weaverId = resolvedWeaverId;

      if (row.firmRaw) {
        if (firmIds.has(row.firmRaw)) {
          // already a real id — leave as-is
        } else {
          const resolvedId = firmIdByName.get(row.firmRaw.trim().toLowerCase());
          if (!resolvedId) {
            errors.push({ row: row.rowNumber, message: `Firm "${row.firmRaw}" not found (checked both firm ID and firm name)` });
            continue;
          }
          row.data.firmId = resolvedId;
        }
      }

      // Never let a payment push the weaver's running total past what
      // they've actually earned — checked against everything already saved
      // for them PLUS everything already accepted earlier in this same sheet.
      const owed = owedByWeaver.get(resolvedWeaverId) ?? 0;
      const paidSoFar = runningPaidByWeaver.get(resolvedWeaverId) ?? 0;
      const remaining = owed - paidSoFar;
      if (row.amountPaid > remaining) {
        const weaverName = weaverNameById.get(resolvedWeaverId) ?? resolvedWeaverId;
        errors.push({
          row: row.rowNumber,
          message: `Payment ₹${row.amountPaid} exceeds remaining balance ₹${remaining} for ${weaverName} (owed ₹${owed}, already paid ₹${paidSoFar}) — not saved.`,
        });
        continue;
      }
      runningPaidByWeaver.set(resolvedWeaverId, paidSoFar + row.amountPaid);

      validRows.push(row.data);
    }

    if (validRows.length > 0) {
      await this.prisma.weaverPayment.createMany({ data: validRows });
    }

    return { created: validRows.length, failed: errors.length, errors };
  }
}
