import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
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
  constructor(private readonly prisma: PrismaService) {}

  async createWeaverPayment(dto: CreateWeaverPaymentDto) {
    const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
    }
    return this.prisma.weaverPayment.create({
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
  }

  async findAllWeaverPayments(
    query: ListWeaverPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.WeaverPaymentGetPayload<object>>> {
    const where: Prisma.WeaverPaymentWhereInput = {
      weaverId: query.weaverId,
      firmId: query.firmId,
    };
    const [items, total] = await this.prisma.$transaction([
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
    return this.prisma.supplierPayment.create({
      data: {
        supplierId: dto.supplierId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        utr: dto.utr,
        method: dto.method,
        firmId: dto.firmId,
      },
    });
  }

  async findAllSupplierPayments(
    query: ListSupplierPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.SupplierPaymentGetPayload<object>>> {
    const where: Prisma.SupplierPaymentWhereInput = {
      supplierId: query.supplierId,
      firmId: query.firmId,
    };
    const [items, total] = await this.prisma.$transaction([
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
    return this.prisma.vendorPayment.create({
      data: {
        vendorId: dto.vendorId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        utr: dto.utr,
        method: dto.method,
        firmId: dto.firmId,
      },
    });
  }

  async findAllVendorPayments(
    query: ListVendorPaymentsQueryDto,
  ): Promise<PaginatedResult<Prisma.VendorPaymentGetPayload<object>>> {
    const where: Prisma.VendorPaymentWhereInput = {
      vendorId: query.vendorId,
      firmId: query.firmId,
    };
    const [items, total] = await this.prisma.$transaction([
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

  /**
   * Synchronous Excel import (no job queue available yet — see payments.module.ts note).
   * Expected columns (header row required): weaverId, amountPaid, utrNumber, firmId,
   * paymentDate, batchNo, loomNumber, noOfSarees, deduction.
   */
  async importWeaverPaymentsFromExcel(buffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    // exceljs's bundled .d.ts predates the newer generic Buffer<T>/Uint8Array<T> typings
    // shipped in current @types/node, so this Buffer-to-Buffer call trips a structural
    // mismatch that doesn't exist at runtime.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
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
    const rowsRaw: { rowNumber: number; weaverId: string; amountPaid: number; data: Prisma.WeaverPaymentCreateManyInput }[] = [];

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
      const data: Prisma.WeaverPaymentCreateManyInput = {
        weaverId,
        amountPaid,
        utrNumber: asString(cell(row, "utrNumber")),
        firmId: asString(cell(row, "firmId")),
        paymentDate: paymentDateStr ? new Date(paymentDateStr) : undefined,
        batchNo: asString(cell(row, "batchNo")),
        loomNumber: asString(cell(row, "loomNumber")),
        noOfSarees: asNumber(cell(row, "noOfSarees")),
        deduction: asNumber(cell(row, "deduction")),
      };

      weaverIds.add(weaverId);
      rowsRaw.push({ rowNumber, weaverId, amountPaid, data });
    });

    const existingWeavers = await this.prisma.weaver.findMany({
      where: { id: { in: Array.from(weaverIds) } },
      select: { id: true },
    });
    const existingWeaverIds = new Set(existingWeavers.map((w) => w.id));

    for (const row of rowsRaw) {
      if (!existingWeaverIds.has(row.weaverId)) {
        errors.push({ row: row.rowNumber, message: `Weaver ${row.weaverId} not found` });
        continue;
      }
      validRows.push(row.data);
    }

    if (validRows.length > 0) {
      await this.prisma.weaverPayment.createMany({ data: validRows });
    }

    return { created: validRows.length, failed: errors.length, errors };
  }
}
