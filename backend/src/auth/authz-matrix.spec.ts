/**
 * Authorization matrix.
 * ═══════════════════════════════════════════════════════════════════════════
 * The highest-leverage test in this codebase: it is the one that catches a
 * route quietly losing its guard, or a role gaining access it was never meant
 * to have. In an ERP that class of bug leaks another firm's data.
 *
 * Four independent checks, deliberately kept separate so a failure names its
 * own cause:
 *
 *   1. INVENTORY   — a committed snapshot of every route's authz metadata.
 *                    Changing a decorator fails this until the snapshot is
 *                    regenerated, which forces the diff in front of a reviewer.
 *   2. CATALOG     — every key named by @RequirePermissions must exist in
 *                    prisma/seed.ts. PermissionsGuard fails closed on an
 *                    unseeded key, so a typo silently bricks the route for
 *                    every non-admin role instead of erroring loudly.
 *   3. COVERAGE    — no *new* mutating route may ship without a guard. The
 *                    known-unguarded set is an explicit, shrinking allowlist.
 *   4. RUNTIME     — the real PermissionsGuard, fed each route's real
 *                    metadata and the real seeded role map, for all six roles.
 *
 * Check 4 is what makes this more than a lint rule: it exercises the guard's
 * actual decision, including the ADMIN/SUPERADMIN bypass and the
 * fail-closed-on-unseeded-key path.
 */
import { ExecutionContext } from "@nestjs/common";
import { AppException, ForbiddenRoleError } from "../common/errors";
import { Reflector } from "@nestjs/core";
import * as path from "path";
import {
  extractRoutes,
  extractSeedCatalog,
  isUnguarded,
  MUTATING,
  RouteEntry,
} from "./testing/authz-matrix";
import { UserRole } from "../generated/prisma/client";
import { REQUIRE_PERMISSIONS_KEY } from "./decorators/require-permissions.decorator";
import { REQUIRE_ROLES_KEY } from "./decorators/require-roles.decorator";
import { PermissionsGuard } from "./guards/permissions.guard";

const BACKEND_ROOT = path.join(__dirname, "..", "..");
const routes = extractRoutes(path.join(BACKEND_ROOT, "src"));
const catalog = extractSeedCatalog(path.join(BACKEND_ROOT, "prisma", "seed.ts"));

const ALL_ROLES = Object.values(UserRole);

/** Roles PermissionsGuard waves through before any lookup happens. */
const BYPASS_ROLES: UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN];

const routeId = (r: RouteEntry) => `${r.verb} ${r.route}`;

