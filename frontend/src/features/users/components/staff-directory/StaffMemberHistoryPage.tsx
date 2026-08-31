import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { Button, Select, SelectItem } from "@/shared/ui/primitives";
import { DataTable, type ColumnDef } from "@/shared/ui/data";
import { ErrorState, LoadingState, EmptyState } from "@/shared/ui/state";
import { useAuthGate } from "@/contexts/AuthContext";
import { auditLogApi, type ActionLogEntry } from "@/shared/api/audit-log";
import { BACKEND_TO_FRONTEND_ROLE, type BackendRole, type BackendUser } from "@/shared/api/users";
import { moduleLabel, type PortalScope } from "./portalScopes";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * One staff member's history, scoped to the portal they work in.
 *
 * Every row names who actually performed the action. That matters because an
 * admin or superadmin can work inside a staff portal — those actions are
 * logged against the admin's own user and role, so the row is badged to make
 * an admin-performed action obvious rather than blending in with the
 * worker's own.
 */
export function StaffMemberHistoryPage({
  scope,
  user,
  onBack,
}: {
  scope: PortalScope;
  user: BackendUser;
  onBack: () => void;
}) {
  const name = `${user.firstName} ${user.lastName}`.trim();

  return (
    <PageShell>
      {/* Hero Banner Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 flex-col xl:flex-row" style={{ position: "relative", zIndex: 2, paddingTop: 36, paddingBottom: 50, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <Button variant="link" size="sm" iconLeft={ChevronLeft} onClick={onBack} className="h-auto p-0 text-[13px] text-[#C89B47] hover:text-[#E8DCC4]">
                Back to {scope.label} Directory
              </Button>
            </div>
            <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Since 1999 · {scope.singular} Activity Log
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>{name}</h1>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(18px, 3.5vw, 26px)", fontStyle: "italic", color: "#C89B47", fontWeight: 400 }}>{user.empId}</span>
            </div>
            <p className="max-w-[640px]" style={{ fontFamily: "var(--font-ui, sans-serif)", fontWeight: 400, fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
              {user.mobile} — Everything recorded by this {scope.singular.toLowerCase()} in the {scope.label} portal.
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 56 }}>
        <StaffActivityLog scope={scope} user={user} />
      </div>
    </PageShell>
  );
}

/**
 * The activity table on its own, without the page chrome around it.
 *
 * Extracted so the Accountant directory can show the same audit trail as one
 * tab beside its money views, rather than keeping a second copy of this
 * table that would drift away from this one.
 */
export function StaffActivityLog({ scope, user }: { scope: PortalScope; user: BackendUser }) {
  const [moduleFilter, setModuleFilter] = useState("all");
  const enabled = useAuthGate("admin", "superadmin");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["staff-history", user.id, scope.role],
    queryFn: () => auditLogApi.listActions({ userId: user.id, modules: scope.modules, pageSize: 200 }),
    enabled,
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    return moduleFilter === "all" ? items : items.filter(a => a.module === moduleFilter);
  }, [data, moduleFilter]);

  const countByModule = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of data?.items ?? []) m.set(a.module, (m.get(a.module) ?? 0) + 1);
    return m;
  }, [data]);

  const name = `${user.firstName} ${user.lastName}`.trim();

  const columns: ColumnDef<ActionLogEntry>[] = [
    {
      id: "when", header: "When", accessor: a => a.createdAt, priority: 1,
      cell: (_v, a) => <span className="whitespace-nowrap font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>{formatWhen(a.createdAt)}</span>,
    },
    {
      id: "module", header: "Area", accessor: a => a.module, priority: 2,
      cell: (_v, a) => (
        <span
          className="whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
          style={{ color: "#845E04", background: "rgba(200,155,71,0.12)", borderColor: "rgba(200,155,71,0.30)" }}
        >
          {moduleLabel(a.module)}
        </span>
      ),
    },
    {
      id: "action", header: "Action", accessor: a => a.action, priority: 1,
      cell: (_v, a) => (
        <div className="min-w-0">
          <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>{a.action}</div>
          {a.recordLabel && (
            <div className="truncate font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>{a.recordLabel}</div>
          )}
        </div>
      ),
    },
    {
      id: "performedBy", header: "Performed by", accessor: a => a.user ? `${a.user.firstName} ${a.user.lastName}` : "—", priority: 2,
      cell: (_v, a) => {
        const performer = a.user ? `${a.user.firstName} ${a.user.lastName}`.trim() : null;
        const performerRole = (a.user?.role ?? a.role) as BackendRole;
        // An admin working inside a staff portal is logged with their own
        // role — surface that rather than letting it read as the worker's
        // own action.
        const isElevated = performerRole === "ADMIN" || performerRole === "SUPERADMIN";
        return (
          <div className="min-w-0">
            <div className="truncate text-[13px]" style={{ color: performer ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              {performer ?? "Unknown user"}
            </div>
            <span
              className="mt-0.5 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={isElevated
                ? { color: "var(--text-brand)", background: "rgba(110,15,45,0.08)" }
                : { color: "var(--text-tertiary)", background: "rgba(0,0,0,0.05)" }}
            >
              {performerRole === "SUPERADMIN" ? "Superadmin" : BACKEND_TO_FRONTEND_ROLE[performerRole] ?? performerRole}
              {isElevated ? ` · in ${scope.label}` : ""}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageShell.Toolbar>
        <div className="w-full md:w-[260px]">
          <Select size="sm" className="w-full" value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectItem value="all">
              {`All areas (${data?.items.length ?? 0})`}
            </SelectItem>
            {scope.modules
              .filter(m => (countByModule.get(m) ?? 0) > 0)
              .map(m => (
                <SelectItem key={m} value={m}>
                  {`${moduleLabel(m)} (${countByModule.get(m)})`}
                </SelectItem>
              ))}
          </Select>
        </div>
      </PageShell.Toolbar>

      <PageShell.Content>
        {isLoading ? (
          <LoadingState variant="skeleton" rows={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="pending"
            title="Nothing recorded yet"
            description={`No ${scope.label} activity has been logged against ${name} so far.`}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}>
            <DataTable columns={columns} data={rows} getRowId={a => a.id} responsive density="compact" pagination />
          </div>
        )}
      </PageShell.Content>
    </>
  );
}
