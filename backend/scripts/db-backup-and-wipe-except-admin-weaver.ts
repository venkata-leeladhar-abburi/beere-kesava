/**
 * One-off: dump every table to a timestamped JSON backup, then truncate all
 * data tables EXCEPT Weaver (kept entirely) and User (kept, but narrowed to
 * ADMIN/SUPERADMIN rows only — every other role is deleted).
 * Run with: npx ts-node scripts/db-backup-and-wipe-except-admin-weaver.ts
 *
 * Excluded from truncation, same as db-backup-and-wipe.ts: Permission,
 * RolePermission (static RBAC config, not "data").
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Backed up in full (including User/Weaver) so the JSON dump is a complete
// point-in-time snapshot, even though User/Weaver aren't truncated below.
const MODELS: { name: string; delegate: keyof PrismaClient }[] = [
  { name: "User", delegate: "user" },
  { name: "OtpCode", delegate: "otpCode" },
  { name: "Weaver", delegate: "weaver" },
  { name: "FactoryLoom", delegate: "factoryLoom" },
  { name: "DesignLibrary", delegate: "designLibrary" },
  { name: "SareeTypeRate", delegate: "sareeTypeRate" },
  { name: "Batch", delegate: "batch" },
  { name: "BatchSareeRow", delegate: "batchSareeRow" },
  { name: "MaterialIssueRecord", delegate: "materialIssueRecord" },
  { name: "MaterialIssueItem", delegate: "materialIssueItem" },
  { name: "QcRecord", delegate: "qcRecord" },
  { name: "FinishingStaff", delegate: "finishingStaff" },
  { name: "FinishingAssignment", delegate: "finishingAssignment" },
  { name: "Quotation", delegate: "quotation" },
  { name: "QuotationSaree", delegate: "quotationSaree" },
  { name: "BulkOrder", delegate: "bulkOrder" },
  { name: "DispatchRecord", delegate: "dispatchRecord" },
  { name: "DispatchSaree", delegate: "dispatchSaree" },
  { name: "InventoryRecord", delegate: "inventoryRecord" },
  { name: "Saree", delegate: "saree" },
  { name: "SaleRecord", delegate: "saleRecord" },
  { name: "ReturnRecord", delegate: "returnRecord" },
  { name: "Supplier", delegate: "supplier" },
  { name: "SupplierPayment", delegate: "supplierPayment" },
  { name: "Vendor", delegate: "vendor" },
  { name: "Purchase", delegate: "purchase" },
  { name: "PurchaseOrder", delegate: "purchaseOrder" },
  { name: "PurchaseRequest", delegate: "purchaseRequest" },
  { name: "Firm", delegate: "firm" },
  { name: "FirmFinancialEntry", delegate: "firmFinancialEntry" },
  { name: "WeaverPayment", delegate: "weaverPayment" },
  { name: "VendorPayment", delegate: "vendorPayment" },
  { name: "Invoice", delegate: "invoice" },
  { name: "InvoicePayment", delegate: "invoicePayment" },
  { name: "Customer", delegate: "customer" },
  { name: "LabelSettings", delegate: "labelSettings" },
  { name: "RawMaterialStock", delegate: "rawMaterialStock" },
  { name: "GrnReceipt", delegate: "grnReceipt" },
  { name: "GrnItem", delegate: "grnItem" },
  { name: "WarpRequest", delegate: "warpRequest" },
  { name: "RateChangeRequest", delegate: "rateChangeRequest" },
  { name: "AuditLog", delegate: "auditLog" },
  { name: "ActionLog", delegate: "actionLog" },
  { name: "Notification", delegate: "notification" },
  { name: "UserPermissionOverride", delegate: "userPermissionOverride" },
  { name: "IdCounter", delegate: "idCounter" },
];

// Everything above except the two models this run must preserve.
const TRUNCATE_MODELS = MODELS.filter((m) => m.name !== "User" && m.name !== "Weaver");

async function main() {
  const backupDir = path.join(__dirname, "..", "db-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${stamp}.json`);

  const dump: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const { name, delegate } of MODELS) {
    // The model list is data-driven, so the delegate is looked up by name and
    // typed as the narrowest thing every delegate satisfies.
    const model = (prisma as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[delegate];
    const rows: unknown[] = await model.findMany();
    dump[name] = rows;
    totalRows += rows.length;
    console.log(`  backed up ${name}: ${rows.length} rows`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(dump, null, 2));
  console.log(`\nBackup written to ${backupFile} (${totalRows} total rows)\n`);

  console.log("Truncating all data tables except User and Weaver...");
  const tableNames = TRUNCATE_MODELS.map((m) => `"${m.name}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  console.log("Done. Non-excluded tables truncated.");

  console.log("Deleting User rows that are not ADMIN or SUPERADMIN...");
  const { count } = await prisma.user.deleteMany({
    where: { role: { notIn: ["ADMIN", "SUPERADMIN"] } },
  });
  console.log(`Deleted ${count} User row(s). Weaver table and ADMIN/SUPERADMIN users kept intact.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
