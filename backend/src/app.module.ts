import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ApprovalsModule } from "./approvals/approvals.module";
import { AppController } from "./app.controller";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { BatchesModule } from "./batches/batches.module";
import { BulkOrdersModule } from "./bulk-orders/bulk-orders.module";
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

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
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
  providers: [],
})
export class AppModule {}
