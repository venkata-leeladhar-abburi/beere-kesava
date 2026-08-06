/**
 * One-off: dump every table to a timestamped JSON backup, then truncate all
 * data tables (schema/structure untouched). Run with: npx ts-node scripts/db-backup-and-wipe.ts
 *
 * Excluded from truncation: Permission, RolePermission (static RBAC config, not "data").
 * IdCounter is reset to empty too since it's derived state for ID sequences.
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

// Order matters for backup readability only (truncation uses CASCADE so FK order is irrelevant).
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
  { name: "RawMaterialStock",  delegate: "rawMaterialStock"  },
  { name: "GrnReceipt",        delegate: "grnReceipt"        },
  { name: "GrnItem",           delegate: "grnItem"           },
  { name: "WarpRequest",       delegate: "warpRequest"       },
  { name: "RateChangeRequest", delegate: "rateChangeRequest" },
  { name: "AuditLog",          delegate: "auditLog"          },
  { name: "ActionLog",         delegate: "actionLog"         },
  { name: "Notification",      delegate: "notification"      },
  { name: "UserPermissionOverride", delegate: "userPermissionOverride" },
  { name: "IdCounter", delegate: "idCounter" },
];

async function main() {
  const backupDir = path.join(__dirname, "..", "db-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${stamp}.json`);

  const dump: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const { name, delegate } of MODELS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma[delegate] as any).findMany();
    dump[name] = rows;
    totalRows += rows.length;
    console.log(`  backed up ${name}: ${rows.length} rows`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(dump, null, 2));
  console.log(`\nBackup written to ${backupFile} (${totalRows} total rows)\n`);

  if (totalRows === 0) {
    console.log("No rows found — nothing to truncate.");
    return;
  }

  console.log("Truncating all data tables (schema preserved)...");
  const tableNames = MODELS.map((m) => `"${m.name}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
  console.log("Done. All tables truncated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
