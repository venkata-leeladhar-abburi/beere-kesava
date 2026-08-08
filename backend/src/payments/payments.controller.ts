import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Queue } from "bullmq";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequireRoles } from "../auth/decorators/require-roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { resolveWeaverScope } from "../auth/weaver-scope";
import { UserRole } from "../generated/prisma/client";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { CreateVendorPaymentDto } from "./dto/create-vendor-payment.dto";
import { CreateWeaverPaymentDto } from "./dto/create-weaver-payment.dto";
import { ListSupplierPaymentsQueryDto } from "./dto/list-supplier-payments-query.dto";
import { ListVendorPaymentsQueryDto } from "./dto/list-vendor-payments-query.dto";
import { ListWeaverPaymentsQueryDto } from "./dto/list-weaver-payments-query.dto";
import { WeaverEarningsQueryDto } from "./dto/weaver-earnings-query.dto";
import { ImportResult, PaymentsService } from "./payments.service";
import { WEAVER_PAYMENTS_IMPORT_QUEUE } from "./weaver-payments-import.processor";

// Financial module — ACCOUNTANT access by default. The one exception is
// GET /payments/weavers, which a WEAVER may also call to see their own
// payment history (self-scoped below) — everything else here (creating
// payments, vendor/supplier payments) stays ACCOUNTANT/ADMIN-only.
@Controller("payments")
@RequireRoles(UserRole.ACCOUNTANT)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectQueue(WEAVER_PAYMENTS_IMPORT_QUEUE) private readonly importQueue: Queue,
  ) {}

  @Get("summary")
  getPaymentSummary() {
    return this.paymentsService.getPaymentSummary();
  }

  @Post("weavers")
  createWeaverPayment(@Body() dto: CreateWeaverPaymentDto) {
    return this.paymentsService.createWeaverPayment(dto);
  }

  @Get("weavers")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.WEAVER)
  findAllWeaverPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListWeaverPaymentsQueryDto,
  ) {
    // A WEAVER token must never see another weaver's payments — ignore any
    // client-supplied weaverId and force it to the caller's own id.
    const scopedQuery =
      user.role === UserRole.WEAVER ? { ...query, weaverId: resolveWeaverScope(user) } : query;
    return this.paymentsService.findAllWeaverPayments(scopedQuery);
  }

  // Amount owed per weaver, derived from QC-passed sarees x that saree
  // type's real making charge — not from manually-entered WeaverPayment
  // rows, which only record what's already been paid.
  @Get("weavers/earnings")
  @RequireRoles(UserRole.ACCOUNTANT, UserRole.WEAVER)
  getWeaverEarnings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WeaverEarningsQueryDto,
  ) {
    const weaverId = user.role === UserRole.WEAVER ? resolveWeaverScope(user) : query.weaverId;
    return this.paymentsService.getWeaverEarnings(weaverId);
  }

  @Post("weavers/import")
  @UseInterceptors(FileInterceptor("file"))
  async importWeaverPayments(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const job = await this.importQueue.add("import", {
      fileBase64: file.buffer.toString("base64"),
    });
    return { jobId: job.id };
  }

  @Get("weavers/import/:jobId/status")
  async getImportStatus(@Param("jobId") jobId: string) {
    const job = await this.importQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Import job ${jobId} not found`);
    }
    const state = await job.getState();
    const result = state === "completed" ? (job.returnvalue as ImportResult) : undefined;
    return {
      jobId: job.id,
      state,
      result,
      failedReason: state === "failed" ? job.failedReason : undefined,
    };
  }

  @Post("vendors")
  createVendorPayment(@Body() dto: CreateVendorPaymentDto) {
    return this.paymentsService.createVendorPayment(dto);
  }

  @Get("vendors")
  findAllVendorPayments(@Query() query: ListVendorPaymentsQueryDto) {
    return this.paymentsService.findAllVendorPayments(query);
  }

  @Post("suppliers")
  createSupplierPayment(@Body() dto: CreateSupplierPaymentDto) {
    return this.paymentsService.createSupplierPayment(dto);
  }

  @Get("suppliers")
  findAllSupplierPayments(@Query() query: ListSupplierPaymentsQueryDto) {
    return this.paymentsService.findAllSupplierPayments(query);
  }
}
