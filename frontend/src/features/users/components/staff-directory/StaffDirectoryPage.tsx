import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { Input } from "@/shared/ui/primitives";
import { DataTable, type ColumnDef } from "@/shared/ui/data";
import { ErrorState, LoadingState, EmptyState } from "@/shared/ui/state";
import { useAuthGate } from "@/contexts/AuthContext";
import { usersApi, type BackendUser } from "@/shared/api/users";
import { auditLogApi } from "@/shared/api/audit-log";
import { StaffMemberHistoryPage } from "./StaffMemberHistoryPage";
import { type PortalScope } from "./portalScopes";

function fullName(u: BackendUser) {
  return `${u.firstName} ${u.lastName}`.trim();
}

function initialsOf(u: BackendUser) {
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() || "—";
}

/**
 * Everyone who works in one staff portal, and a way into what each of them
 * has actually done there. Admin/superadmin only — it's an oversight view.
 */
export function StaffDirectoryPage({ scope }: { scope: PortalScope }) {
  const [search, setSearch] = useState("");
  const [openUser, setOpenUser] = useState<BackendUser | null>(null);
  const enabled = useAuthGate("admin", "superadmin");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["staff-directory", scope.role],
    queryFn: () => usersApi.list({ role: scope.role, pageSize: 100 }),
    enabled,
  });

  // One query for the whole portal's history, then counted per person — far
  // cheaper than a request per row, and it also gives the directory a
  // "last active" column without a second round trip.
  const { data: actions } = useQuery({
    queryKey: ["staff-directory-activity", scope.role],
    queryFn: () => auditLogApi.listActions({ modules: scope.modules, pageSize: 200 }),
    enabled,
  });

  const activityByUser = useMemo(() => {
    const counts = new Map<string, { count: number; last: string }>();
    for (const a of actions?.items ?? []) {
      if (!a.userId) continue;
      const prev = counts.get(a.userId);
      if (!prev) counts.set(a.userId, { count: 1, last: a.createdAt });
      else counts.set(a.userId, { count: prev.count + 1, last: prev.last > a.createdAt ? prev.last : a.createdAt });
    }
    return counts;
  }, [actions]);

  const staff = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(u =>
      fullName(u).toLowerCase().includes(q) ||
      u.empId.toLowerCase().includes(q) ||
      u.mobile.includes(q) ||
      (u.email ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  if (openUser) {
    return <StaffMemberHistoryPage scope={scope} user={openUser} onBack={() => setOpenUser(null)} />;
  }

  const columns: ColumnDef<BackendUser>[] = [
    {
      id: "name", header: scope.singular, accessor: u => fullName(u), priority: 1,
      cell: (_v, u) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: "var(--text-brand)" }}
          >
            {initialsOf(u)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{fullName(u)}</div>
            <div className="truncate font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>{u.empId}</div>
          </div>
        </div>
      ),
    },
    {
      id: "mobile", header: "Mobile", accessor: u => u.mobile, priority: 2,
      cell: (_v, u) => <span className="font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>{u.mobile}</span>,
    },
    {
      id: "status", header: "Status", accessor: u => u.status, priority: 2,
      cell: (_v, u) => (
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={u.status === "ACTIVE"
            ? { color: "#1E6640", background: "rgba(30,102,64,0.10)" }
            : { color: "var(--text-tertiary)", background: "rgba(0,0,0,0.05)" }}
        >
          {u.status === "ACTIVE" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions", header: `${scope.label} activity`, accessor: u => activityByUser.get(u.id)?.count ?? 0, priority: 3,
      cell: (_v, u) => {
        const a = activityByUser.get(u.id);
        return a
          ? <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{a.count} recorded action{a.count === 1 ? "" : "s"}</span>
          : <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>No activity yet</span>;
      },
    },
    {
      id: "open", header: "", accessor: () => null,
      cell: () => <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />,
    },
  ];

  return (
    <PageShell>
      {/* Hero Banner Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 flex-col xl:flex-row" style={{ position: "relative", zIndex: 2, paddingTop: 44, paddingBottom: 60, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Since 1999 · {scope.label} Directory &amp; Oversight
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>{scope.label}</h1>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 4.5vw, 32px)", fontStyle: "italic", color: "#C89B47", fontWeight: 400 }}>&amp; Portal Oversight</span>
            </div>
            <p className="max-w-[640px]" style={{ fontFamily: "var(--font-ui, sans-serif)", fontWeight: 400, fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
              {scope.blurb}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 56 }}>
        <PageShell.Toolbar>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${scope.label.toLowerCase()} by name, ID or mobile…`}
            iconLeft={Search}
            className="w-full md:max-w-[420px]"
          />
        </PageShell.Toolbar>

        <PageShell.Content>
          {isLoading ? (
            <LoadingState variant="skeleton" rows={5} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : staff.length === 0 ? (
            <EmptyState
              icon="employee"
              title={search ? `No ${scope.label.toLowerCase()} match that search` : `No ${scope.label.toLowerCase()} yet`}
              description={search ? "Try a different name, employee ID or mobile number." : `Users created with the ${scope.label} role will appear here.`}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}>
              <DataTable
                columns={columns}
                data={staff}
                getRowId={u => u.id}
                onRowClick={u => setOpenUser(u)}
                responsive
                pagination
              />
            </div>
          )}
        </PageShell.Content>
      </div>
    </PageShell>
  );
}
