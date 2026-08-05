// Seeds baseline reference data: RBAC permissions, firms, and saree-type rates.
// Firm and saree-type-rate data is copied verbatim from the frontend's existing
// mock data (FirmsContext.tsx, sareeTypeData.ts) — 5 of each, not 6/6 as an
// earlier draft spec assumed. Permission keys follow the illustrative examples
// in Backend_Architecture_Design.pdf §3.2 (po.approve, finance.view_amounts,
// export.download, weaver.pay) extended to cover every module.
import "dotenv/config";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type PermissionSeed = { key: string; description: string };

const PERMISSIONS: PermissionSeed[] = [
  // Procurement
  { key: "procurement.vendors.manage", description: "Create/update vendor master data" },
  { key: "procurement.suppliers.manage", description: "Create/update supplier master data" },
  { key: "procurement.po.create", description: "Create raw-material purchase orders" },
  { key: "po.approve", description: "Approve a raw-material purchase order" },
  { key: "procurement.po.reject", description: "Reject a raw-material purchase order" },
  { key: "procurement.grn.create", description: "Record goods receipt against a PO" },
  { key: "procurement.purchases.manage", description: "Record external saree purchases" },
  { key: "procurement.purchase_requests.create", description: "Raise a supplier purchase request" },
  { key: "procurement.purchase_requests.decide", description: "Approve/reject a purchase request" },

  // Production
  { key: "production.design_library.manage", description: "Manage the design library" },
  { key: "production.batches.manage", description: "Create batches and assign saree rows" },
  { key: "production.factory_looms.manage", description: "Manage in-house factory looms" },
  { key: "production.material_issue.create", description: "Issue raw material to a weaver/loom" },

  // QC & Finishing
  { key: "qc.record", description: "Record a QC inspection result" },
  { key: "finishing.assign", description: "Assign a saree to finishing staff" },
  { key: "finishing.return", description: "Record a finishing return / damage" },
  { key: "quotations.manage", description: "Create/update quotations" },

  // Sales & fulfilment
  { key: "sales.bulk_orders.manage", description: "Create/update wholesale bulk orders" },
  { key: "sales.customers.manage", description: "Create/update customer master data" },
  { key: "sales.dispatch.create", description: "Record a dispatch (shop or wholesale)" },
  { key: "sales.inventory.view", description: "View unified inventory/stock" },

  // Finance
  { key: "finance.weaver_payments.manage", description: "Record/import weaver payments" },
  { key: "weaver.pay", description: "Mark a weaver payment as paid" },
  { key: "finance.vendor_payments.manage", description: "Record/import vendor payments" },
  { key: "finance.invoices.manage", description: "Create/update customer invoices" },
  { key: "finance.firms.manage", description: "Manage firm master data and ledgers" },
  { key: "finance.rates.manage", description: "Update the saree-type rate card" },
  {
    key: "finance.view_amounts",
    description: "View monetary amounts (gated for Money-Hidden accounts)",
  },
  {
    key: "finance.outstanding.view",
    description: "View the outstanding stock/sold/produced report",
  },

  // Platform / admin
  { key: "users.manage", description: "Create/update staff users and access levels" },
  { key: "audit_log.view", description: "View the audit log" },
  { key: "notifications.manage", description: "Manage notification settings" },
  { key: "reports.view", description: "View dashboard/report aggregations" },
  { key: "labels.manage", description: "Manage barcode/QR label settings and printing" },
  {
    key: "export.download",
    description: "Download/export data (gated for Download-Restricted accounts)",
  },

  // Weaver self-service
  { key: "weaver.self_service.view", description: "View own batches/materials/payments/sarees" },
];

