import { GeofenceMode, PrismaClient, UserRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/beere_kesava?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface PermissionSeed {
  key: string;
  description: string;
}

const PERMISSIONS: PermissionSeed[] = [
  // User Management
  { key: "users.create", description: "Create new user accounts" },
  { key: "users.read", description: "View user accounts and profiles" },
  { key: "users.update", description: "Update existing user accounts" },
  { key: "users.delete", description: "Deactivate or delete user accounts" },
  { key: "users.roles.manage", description: "Assign or modify user roles" },

  // Weaver roster
  // Deleting a weaver hard-deletes the linked User row too, so it carries the
  // same restriction as users.delete: SUPERADMIN only, withheld from ADMIN in
  // ROLE_PERMISSIONS below.
  { key: "weavers.delete", description: "Delete a weaver and its linked user account" },

  // Saree Production
  { key: "production.batches.create", description: "Issue new saree production batches" },
  { key: "production.batches.read", description: "View production batches and status" },
  { key: "production.batches.update", description: "Update batch progress or details" },

  // QC / Inspection
  { key: "qc.inspect", description: "Perform QC inspection on returned sarees" },
  { key: "qc.read", description: "View QC records and defect logs" },

  // Inventory / Stock
  { key: "inventory.materials.read", description: "View raw material stock levels" },
  { key: "inventory.materials.grn", description: "Record Goods Received Note (GRN)" },
  { key: "inventory.materials.issue", description: "Issue raw materials to weavers" },

  // Sales / Customer Management
  { key: "sales.orders.create", description: "Create bulk/retail sales orders" },
  { key: "sales.orders.read", description: "View sales orders and history" },
  { key: "sales.dispatch.create", description: "Record saree dispatch entries" },
  { key: "sales.customers.manage", description: "Manage wholesale/retail customer profiles" },

  // Finance / Payments
  { key: "finance.weaver_payments.manage", description: "Process weaver payment calculations" },
  { key: "finance.vendor_payments.manage", description: "Record supplier/vendor payments" },
  { key: "finance.invoices.manage", description: "Generate and manage invoices" },
  { key: "finance.outstanding.view", description: "View outstanding dues and ledgers" },

  // System & Reports
  { key: "reports.view", description: "View business intelligence reports and analytics" },
  { key: "system.audit_log.view", description: "View system audit logs" },

  // Worker alias keys (mirrors coarse permissions for worker mobile view)
  { key: "grn.create", description: "Alias for GRN entry in worker app" },
  { key: "material.issue", description: "Alias for raw material issue in worker app" },
  { key: "weaver.pay", description: "Alias for weaver payout in worker app" },
  { key: "vendor_bills.create", description: "Alias for supplier bill entry in worker app" },
  { key: "sales.inventory.view", description: "Alias for finished stock view in worker app" },
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPERADMIN: PERMISSIONS.map(p => p.key),
  // Destructive account deletions are withheld from ADMIN by design; both of
  // these remove a User row outright.
  ADMIN: PERMISSIONS.map(p => p.key).filter(
    k => k !== "users.delete" && k !== "weavers.delete",
  ),
  WORKER: [
    "production.batches.read",
    "production.batches.create",
    "production.batches.update",
    "qc.inspect",
    "qc.read",
    "inventory.materials.read",
    "inventory.materials.grn",
    "inventory.materials.issue",
    "sales.orders.create",
    "sales.orders.read",
    "sales.dispatch.create",
    "sales.customers.manage",
    "reports.view",
    "grn.create",
    "material.issue",
    "sales.inventory.view",
  ],
  WEAVER: ["production.batches.read", "qc.read"],
  SHOP: ["sales.dispatch.create", "sales.customers.manage", "sales.inventory.view"],
  ACCOUNTANT: [
    "finance.weaver_payments.manage",
    "weaver.pay",
    "finance.vendor_payments.manage",
    "finance.invoices.manage",
    "finance.outstanding.view",
    "vendor_bills.create",
  ],
};

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
  // No hardcoded mock firms — firms are managed dynamically via backend API & UI
}

async function seedFirmFinancialEntries(): Promise<void> {
  // No hardcoded mock entries — financial entries are managed dynamically via backend API & UI
}

async function seedSareeTypeRates(): Promise<void> {
  // No hardcoded mock saree types — rates are managed dynamically via backend API & UI
}

async function seedFactoryLooms(): Promise<void> {
  // No hardcoded mock looms — factory looms are managed dynamically via backend API & UI
}

/**
 * The premises the staff portals may be used from, and which roles that
 * applies to.
 *
 * Coordinates are the location pin the client sent from inside the factory at
 * Dharmavaram (Sept 2026). Four further "corner" pins were requested; three
 * came back identical to each other and the fourth sat 0.22m from the centre,
 * so the only span they establish is ~6.6m. The premises are certainly larger
 * than that, which is why the radius is the client's stated 100m rather than
 * anything derived from the pins — and why every role starts in OBSERVE.
 *
 * OBSERVE records each login's distance and accuracy without ever blocking.
 * Switch a role to ENFORCE from the admin screen only once its logins show
 * what the real readings at this site look like; setting a radius before that
 * is guesswork that locks out genuine staff.
 *
 * Upserts by label, so re-running the seed never duplicates the site and
 * never overwrites a radius an admin has since tuned.
 */
async function seedGeofence(): Promise<void> {
  const existing = await prisma.geofenceSite.findFirst({
    where: { label: "Dharmavaram factory" },
  });
  if (!existing) {
    await prisma.geofenceSite.create({
      data: {
        label: "Dharmavaram factory",
        latitude: 14.422606,
        longitude: 77.726799,
        radiusMeters: 100,
        maxAccuracyMeters: 75,
        active: true,
        sourceNote:
          "WhatsApp location pin sent from inside the premises, Sept 2026. Corner pins were duplicates, so the true extent of the site is not yet known.",
      },
    });
  }

  // ADMIN and SUPERADMIN are absent on purpose: a role with no row here is
  // not geofenced, which is how they keep access from anywhere — and how a
  // bad radius stays recoverable.
  const geofencedRoles = [UserRole.WORKER, UserRole.WEAVER, UserRole.SHOP, UserRole.ACCOUNTANT];
  for (const role of geofencedRoles) {
    await prisma.geofenceRolePolicy.upsert({
      where: { role },
      create: { role, enforced: true, mode: GeofenceMode.OBSERVE },
      // Only ever creates. An admin who has moved a role to ENFORCE must not
      // have it silently reset by the next deploy's seed run.
      update: {},
    });
  }
}

async function main(): Promise<void> {
  const keyToId = await seedPermissions();
  console.log(`Seeded ${keyToId.size} permissions`);

  await seedRolePermissions(keyToId);
  console.log("Seeded role → permission mappings");

  await seedFirms();
  console.log("Seeded firms");

  await seedFirmFinancialEntries();
  console.log("Seeded firm financial entries");

  await seedSareeTypeRates();
  console.log("Seeded saree type rates");

  await seedFactoryLooms();
  console.log("Seeded factory looms");

  await seedGeofence();
  console.log("Seeded geofence site + role policies (all roles start in OBSERVE)");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
