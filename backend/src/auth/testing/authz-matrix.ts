/**
 * Authorization matrix extractor.
 * ═══════════════════════════════════════════════════════════════════════════
 * Walks every *.controller.ts and records, for each route handler, the
 * authorization metadata that actually decorates it: the @Controller prefix,
 * the HTTP verb and path, and any @Public / @RequireRoles / @AdminOnly /
 * @RequirePermissions applied at either the method or the class level.
 *
 * This is deliberately an AST walk rather than a regex sweep: decorators are
 * routinely stacked, wrapped across lines, and applied at two different
 * levels, and a regex that looks right on the common case quietly misreads
 * the interesting ones — which are exactly the routes worth auditing.
 *
 * Consumed by src/auth/authz-matrix.spec.ts. Lives under src/ so it is
 * typechecked and linted with the rest of the code, and is excluded from
 * tsconfig.build.json so `nest build` never emits it - it imports the
 * TypeScript compiler, which is a devDependency.
 *
 * Run directly to print the current inventory as JSON:
 *
 *   npx ts-node src/auth/testing/authz-matrix.ts
 */
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

export type HttpVerb = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RouteEntry {
  /** e.g. "users.controller.ts" */
  file: string;
  controller: string;
  verb: HttpVerb;
  /** Full path with the controller prefix applied, e.g. "/users/:id". */
  route: string;
  handler: string;
  /** True when @Public appears at the method or class level. */
  isPublic: boolean;
  /** Roles from @RequireRoles/@AdminOnly, method level winning over class. */
  requiredRoles: string[];
  /** Keys from @RequirePermissions, method level winning over class. */
  requiredPermissions: string[];
  /** Where the effective authz metadata came from. */
  source: "method" | "class" | "none";
}

const VERB_DECORATORS = new Set(["Get", "Post", "Patch", "Put", "Delete"]);

/** Decorator call arguments, as literal strings where statically knowable. */
function stringArgs(call: ts.CallExpression): string[] {
  return call.arguments
    .filter((a): a is ts.StringLiteral => ts.isStringLiteral(a))
    .map((a) => a.text);
}

/** `UserRole.ADMIN` -> "ADMIN"; a bare identifier is returned as written. */
function roleArgs(call: ts.CallExpression): string[] {
  return call.arguments.map((a) =>
    ts.isPropertyAccessExpression(a) ? a.name.text : a.getText(),
  );
}

function decoratorCalls(node: ts.Node): ts.CallExpression[] {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
  return (decorators ?? [])
    .map((d) => d.expression)
    .filter((e): e is ts.CallExpression => ts.isCallExpression(e));
}

function decoratorName(call: ts.CallExpression): string {
  return ts.isIdentifier(call.expression) ? call.expression.text : "";
}

interface AuthzMeta {
  isPublic: boolean;
  roles: string[];
  permissions: string[];
}

function readAuthz(node: ts.Node): AuthzMeta {
  const meta: AuthzMeta = { isPublic: false, roles: [], permissions: [] };
  for (const call of decoratorCalls(node)) {
    switch (decoratorName(call)) {
      case "Public":
        meta.isPublic = true;
        break;
      case "RequireRoles":
        meta.roles.push(...roleArgs(call));
        break;
      case "AdminOnly":
        // Sugar for @RequireRoles(ADMIN, SUPERADMIN) — expand it so the
        // matrix compares like with like.
        meta.roles.push("ADMIN", "SUPERADMIN");
        break;
      case "RequirePermissions":
        meta.permissions.push(...stringArgs(call));
        break;
    }
  }
  return meta;
}

function joinRoute(prefix: string, sub: string): string {
  const clean = (s: string) => s.replace(/^\/+|\/+$/g, "");
  const parts = [clean(prefix), clean(sub)].filter(Boolean);
  return "/" + parts.join("/");
}

