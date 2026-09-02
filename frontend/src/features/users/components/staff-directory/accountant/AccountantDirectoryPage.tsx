import { useMemo, useState } from "react";
import { useListDetailScroll } from "@/shared/ui/ScrollToTop";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Receipt, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { Input, Select, SelectItem } from "@/shared/ui/primitives";
import { DataTable, type ColumnDef } from "@/shared/ui/data";
import { LuxuryStatsCard } from "@/shared/ui/LuxuryStatsCard";
import { DateFilterBar, DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { ErrorState, LoadingState, EmptyState } from "@/shared/ui/state";
import { useAuthGate } from "@/contexts/AuthContext";
import { usersApi, type BackendUser } from "@/shared/api/users";
import { auditLogApi } from "@/shared/api/audit-log";
import { staffFinanceApi, UNATTRIBUTED_ID, type StaffLedgerKind } from "@/shared/api/staff-finance";
import { ACCOUNTANT_SCOPE } from "../portalScopes";
import { AccountantMemberPage } from "./AccountantMemberPage";
import {
  KIND_CONFIG, KIND_ORDER, emptyTotals,
  dailySeries, dateFilterToRange, groupByRecorder,
  type LedgerTotals,
} from "./ledger";
import { DirectionAmount, MoneyText, VolumeSparkline, useMoneyFormatter } from "./primitives";

const SCOPE = ACCOUNTANT_SCOPE;

function fullName(u: BackendUser) {
  return `${u.firstName} ${u.lastName}`.trim();
}

function initialsOf(u: BackendUser) {
  return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() || "—";
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** One person (or the unattributed bucket) as the directory table sees them. */
interface DirectoryRow {
  key: string;
  /** Null for the synthetic "Unattributed" row. */
  user: BackendUser | null;
  name: string;
  empId: string;
  mobile: string;
  totals: LedgerTotals;
  /** Always the last 14 days, regardless of the period filter — the column
   *  header says so, which is clearer than a sparkline whose window silently
   *  changes underneath the reader. */
  sparkline: ReturnType<typeof dailySeries>;
  actionCount: number;
}

/**
 * Accountant Staff Directory — who handles the money, and how much of it.
 *
 * The Worker and Shop directories can get away with counting recorded
 * actions, because that is what oversight of those portals means. For
 * accountants the meaningful figure is the money itself, so this screen is
 * built around the ledger rather than around the audit log — the audit log
 * is still there, one level down, on each person's page.
 *
 * Admin/superadmin only.
 */
export function AccountantDirectoryPage() {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | StaffLedgerKind>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [openRow, setOpenRow] = useState<DirectoryRow | null>(null);
  const { openDetail, backToList } = useListDetailScroll();
  const enabled = useAuthGate("admin", "superadmin");
  const { money } = useMoneyFormatter();

  const usersQuery = useQuery({
    queryKey: ["staff-directory", SCOPE.role],
    queryFn: () => usersApi.list({ role: SCOPE.role, pageSize: 100 }),
    enabled,
  });

  // The period and the money-type filter are server parameters, so these
  // totals are aggregated over the whole period in the database rather than
  // over however many rows a capped list happened to return.
  const range = useMemo(() => dateFilterToRange(dateFilter), [dateFilter]);
  const summaryQuery = useQuery({
    queryKey: ["accountant-staff-summary", kindFilter, range.from ?? "", range.to ?? ""],
    queryFn: () =>
      staffFinanceApi.summary({
        ...(kindFilter === "all" ? {} : { kind: kindFilter }),
        ...range,
      }),
    enabled,
  });

  // Rows, purely to draw the 14-day sparklines. Bounded by that window rather
  // than by a row cap, so it stays small no matter how long the history is.
  // It follows the money-type filter, like every other cell in the row, but
  // deliberately not the period — the column header names its own window.
  // One extra day is fetched so a session left open past midnight does not
  // lose the oldest bar.
  const sparklineWindowStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 14);
    return d.toISOString();
  }, []);
  const sparklineQuery = useQuery({
    queryKey: ["accountant-staff-sparklines", kindFilter, sparklineWindowStart],
    queryFn: () =>
      staffFinanceApi.ledger({
        from: sparklineWindowStart,
        ...(kindFilter === "all" ? {} : { kind: kindFilter }),
        limit: 2000,
      }),
    enabled,
  });

  // Portal activity counts, same source the Worker/Shop directories use.
  const { data: actions } = useQuery({
    queryKey: ["staff-directory-activity", SCOPE.role],
    queryFn: () => auditLogApi.listActions({ modules: SCOPE.modules, pageSize: 200 }),
    enabled,
  });

  const actionsByUser = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of actions?.items ?? []) {
      if (!a.userId) continue;
      counts.set(a.userId, (counts.get(a.userId) ?? 0) + 1);
    }
    return counts;
  }, [actions]);

  /** Server totals, keyed the same way the sparkline buckets are. */
  const totalsByRecorder = useMemo(() => {
    const map = new Map<string, LedgerTotals>();
    for (const { recordedById, ...totals } of summaryQuery.data?.items ?? []) {
      map.set(recordedById ?? UNATTRIBUTED_ID, totals);
    }
    return map;
  }, [summaryQuery.data]);

  const sparklineByRecorder = useMemo(
    () => groupByRecorder(sparklineQuery.data?.items ?? []),
    [sparklineQuery.data],
  );

  const rows = useMemo<DirectoryRow[]>(() => {
    const staff = usersQuery.data?.items ?? [];
    const built: DirectoryRow[] = staff.map(u => ({
      key: u.id,
      user: u,
      name: fullName(u),
      empId: u.empId,
      mobile: u.mobile,
      totals: totalsByRecorder.get(u.id) ?? emptyTotals(),
      sparkline: dailySeries(sparklineByRecorder.get(u.id) ?? []),
      actionCount: actionsByUser.get(u.id) ?? 0,
    }));

    // Payments recorded before per-user attribution existed still moved real
    // money, so they get their own row rather than quietly vanishing from
    // the totals.
    const orphanTotals = totalsByRecorder.get(UNATTRIBUTED_ID);
    if (orphanTotals) {
      built.push({
        key: UNATTRIBUTED_ID,
        user: null,
        name: "Unattributed",
        empId: "No recorded user",
        mobile: "—",
        totals: orphanTotals,
        sparkline: dailySeries(sparklineByRecorder.get(UNATTRIBUTED_ID) ?? []),
        actionCount: 0,
      });
    }

    return built;
  }, [usersQuery.data, totalsByRecorder, sparklineByRecorder, actionsByUser]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        (r.user?.email ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  /**
   * Summed over the rows this table shows, not over every recorder the server
   * returned.
   *
   * Shop staff record retail sales and admins can record payments, so
   * staff-summary legitimately carries groups for people who are not
   * accountants. Summing those into the header would put the whole business's
   * takings above a table listing accountants only — a strip that never adds
   * up to the rows beneath it.
   */
  const overall = useMemo(() => {
    const paidOut = rows.reduce((sum, r) => sum + r.totals.paidOut, 0);
    const collectedIn = rows.reduce((sum, r) => sum + r.totals.collectedIn, 0);
    const txns = rows.reduce((sum, r) => sum + r.totals.txns, 0);
    return { paidOut, collectedIn, txns, avgTxn: txns === 0 ? 0 : (paidOut + collectedIn) / txns };
  }, [rows]);
  const activeCount = (usersQuery.data?.items ?? []).filter(u => u.status === "ACTIVE").length;
  const isFiltered = kindFilter !== "all" || dateFilter.mode !== "all" || search.trim() !== "";

  if (openRow) {
    return (
      <AccountantMemberPage
        recorderId={openRow.key}
        user={openRow.user}
        displayName={openRow.name}
        onBack={() => backToList(() => setOpenRow(null))}
      />
    );
  }

  const columns: ColumnDef<DirectoryRow>[] = [
    {
      id: "name",
      header: "Accountant",
      accessor: r => r.name,
      priority: 1,
      sortable: true,
      cell: (_v, r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: r.user ? "var(--text-brand)" : "var(--text-tertiary)" }}
          >
            {r.user ? initialsOf(r.user) : "—"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {r.name}
            </div>
            <div className="truncate font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {r.empId}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "paidOut",
      header: "Paid out",
      accessor: r => r.totals.paidOut,
      type: "currency",
      priority: 1,
      sortable: true,
      cell: (_v, r) =>
        r.totals.paidOut > 0 ? (
          <DirectionAmount amount={r.totals.paidOut} direction="OUT" />
        ) : (
          <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>—</span>
        ),
    },
    {
      id: "collectedIn",
      header: "Collected in",
      accessor: r => r.totals.collectedIn,
      type: "currency",
      priority: 2,
      sortable: true,
      cell: (_v, r) =>
        r.totals.collectedIn > 0 ? (
          <DirectionAmount amount={r.totals.collectedIn} direction="IN" />
        ) : (
          <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>—</span>
        ),
    },
    {
      id: "txns",
      header: "Entries",
      accessor: r => r.totals.txns,
      type: "number",
      priority: 2,
      sortable: true,
      // Entries are exact for the period. Portal actions are not: the action
      // log endpoint caps pageSize at 200, so that second line is a recent
      // window across all accountant areas, and is labelled "recent" to match.
      headerTooltip: "Money entries for the selected period. Portal actions are counted from the 200 most recent across all accountant areas.",
      cell: (_v, r) => (
        <div className="min-w-0">
          <div className="text-[12px]" style={{ color: r.totals.txns ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
            {r.totals.txns === 0 ? "None" : `${r.totals.txns} entr${r.totals.txns === 1 ? "y" : "ies"}`}
          </div>
          {/* Portal actions sit beside the money count on purpose: an
              accountant busy in the portal but moving nothing, or moving a
              lot with barely a trace, is exactly what oversight looks for. */}
          {r.user && (
            <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              {r.actionCount === 0
                ? "No recent portal activity"
                : `${r.actionCount} recent portal action${r.actionCount === 1 ? "" : "s"}`}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "sparkline",
      header: "Last 14 days",
      accessor: r => r.sparkline.reduce((sum, d) => sum + d.out + d.in, 0),
      priority: 3,
      sortable: true,
      cell: (_v, r) => <VolumeSparkline series={r.sparkline} />,
    },
    {
      id: "lastActivity",
      header: "Last entry",
      accessor: r => r.totals.lastActivity ?? "",
      priority: 3,
      sortable: true,
      cell: (_v, r) => (
        <span className="whitespace-nowrap text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {formatWhen(r.totals.lastActivity)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: r => r.user?.status ?? "—",
      priority: 3,
      cell: (_v, r) =>
        r.user ? (
          <span
            className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={
              r.user.status === "ACTIVE"
                ? { color: "#1E6640", background: "rgba(30,102,64,0.10)" }
                : { color: "var(--text-tertiary)", background: "rgba(0,0,0,0.05)" }
            }
          >
            {r.user.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        ) : (
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Historic</span>
        ),
    },
    {
      id: "open",
      header: "",
      accessor: () => null,
      type: "actions",
      cell: () => <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />,
    },
  ];

  const isLoading = usersQuery.isLoading || summaryQuery.isLoading;
  const isError = usersQuery.isError || summaryQuery.isError;

  return (
    <PageShell>
      {/* Hero Banner Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div
          className="px-4 md:px-7 xl:px-12 flex-col xl:flex-row"
          style={{ position: "relative", zIndex: 2, paddingTop: 44, paddingBottom: 76, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Since 1999 · {SCOPE.label} Directory &amp; Oversight
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
                {SCOPE.label}
              </h1>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 4.5vw, 32px)", fontStyle: "italic", color: "#C89B47", fontWeight: 400 }}>
                &amp; Money Oversight
              </span>
            </div>
            <p className="max-w-[640px]" style={{ fontFamily: "var(--font-ui, sans-serif)", fontWeight: 400, fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
              {SCOPE.blurb}
            </p>
          </div>
        </div>
      </header>

      {/* Stats strip — every figure below reflects the period selected in the toolbar. */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[62px]" style={{ position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard
          stats={[
            {
              label: "PAID OUT",
              value: <MoneyText amount={overall.paidOut} compact />,
              icon: <TrendingUp size={20} color="#FCA5A5" />,
              sub: "Weavers, vendors & suppliers",
              highlight: true,
            },
            {
              label: "COLLECTED IN",
              value: <MoneyText amount={overall.collectedIn} compact />,
              icon: <TrendingDown size={20} color="#6EE7B7" />,
              sub: "Retail counter sales",
            },
            {
              label: "ENTRIES",
              value: String(overall.txns),
              icon: <Receipt size={20} color="rgba(245,232,208,0.90)" />,
              sub: overall.txns ? `Avg ${money(overall.avgTxn, { compact: true })}` : "Nothing in this period",
            },
            {
              label: "ACCOUNTANTS",
              value: String(activeCount),
              icon: <Users size={20} color="rgba(245,232,208,0.90)" />,
              sub: `${(usersQuery.data?.items ?? []).length} on record`,
            },
          ]}
        />
      </div>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 26, paddingBottom: 56 }}>
        <PageShell.Toolbar>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accountants by name, ID or mobile…"
            iconLeft={Search}
            className="w-full md:max-w-[340px]"
          />
          <div className="w-full sm:w-[220px]">
            <Select
              size="sm"
              className="w-full"
              value={kindFilter}
              onValueChange={v => setKindFilter(v as "all" | StaffLedgerKind)}
            >
              <SelectItem value="all">All money types</SelectItem>
              {KIND_ORDER.map(kind => (
                <SelectItem key={kind} value={kind}>
                  {KIND_CONFIG[kind].label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </PageShell.Toolbar>

        <PageShell.Content>
          {isLoading ? (
            <LoadingState variant="skeleton" rows={5} />
          ) : isError ? (
            <ErrorState
              error={usersQuery.error ?? summaryQuery.error}
              onRetry={() => {
                void usersQuery.refetch();
                void summaryQuery.refetch();
              }}
            />
          ) : visibleRows.length === 0 ? (
            <EmptyState
              icon="employee"
              title={search ? "No accountants match that search" : "No accountants yet"}
              description={
                search
                  ? "Try a different name, employee ID or mobile number."
                  : "Users created with the Accountant role will appear here."
              }
            />
          ) : (
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}
            >
              <DataTable
                columns={columns}
                data={visibleRows}
                getRowId={r => r.key}
                onRowClick={r => openDetail(() => setOpenRow(r))}
                responsive
                pagination
                pageSize={10}
                itemLabel="accountants"
                isFiltered={isFiltered}
                onClearFilters={() => {
                  setSearch("");
                  setKindFilter("all");
                  setDateFilter(DEFAULT_DATE_FILTER);
                }}
              />
            </div>
          )}
        </PageShell.Content>
      </div>
    </PageShell>
  );
}