const ADMIN_BASE_PERMISSIONS = [
  "procurement.vendors.manage",
  "procurement.suppliers.manage",
  "procurement.po.create",
  "procurement.po.reject",
  "procurement.grn.create",
  "procurement.purchases.manage",
  "procurement.purchase_requests.create",
  "production.design_library.manage",
  "production.batches.manage",
  "production.factory_looms.manage",
  "production.material_issue.create",
  "qc.record",
  "finishing.assign",
  "finishing.return",
  "quotations.manage",
  "sales.bulk_orders.manage",
  "sales.customers.manage",
  "sales.dispatch.create",
  "sales.inventory.view",
  "finance.weaver_payments.manage",
  "weaver.pay",
  "finance.vendor_payments.manage",
  "finance.invoices.manage",
  "finance.firms.manage",
  "finance.rates.manage",
  "finance.view_amounts",
  "finance.outstanding.view",
  "users.manage",
  "notifications.manage",
  "reports.view",
  "labels.manage",
  "export.download",
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ADMIN_BASE_PERMISSIONS,
  // Superadmin = everything Admin has, plus approvals + audit trail.
  SUPERADMIN: [
    ...ADMIN_BASE_PERMISSIONS,
    "po.approve",
    "procurement.purchase_requests.decide",
    "audit_log.view",
  ],
  WORKER: [
    "procurement.grn.create",
    "production.material_issue.create",
    "qc.record",
    "finishing.assign",
    "finishing.return",
    "sales.dispatch.create",
  ],
  WEAVER: ["weaver.self_service.view"],
  SHOP: ["sales.dispatch.create", "sales.customers.manage", "sales.inventory.view"],
  ACCOUNTANT: [
    "finance.weaver_payments.manage",
    "weaver.pay",
    "finance.vendor_payments.manage",
    "finance.invoices.manage",
    "finance.outstanding.view",
  ],
};

// Copied verbatim from frontend/src/features/firms/contexts/FirmsContext.tsx (INITIAL_FIRMS).
// Only 5 firms exist in the source data, not 6.
const FIRMS = [
  {
    firmName: "Surat Zari Works",
    gstNumber: "24ABCDE1234F1Z5",
    address: "Plot 42, GIDC Industrial Area, Katargam, Surat, Gujarat – 395004",
    purchaseAmount: 1920000,
    accountNumber: "001234567890",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    contactPersonName: "Rameshbhai Patel",
    contactPersonPhone: "9876543210",
  },
  {
    firmName: "Kanchipuram Silks",
    gstNumber: "33FGHIJ5678K2L6",
    address: "No. 7, Silk Weavers Street, Kanchipuram, Tamil Nadu – 631501",
    purchaseAmount: 3750000,
    accountNumber: "009876543210",
    ifscCode: "HDFC0002345",
    bankName: "HDFC Bank",
    contactPersonName: "Subramaniam Iyer",
    contactPersonPhone: "9123456789",
  },
  {
    firmName: "Sri Venkateswara Textiles",
    gstNumber: "37KLMNO9012P3Q7",
    address: "D.No. 18-2-45, MG Road, Ongole, Andhra Pradesh – 523001",
    purchaseAmount: 2800000,
    accountNumber: "001122334455",
    ifscCode: "ANDB0003456",
    bankName: "Andhra Bank",
    contactPersonName: "Venkata Rao",
    contactPersonPhone: "9988776655",
  },
  {
    firmName: "Lakshmi Silk Traders",
    gstNumber: "29PQRST3456U4V8",
    address: "Shop 5, Silk Market, Commercial Street, Bengaluru, Karnataka – 560001",
    purchaseAmount: 1540000,
    accountNumber: "005544332211",
    ifscCode: "ICIC0004567",
    bankName: "ICICI Bank",
    contactPersonName: "Lakshmi Devi",
    contactPersonPhone: "9811223344",
  },
  {
    firmName: "AK Traders",
    gstNumber: null,
    address: "Hyderabad, Telangana – 500001",
    purchaseAmount: 860000,
    accountNumber: null,
    ifscCode: null,
    bankName: null,
    contactPersonName: "Anwar Khan",
    contactPersonPhone: "9700112233",
  },
];