export function extractRoutes(srcDir: string): RouteEntry[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // The generated Prisma client is enormous and contains no controllers.
        if (entry.name === "generated" || entry.name === "node_modules") continue;
        walk(full);
      } else if (entry.name.endsWith(".controller.ts") && !entry.name.endsWith(".spec.ts")) {
        files.push(full);
      }
    }
  };
  walk(srcDir);
  files.sort();

  const routes: RouteEntry[] = [];

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.ES2021,
      /* setParentNodes */ true,
    );

    source.forEachChild((node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      const controllerDecorator = decoratorCalls(node).find(
        (c) => decoratorName(c) === "Controller",
      );
      if (!controllerDecorator) return;

      const prefix = stringArgs(controllerDecorator)[0] ?? "";
      const classAuthz = readAuthz(node);

      for (const member of node.members) {
        if (!ts.isMethodDeclaration(member) || !member.name) continue;

        const verbDecorator = decoratorCalls(member).find((c) =>
          VERB_DECORATORS.has(decoratorName(c)),
        );
        if (!verbDecorator) continue;

        const methodAuthz = readAuthz(member);

        // Nest's Reflector.getAllAndOverride checks the handler first and
        // falls back to the class, so method-level metadata replaces the
        // class-level value outright rather than merging with it.
        const roles = methodAuthz.roles.length ? methodAuthz.roles : classAuthz.roles;
        const permissions = methodAuthz.permissions.length
          ? methodAuthz.permissions
          : classAuthz.permissions;

        const fromMethod = methodAuthz.roles.length > 0 || methodAuthz.permissions.length > 0;
        const fromClass = classAuthz.roles.length > 0 || classAuthz.permissions.length > 0;

        routes.push({
          file: path.relative(srcDir, file).replace(/\\/g, "/"),
          controller: node.name.text,
          verb: decoratorName(verbDecorator).toUpperCase() as HttpVerb,
          route: joinRoute(prefix, stringArgs(verbDecorator)[0] ?? ""),
          handler: member.name.getText(source),
          isPublic: methodAuthz.isPublic || classAuthz.isPublic,
          requiredRoles: [...new Set(roles)],
          requiredPermissions: [...new Set(permissions)],
          source: fromMethod ? "method" : fromClass ? "class" : "none",
        });
      }
    });
  }

  return routes;
}

/** Mutating verbs — an unguarded one of these is the interesting case. */
export const MUTATING: ReadonlySet<HttpVerb> = new Set<HttpVerb>([
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
]);

export function isUnguarded(r: RouteEntry): boolean {
  return !r.isPublic && r.requiredRoles.length === 0 && r.requiredPermissions.length === 0;
}

/**
 * The permission catalog and role map, read out of prisma/seed.ts.
 *
 * seed.ts opens a database connection and calls main() at module load, so it
 * cannot simply be imported from a test. Parsing its AST keeps seed.ts as the
 * single source of truth without executing it, and means the test notices when
 * somebody edits the catalog.
 *
 * SUPERADMIN and ADMIN are computed from PERMISSIONS with .map()/.filter()
 * rather than written as literals. They are deliberately not resolved here:
 * PermissionsGuard short-circuits both roles before any lookup happens, so
 * their entries can never affect an authorization outcome.
 */
export interface SeedCatalog {
  permissionKeys: string[];
  rolePermissions: Record<string, string[]>;
}

export function extractSeedCatalog(seedFile: string): SeedCatalog {
  const source = ts.createSourceFile(
    seedFile,
    fs.readFileSync(seedFile, "utf8"),
    ts.ScriptTarget.ES2021,
    true,
  );

  const permissionKeys: string[] = [];
  const rolePermissions: Record<string, string[]> = {};

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (node.name.text === "PERMISSIONS" && ts.isArrayLiteralExpression(node.initializer)) {
        for (const element of node.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          for (const prop of element.properties) {
            if (
              ts.isPropertyAssignment(prop) &&
              prop.name.getText(source) === "key" &&
              ts.isStringLiteral(prop.initializer)
            ) {
              permissionKeys.push(prop.initializer.text);
            }
          }
        }
      }

      if (
        node.name.text === "ROLE_PERMISSIONS" &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        for (const prop of node.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const role = prop.name.getText(source).replace(/["']/g, "");
          if (!ts.isArrayLiteralExpression(prop.initializer)) continue; // computed: see doc comment
          rolePermissions[role] = prop.initializer.elements
            .filter((e): e is ts.StringLiteral => ts.isStringLiteral(e))
            .map((e) => e.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return { permissionKeys, rolePermissions };
}

if (require.main === module) {
  const routes = extractRoutes(path.join(__dirname, "..", ".."));
  const unguardedMutations = routes.filter((r) => isUnguarded(r) && MUTATING.has(r.verb));

  process.stdout.write(
    JSON.stringify(
      {
        totals: {
          routes: routes.length,
          controllers: new Set(routes.map((r) => r.controller)).size,
          public: routes.filter((r) => r.isPublic).length,
          roleGuarded: routes.filter((r) => r.requiredRoles.length > 0).length,
          permissionGuarded: routes.filter((r) => r.requiredPermissions.length > 0).length,
          unguarded: routes.filter(isUnguarded).length,
          unguardedMutations: unguardedMutations.length,
        },
        unguardedMutations: unguardedMutations.map((r) => `${r.verb} ${r.route}`),
        routes,
      },
      null,
      2,
    ) + "\n",
  );
}
