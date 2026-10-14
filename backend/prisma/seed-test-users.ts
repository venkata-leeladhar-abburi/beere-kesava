/**
 * Sign-in accounts for the integration (test/) and Playwright (frontend/e2e/)
 * suites, which log in through the real OTP flow and so need registered
 * numbers. Login used to create these on the fly (AuthService
 * ensureDefaultUsers); it no longer creates anyone, so a test database is
 * seeded with them explicitly instead.
 *
 *   DATABASE_URL=<disposable db> npx ts-node prisma/seed-test-users.ts
 *
 * Refuses a Supabase URL: these are full-access accounts on guessable numbers.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AccessLevel, PrismaClient, UserRole } from "../src/generated/prisma/client";

export const TEST_USERS = [
  {
    empId: "TEST-SUPERADMIN",
    firstName: "Test",
    lastName: "Superadmin",
    mobile: "9999999999",
    role: UserRole.SUPERADMIN,
  },
  {
    empId: "TEST-ADMIN",
    firstName: "Test",
    lastName: "Admin",
    mobile: "8888888888",
    role: UserRole.ADMIN,
  },
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.includes("supabase")) {
    throw new Error("seed-test-users only runs against a disposable database, never Supabase.");
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    for (const user of TEST_USERS) {
      await prisma.user.upsert({
        where: { mobile: user.mobile },
        update: { role: user.role, status: "ACTIVE" },
        create: { ...user, accessLevel: AccessLevel.FULL_ACCESS },
      });
    }
    console.log(`Seeded ${TEST_USERS.length} test users`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