// Copied verbatim from the frontend's FirmsContext.tsx INITIAL_FINANCIALS mock.
// "Misc Income"/"Misc Expense" categories encode the frontend's MiscEntry.type
// on the wire, since the backend's FirmFinancialEntry only has kind INCOME/EXPENSE/MISC.
const FIRM_FINANCIAL_ENTRIES: {
  firmName: string;
  kind: "INCOME" | "EXPENSE" | "MISC";
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}[] = [
  { firmName: "Surat Zari Works", kind: "INCOME", category: "Wholesale Sale", description: "Wholesale order — Mysore Crepe batch", amount: 420000, date: "2026-06-10" },
  { firmName: "Surat Zari Works", kind: "INCOME", category: "Retail Sale", description: "Retail walk-in — Heavy Zari collection", amount: 85000, date: "2026-06-18" },
  { firmName: "Surat Zari Works", kind: "INCOME", category: "Wholesale Sale", description: "Kanjivaram special order", amount: 310000, date: "2026-06-25" },
  { firmName: "Surat Zari Works", kind: "EXPENSE", category: "Weaver Payments", description: "Weaver payment — Padma Veni (June)", amount: 95000, date: "2026-06-05" },
  { firmName: "Surat Zari Works", kind: "EXPENSE", category: "Material Purchase", description: "Raw silk purchase — Bangalore supplier", amount: 215000, date: "2026-06-12" },
  { firmName: "Surat Zari Works", kind: "EXPENSE", category: "Factory Maintenance", description: "Factory electricity & maintenance", amount: 18000, date: "2026-06-20" },
  { firmName: "Surat Zari Works", kind: "MISC", category: "Misc Expense", description: "Festival bonus to staff", amount: 25000, date: "2026-06-15", notes: "Eid bonus — 5 staff members" },

  { firmName: "Kanchipuram Silks", kind: "INCOME", category: "Wholesale Sale", description: "Wholesale dispatch — Kanchipuram bundle", amount: 780000, date: "2026-06-08" },
  { firmName: "Kanchipuram Silks", kind: "INCOME", category: "Retail Sale", description: "Retail silk sale — premium segment", amount: 120000, date: "2026-06-22" },
  { firmName: "Kanchipuram Silks", kind: "EXPENSE", category: "Material Purchase", description: "Zari thread bulk purchase", amount: 340000, date: "2026-06-03" },
  { firmName: "Kanchipuram Silks", kind: "EXPENSE", category: "Salaries", description: "Staff salaries — June", amount: 180000, date: "2026-06-01" },
  { firmName: "Kanchipuram Silks", kind: "EXPENSE", category: "Shop Maintenance", description: "Shop air-conditioning repair", amount: 22000, date: "2026-06-14" },

  { firmName: "Sri Venkateswara Textiles", kind: "INCOME", category: "Wholesale Sale", description: "Gadwal Cotton wholesale", amount: 290000, date: "2026-06-12" },
  { firmName: "Sri Venkateswara Textiles", kind: "EXPENSE", category: "Weaver Payments", description: "Weaver payments — June batch", amount: 145000, date: "2026-06-04" },
  { firmName: "Sri Venkateswara Textiles", kind: "EXPENSE", category: "Material Purchase", description: "Cotton yarn purchase", amount: 98000, date: "2026-06-09" },
  { firmName: "Sri Venkateswara Textiles", kind: "MISC", category: "Misc Expense", description: "Exhibition participation fee", amount: 15000, date: "2026-06-18", notes: "Handloom expo Hyderabad" },
  { firmName: "Sri Venkateswara Textiles", kind: "MISC", category: "Misc Income", description: "Commission from referral", amount: 8500, date: "2026-06-20", notes: "Referral fee from Suresh Traders" },
];

// Copied verbatim from frontend/src/features/pricing/components/rates-pricing/sareeTypeData.ts (INITIAL_RATES).
const SAREE_TYPE_RATES = [
  {
    code: "SB-001",
    type: "Self Brocade",
    description: "Traditional brocade with self-woven patterns",
    makingCharge: "450",
    retailPrice: "8500",
    wholesalePrice: "7200",
    stdWeightG: "850",
    warpWeightG: "480",
    reshamWeightG: "240",
    jariWeightG: "6",
  },
  {
    code: "HZ-003",
    type: "Heavy Zari",
    description: "Rich gold zari work with heavy metallic detailing",
    makingCharge: "680",
    retailPrice: "12000",
    wholesalePrice: "10500",
    stdWeightG: "920",
    warpWeightG: "500",
    reshamWeightG: "280",
    jariWeightG: "10",
  },
  {
    code: "PS-002",
    type: "Plain Silk",
    description: "Classic plain silk with minimal ornamentation",
    makingCharge: "280",
    retailPrice: "5500",
    wholesalePrice: "4800",
    stdWeightG: "780",
    warpWeightG: "450",
    reshamWeightG: "200",
    jariWeightG: "0",
  },
  {
    code: "BS-004",
    type: "Bridal Special",
    description: "Premium bridal collection with intricate work",
    makingCharge: "1200",
    retailPrice: "22000",
    wholesalePrice: "19500",
    stdWeightG: "1050",
    warpWeightG: "580",
    reshamWeightG: "340",
    jariWeightG: "14",
  },
  {
    code: "LC-005",
    type: "Light Cotton",
    description: "Lightweight cotton blend for everyday use",
    makingCharge: "220",
    retailPrice: "4200",
    wholesalePrice: "3600",
    stdWeightG: "680",
    warpWeightG: "400",
    reshamWeightG: "180",
    jariWeightG: "0",
  },
];

