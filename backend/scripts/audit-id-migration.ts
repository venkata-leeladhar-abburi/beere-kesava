import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const out: Record<string, unknown> = {};

  out.customers_total = await prisma.customer.count();
  out.customers_wholesale = await prisma.customer.count({ where: { type: "WHOLESALE" } });
  out.customers_retail = await prisma.customer.count({ where: { type: "RETAIL" } });
  out.customers_missing_code = await prisma.customer.count({ where: { code: null } });

  out.weavers = await prisma.weaver.count();
  out.suppliers = await prisma.supplier.count();
  out.suppliers_missing_code = await prisma.supplier.count({ where: { code: null } });
  out.vendors = await prisma.vendor.count();
  out.vendors_missing_code = await prisma.vendor.count({ where: { code: null } });
  out.factoryLooms = await prisma.factoryLoom.count();

  // Rows that would BLOCK making these FKs required:
  out.grn_total = await prisma.grnReceipt.count();
  out.grn_ORPHAN_no_vendor = await prisma.grnReceipt.count({ where: { vendorId: null } });

  out.purchase_total = await prisma.purchase.count();
  out.purchase_ORPHAN_no_supplier = await prisma.purchase.count({ where: { supplierId: null } });

  out.quotation_total = await prisma.quotation.count();
  out.quotation_ORPHAN_no_customer = await prisma.quotation.count({ where: { customerId: null } });

  out.sale_total = await prisma.saleRecord.count();
  out.sale_ORPHAN_no_customer = await prisma.saleRecord.count({ where: { customerId: null } });

  out.returnRecord_total = await prisma.returnRecord.count();

  out.invoice_total = await prisma.invoice.count();
  out.bulkOrder_total = await prisma.bulkOrder.count();
  out.materialIssue_total = await prisma.materialIssueRecord.count();
  out.materialReturn_total = await prisma.materialReturnRecord.count();
  out.warpRequest_total = await prisma.warpRequest.count();
  out.rateChangeRequest_total = await prisma.rateChangeRequest.count();
  out.designDispatch_total = await prisma.designDispatch.count();
  out.purchaseOrder_total = await prisma.purchaseOrder.count();
  out.batch_total = await prisma.batch.count();

  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