// ───────────────────────────────────────────────────────────────────────────
// 1. INVENTORY
// ───────────────────────────────────────────────────────────────────────────
describe("authz matrix / route inventory", () => {
  it("finds every controller in the project", () => {
    // A drop here means the extractor stopped seeing files, which would make
    // every other check in this file silently vacuous.
    expect(routes.length).toBeGreaterThan(150);
    expect(new Set(routes.map((r) => r.controller)).size).toBeGreaterThanOrEqual(43);
  });

  it("matches the committed authorization snapshot", () => {
    const snapshot = routes.map((r) => ({
      route: routeId(r),
      public: r.isPublic,
      roles: [...r.requiredRoles].sort(),
      permissions: [...r.requiredPermissions].sort(),
    }));
    // Regenerate with `npx jest authz-matrix -u` after an intentional change,
    // and read the diff: every line of it is an authorization change.
    expect(snapshot).toMatchSnapshot();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. CATALOG INTEGRITY
// ───────────────────────────────────────────────────────────────────────────
describe("authz matrix / permission catalog integrity", () => {
  const referenced = [
    ...new Set(routes.flatMap((r) => r.requiredPermissions)),
  ].sort();

  // Keys referenced by a controller but absent from prisma/seed.ts. Because
  // PermissionsGuard.hasAllPermissions() bails when the catalog lookup returns
  // fewer rows than keys requested, each of these routes is permanently denied
  // to every role except ADMIN/SUPERADMIN — no configuration can turn it on.
  //
  // This list must only ever shrink. Fix the key in seed.ts (or the
  // decorator), do not append to it.
  const KNOWN_UNSEEDED_KEYS = [
    "procurement.po.reject",
    "rate_requests.approve",
    "rate_requests.reject",
    "warp_requests.approve",
    "warp_requests.reject",
  ];

  it("references at least one permission key", () => {
    expect(referenced.length).toBeGreaterThan(0);
  });

  it("names no unseeded permission key beyond the known-broken set", () => {
    const unseeded = referenced.filter((key) => !catalog.permissionKeys.includes(key));
    expect(unseeded.sort()).toEqual([...KNOWN_UNSEEDED_KEYS].sort());
  });

  it("keeps the seed catalog itself free of duplicate keys", () => {
    const duplicates = catalog.permissionKeys.filter(
      (key, i) => catalog.permissionKeys.indexOf(key) !== i,
    );
    expect(duplicates).toEqual([]);
  });

  it("grants every non-bypass role only keys that exist in the catalog", () => {
    for (const [role, keys] of Object.entries(catalog.rolePermissions)) {
      const unknown = keys.filter((k) => !catalog.permissionKeys.includes(k));
      expect({ role, unknown }).toEqual({ role, unknown: [] });
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. GUARD COVERAGE
// ───────────────────────────────────────────────────────────────────────────
describe("authz matrix / guard coverage", () => {
  // Mutating routes deliberately left reachable by any authenticated user,
  // each for a reason that a role list would not actually address. These are
  // decisions, not gaps - but they still have follow-up work attached.
  const INTENTIONALLY_OPEN_MUTATIONS = [
    // Callers span nearly every role: AddUserForm (admin), NewWeaverModal
    // (accountant), DispatchShopModal (worker), ProcessReturnWholesaleFlow
    // (shop). A role list covering all of them is the same as no list. The
    // real control for an upload endpoint is what it accepts, not who calls
    // it: magic-byte type checks, size caps, filename sanitisation, and
    // serving from a non-executable location. Tracked as upload hardening.
    "POST /uploads/photo",
    "POST /uploads/receipt",
    // The notification bell exists in every portal, so every role must be
    // able to mark one read. Ownership is the correct control and now lives
    // in NotificationsService.markRead().
    "PATCH /notifications/:id/read",
    // Every role must be able to end its own session, so a role list would
    // name all of them. The control that matters is scope, not membership:
    // the handler closes the caller's own session using the id from their
    // token and ignores any client-supplied identity, so it cannot be aimed
    // at anyone else.
    "POST /auth/logout",
  ];

  // Mutating routes with no authorization at all and no accepted reason.
  // A debt ledger: it must only ever shrink.
  const KNOWN_UNGUARDED_MUTATIONS: string[] = [];

  it("adds no unguarded mutating route beyond the known set", () => {
    const unguarded = routes
      .filter((r) => isUnguarded(r) && MUTATING.has(r.verb))
      .map(routeId)
      .filter((id) => !INTENTIONALLY_OPEN_MUTATIONS.includes(id))
      .sort();
    expect(unguarded).toEqual([...KNOWN_UNGUARDED_MUTATIONS].sort());
  });

  it("keeps the intentionally-open list honest", () => {
    // If one of these gains a guard, the entry is stale and should be removed
    // rather than left to rot as a comment describing something untrue.
    const stillOpen = routes
      .filter((r) => isUnguarded(r) && MUTATING.has(r.verb))
      .map(routeId);
    expect([...INTENTIONALLY_OPEN_MUTATIONS].sort()).toEqual(stillOpen.sort());
  });

  it("leaves no route both public and guarded", () => {
    // @Public bypasses JwtAuthGuard entirely, so there is no authenticated
    // user for PermissionsGuard to check — the pairing is always a mistake.
    const contradictory = routes
      .filter(
        (r) => r.isPublic && (r.requiredRoles.length > 0 || r.requiredPermissions.length > 0),
      )
      .map(routeId);
    expect(contradictory).toEqual([]);
  });

  it("keeps the public surface minimal and explicit", () => {
    // GET /auth/testing/otp is present in this static inventory because the
    // extractor reads source files, not runtime wiring — but AuthModule only
    // ever registers it when isE2eTestModeEnabled() is true (NODE_ENV not
    // "production" AND E2E_TEST_MODE="true"). In every other environment,
    // including this test run, Nest never puts the route on the router at
    // all. It is listed here, not filtered out, precisely so that a second
    // genuinely-new public route cannot slip in disguised as "just like the
    // known test one".
    expect(routes.filter((r) => r.isPublic).map(routeId).sort()).toEqual([
      "GET /auth/testing/otp",
      "GET /health",
      // Serves uploaded photos/signatures/receipts. Public because the URLs
      // are consumed by <img src>/<a href>, which cannot send a bearer token
      // — the same unauthenticated exposure the express.static mount it
      // replaced always had. Filenames are random UUIDs.
      "GET /uploads/:folder/:filename",
      "POST /auth/request-otp",
      "POST /auth/verify-otp",
    ]);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. RUNTIME GUARD BEHAVIOUR
// ───────────────────────────────────────────────────────────────────────────
describe("authz matrix / PermissionsGuard decisions", () => {
  /**
   * Stands in for the Permission/RolePermission/UserPermissionOverride tables
   * using the role map parsed out of prisma/seed.ts, so the guard makes its
   * real decision against the real seeded data shape.
   */
  function prismaFor(role: UserRole, overrides: Record<string, boolean> = {}) {
    const granted = catalog.rolePermissions[role] ?? [];
    return {
      permission: {
        findMany: ({ where }: { where: { key: { in: string[] } } }) =>
          Promise.resolve(
            where.key.in
              // An unseeded key returns no row at all — this is what makes the
              // guard fail closed.
              .filter((key) => catalog.permissionKeys.includes(key))
              .map((key) => ({
                id: key,
                key,
                rolePermissions: granted.includes(key) ? [{ id: `${role}:${key}` }] : [],
                userOverrides:
                  key in overrides ? [{ granted: overrides[key] }] : [],
              })),
          ),
      },
    };
  }

  function contextFor(route: RouteEntry, role: UserRole): ExecutionContext {
    const handler = () => undefined;
    const controller = class {};
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: `user-${role}`, role } }),
      }),
    } as unknown as ExecutionContext;
  }

  function guardFor(route: RouteEntry, role: UserRole, overrides?: Record<string, boolean>) {
    // Feed the guard this route's real metadata rather than re-declaring it.
    const reflector = {
      getAllAndOverride: (key: string) =>
        key === REQUIRE_PERMISSIONS_KEY
          ? route.requiredPermissions
          : key === REQUIRE_ROLES_KEY
            ? (route.requiredRoles as UserRole[])
            : undefined,
    } as unknown as Reflector;
    return new PermissionsGuard(
      reflector,
      prismaFor(role, overrides) as never,
    );
  }

  const decide = async (route: RouteEntry, role: UserRole) => {
    try {
      return await guardFor(route, role).canActivate(contextFor(route, role));
    } catch (error) {
      if (error instanceof AppException) return false;
      throw error;
    }
  };

  it("lets SUPERADMIN and ADMIN through every guarded route", async () => {
    const guarded = routes.filter((r) => !isUnguarded(r));
    for (const role of BYPASS_ROLES) {
      for (const route of guarded) {
        await expect(decide(route, role)).resolves.toBe(true);
      }
    }
  });

  it("lets any authenticated role through a route with no authz metadata", async () => {
    const open = routes.filter(isUnguarded);
    for (const route of open) {
      for (const role of ALL_ROLES) {
        await expect(decide(route, role)).resolves.toBe(true);
      }
    }
  });

  it("denies a role that is absent from @RequireRoles", async () => {
    const roleGuarded = routes.filter(
      (r) => r.requiredRoles.length > 0 && r.requiredPermissions.length === 0,
    );
    expect(roleGuarded.length).toBeGreaterThan(0);

    for (const route of roleGuarded) {
      for (const role of ALL_ROLES) {
        if (BYPASS_ROLES.includes(role)) continue;
        const expected = route.requiredRoles.includes(role);
        await expect(decide(route, role)).resolves.toBe(expected);
      }
    }
  });

  it("denies a role whose seeded permissions do not cover the route", async () => {
    const permissionGuarded = routes.filter((r) => r.requiredPermissions.length > 0);
    expect(permissionGuarded.length).toBeGreaterThan(0);

    for (const route of permissionGuarded) {
      for (const role of ALL_ROLES) {
        if (BYPASS_ROLES.includes(role)) continue;
        const seeded = catalog.rolePermissions[role] ?? [];
        // All keys required (AND), and every key must exist in the catalog.
        const expected =
          route.requiredPermissions.every((k) => catalog.permissionKeys.includes(k)) &&
          route.requiredPermissions.every((k) => seeded.includes(k)) &&
          (route.requiredRoles.length === 0 || route.requiredRoles.includes(role));
        await expect(decide(route, role)).resolves.toBe(expected);
      }
    }
  });

  it("fails closed when a required permission key is not in the catalog", async () => {
    const broken: RouteEntry = {
      file: "synthetic",
      controller: "Synthetic",
      verb: "POST",
      route: "/synthetic",
      handler: "act",
      isPublic: false,
      requiredRoles: [],
      requiredPermissions: ["definitely.not.seeded"],
      source: "method",
    };
    for (const role of ALL_ROLES) {
      const expected = BYPASS_ROLES.includes(role);
      await expect(decide(broken, role)).resolves.toBe(expected);
    }
  });

  it("lets a per-user override grant a permission the role lacks", async () => {
    const route: RouteEntry = {
      file: "synthetic",
      controller: "Synthetic",
      verb: "POST",
      route: "/synthetic",
      handler: "act",
      isPublic: false,
      requiredRoles: [],
      requiredPermissions: ["users.create"],
      source: "method",
    };
    // WEAVER is seeded with production.batches.read and qc.read only.
    expect(catalog.rolePermissions.WEAVER).not.toContain("users.create");

    const denied = guardFor(route, UserRole.WEAVER);
    await expect(denied.canActivate(contextFor(route, UserRole.WEAVER))).rejects.toThrow(
      ForbiddenRoleError,
    );

    const allowed = guardFor(route, UserRole.WEAVER, { "users.create": true });
    await expect(allowed.canActivate(contextFor(route, UserRole.WEAVER))).resolves.toBe(true);
  });

  it("lets a per-user override revoke a permission the role has", async () => {
    const route: RouteEntry = {
      file: "synthetic",
      controller: "Synthetic",
      verb: "POST",
      route: "/synthetic",
      handler: "act",
      isPublic: false,
      requiredRoles: [],
      requiredPermissions: ["qc.read"],
      source: "method",
    };
    expect(catalog.rolePermissions.WEAVER).toContain("qc.read");

    const allowed = guardFor(route, UserRole.WEAVER);
    await expect(allowed.canActivate(contextFor(route, UserRole.WEAVER))).resolves.toBe(true);

    const revoked = guardFor(route, UserRole.WEAVER, { "qc.read": false });
    await expect(revoked.canActivate(contextFor(route, UserRole.WEAVER))).rejects.toThrow(
      ForbiddenRoleError,
    );
  });

  it("rejects an unauthenticated request to a guarded route", async () => {
    const route = routes.find((r) => !isUnguarded(r));
    expect(route).toBeDefined();

    const reflector = {
      getAllAndOverride: (key: string) =>
        key === REQUIRE_PERMISSIONS_KEY
          ? route!.requiredPermissions
          : (route!.requiredRoles as UserRole[]),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector, prismaFor(UserRole.WORKER) as never);
    const context = {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(AppException);
  });
});