// Copied verbatim from frontend/src/features/production/data/factoryLooms.ts (INITIAL_LOOMS).
const FACTORY_LOOMS = [
  {
    loomNumber: "Loom F-01",
    location: "Factory Floor A",
    operatorName: "Srinivas Kumar",
    operatorPhone: "98765 11001",
    status: "ACTIVE" as const,
    installedYear: 2018,
    notes: "Main production loom for premium sarees",
  },
  {
    loomNumber: "Loom F-02",
    location: "Factory Floor A",
    operatorName: "Mahesh Reddy",
    operatorPhone: "87654 22002",
    status: "ACTIVE" as const,
    installedYear: 2020,
    notes: "Dobby specialised for border patterns",
  },
  {
    loomNumber: "Loom F-03",
    location: "Factory Floor B",
    operatorName: "Ramesh Naidu",
    operatorPhone: "76543 33003",
    status: "IDLE" as const,
    installedYear: 2019,
    notes: "Currently awaiting new batch assignment",
  },
  {
    loomNumber: "Loom F-04",
    location: "Factory Floor B",
    operatorName: "Suresh Babu",
    operatorPhone: "65432 44004",
    status: "MAINTENANCE" as const,
    installedYear: 2015,
    notes: "Scheduled maintenance — resume in 3 days",
  },
  {
    loomNumber: "Loom F-05",
    location: "Factory Floor C",
    operatorName: "Venkateswara Rao",
    operatorPhone: "54321 55005",
    status: "ACTIVE" as const,
    installedYear: 2022,
    notes: "New high-speed loom",
  },
];

async function seedFactoryLooms(): Promise<void> {
  for (const loom of FACTORY_LOOMS) {
    await prisma.factoryLoom.upsert({
      where: { loomNumber: loom.loomNumber },
      update: loom,
      create: loom,
    });
  }
}

async function seedPermissions(): Promise<Map<string, string>> {
  const keyToId = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
    keyToId.set(row.key, row.id);
  }

  return keyToId;
}

async function seedRolePermissions(keyToId: Map<string, string>): Promise<void> {
  const roles = Object.keys(ROLE_PERMISSIONS) as UserRole[];

  for (const role of roles) {
    for (const key of ROLE_PERMISSIONS[role]) {
      const permissionId = keyToId.get(key);
      if (!permissionId) {
        throw new Error(`Unknown permission key "${key}" referenced for role ${role}`);
      }

      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        update: {},
        create: { role, permissionId },
      });
    }
  }
}

async function seedFirms(): Promise<void> {
  for (const firm of FIRMS) {
    const existing = await prisma.firm.findFirst({ where: { firmName: firm.firmName } });
    if (existing) {
      await prisma.firm.update({ where: { id: existing.id }, data: firm });
    } else {
      await prisma.firm.create({ data: firm });
    }
  }
}

async function seedFirmFinancialEntries(): Promise<void> {
  const existingCount = await prisma.firmFinancialEntry.count();
  if (existingCount > 0) return; // already seeded (or real entries exist) — don't duplicate

  for (const entry of FIRM_FINANCIAL_ENTRIES) {
    const firm = await prisma.firm.findFirst({ where: { firmName: entry.firmName } });
    if (!firm) continue;
    await prisma.firmFinancialEntry.create({
      data: {
        firmId: firm.id,
        kind: entry.kind,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        date: new Date(entry.date),
        notes: entry.notes,
      },
    });
  }
}

async function seedSareeTypeRates(): Promise<void> {
  for (const rate of SAREE_TYPE_RATES) {
    await prisma.sareeTypeRate.upsert({
      where: { code: rate.code },
      update: rate,
      create: rate,
    });
  }
}

async function main(): Promise<void> {
  const keyToId = await seedPermissions();
  console.log(`Seeded ${keyToId.size} permissions`);

  await seedRolePermissions(keyToId);
  console.log("Seeded role → permission mappings");

  await seedFirms();
  console.log(`Seeded ${FIRMS.length} firms`);

  await seedFirmFinancialEntries();
  console.log(`Seeded firm financial entries`);

  await seedSareeTypeRates();
  console.log(`Seeded ${SAREE_TYPE_RATES.length} saree type rates`);

  await seedFactoryLooms();
  console.log(`Seeded ${FACTORY_LOOMS.length} factory looms`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
