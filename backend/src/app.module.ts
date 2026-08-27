import { Injectable, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

// Integration specs (test/integration/*, test/utils/test-app.ts) boot the
// real AppModule and fire many requests in quick succession from the same
// source IP — real rate limiting there would fail unrelated tests on request
// volume, not on anything the test is actually asserting. Jest sets
// NODE_ENV=test by default when nothing else does, so this only disables
// enforcement under test; production and local dev both throttle for real.
@Injectable()
class AppThrottlerGuard extends ThrottlerGuard {
  protected shouldSkip(): Promise<boolean> {
    return Promise.resolve(process.env.NODE_ENV === "test");
  }
}
import { ApprovalsModule } from "./approvals/approvals.module";
import { AppController } from "./app.controller";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { BatchesModule } from "./batches/batches.module";
import { BulkOrdersModule } from "./bulk-orders/bulk-orders.module";
import { StorageModule } from "./common/storage/storage.module";
import { validateEnv } from "./config/env.validation";
import { CustomersModule } from "./customers/customers.module";
import { DesignLibraryModule } from "./design-library/design-library.module";
import { DispatchModule } from "./dispatch/dispatch.module";
import { FactoryLoomsModule } from "./factory-looms/factory-looms.module";
import { FinanceJobsModule } from "./finance-jobs/finance-jobs.module";
import { FinishingModule } from "./finishing/finishing.module";
import { FirmsModule } from "./firms/firms.module";
import { IdGeneratorModule } from "./id-generator/id-generator.module";
import { InventoryModule } from "./inventory/inventory.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { LabelsModule } from "./labels/labels.module";
import { MaterialIssuesModule } from "./material-issues/material-issues.module";
import { MaterialReturnsModule } from "./material-returns/material-returns.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PurchaseOrdersModule } from "./purchase-orders/purchase-orders.module";
import { PurchaseRequestsModule } from "./purchase-requests/purchase-requests.module";
import { PurchasesModule } from "./purchases/purchases.module";
import { QcModule } from "./qc/qc.module";
import { QuotationsModule } from "./quotations/quotations.module";
import { RatesModule } from "./rates/rates.module";
import { ReportsModule } from "./reports/reports.module";
import { SalesModule } from "./sales/sales.module";
import { ScanModule } from "./scan/scan.module";
import { SupplierReturnsModule } from "./supplier-returns/supplier-returns.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";
import { WeaversModule } from "./weavers/weavers.module";
import { VendorsModule } from "./vendors/vendors.module";
import { RawMaterialsModule } from "./raw-materials/raw-materials.module";
import { WarpRequestsModule } from "./warp-requests/warp-requests.module";
import { RateRequestsModule } from "./rate-requests/rate-requests.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { VendorBillsModule } from "./vendor-bills/vendor-bills.module";
import { DesignDispatchesModule } from "./design-dispatches/design-dispatches.module";

import { AuthModule } from "./auth/auth.module";
import { WhatsAppModule } from "./whatsapp/whatsapp.module";

@Module({
  imports: [
    WhatsAppModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Baseline rate limit on every endpoint (100 req/min per IP) — applied
    // globally via APP_GUARD below. Auth's OTP endpoints layer a much
    // tighter, named limit on top (see AuthController) since they're the
    // realistic brute-force target; this default just stops generic abuse
    // everywhere else.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    StorageModule,
    PrismaModule,
    IdGeneratorModule,
    UsersModule,
    WeaversModule,
    UploadsModule,
    SuppliersModule,
    VendorsModule,
    DesignLibraryModule,
    PurchaseOrdersModule,
    PurchaseRequestsModule,
    PurchasesModule,
    SupplierReturnsModule,
    ApprovalsModule,
    FactoryLoomsModule,
    BatchesModule,
    MaterialIssuesModule,
    MaterialReturnsModule,
    RawMaterialsModule,
    WarpRequestsModule,
    RateRequestsModule,
    AnalyticsModule,
    QcModule,
    FinishingModule,
    CustomersModule,
    BulkOrdersModule,
    InventoryModule,
    DispatchModule,
    QuotationsModule,
    SalesModule,
    RatesModule,
    InvoicesModule,
    FirmsModule,
    ReportsModule,
    PaymentsModule,
    VendorBillsModule,
    FinanceJobsModule,
    NotificationsModule,
    LabelsModule,
    ScanModule,
    AuditLogModule,
    DesignDispatchesModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}
