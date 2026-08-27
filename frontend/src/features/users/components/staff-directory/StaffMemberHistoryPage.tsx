import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { Button, Combobox } from "@/shared/ui/primitives";
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
    <PageShell>
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 28, paddingBottom: 56 }}>
        <PageShell.Header
          breadcrumb={
            <Button variant="link" size="sm" iconLeft={ChevronLeft} onClick={onBack} className="h-auto p-0 text-[13px]">
              All {scope.label}
            </Button>
          }
          title={name}
          subtitle={`${user.empId} · ${user.mobile} — everything recorded by this ${scope.singular.toLowerCase()} in the ${scope.label} portal.`}
        />

        <PageShell.Toolbar>
          <div className="w-full md:w-[260px]">
            <Combobox
              size="sm"
              className="w-full"
              value={moduleFilter}
              onValueChange={setModuleFilter}
              searchPlaceholder="Search area…"
              emptyMessage="No area matches"
              options={[
                { value: "all", label: `All areas`, hint: `${data?.items.length ?? 0} action${(data?.items.length ?? 0) === 1 ? "" : "s"}` },
                ...scope.modules
                  .filter(m => (countByModule.get(m) ?? 0) > 0)
                  .map(m => ({
                    value: m,
                    label: moduleLabel(m),
                    hint: `${countByModule.get(m)} action${countByModule.get(m) === 1 ? "" : "s"}`,
                  })),
              ]}
            />
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
              <DataTable columns={columns} data={rows} getRowId={a => a.id} responsive density="compact" />
            </div>
          )}
        </PageShell.Content>
      </div>
    </PageShell>
  );
}
