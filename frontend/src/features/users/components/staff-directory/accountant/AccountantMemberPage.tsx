import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  Activity,
  ChevronLeft,
  IndianRupee,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageShell } from "@/shared/ui/PageShell";
import { Button, Input, Select, SelectItem } from "@/shared/ui/primitives";
import { DataTable, ChartFigure, type ColumnDef } from "@/shared/ui/data";
import { RoyalSubTabStrip, type SubTabItem } from "@/shared/ui/RoyalSubTabStrip";
import {
  DateFilterBar,
  DEFAULT_DATE_FILTER,
  type DateFilterState,
} from "@/shared/ui/DateFilterBar";
import { ErrorState, LoadingState, EmptyState } from "@/shared/ui/state";
import { useAuthGate } from "@/contexts/AuthContext";
import type { BackendUser } from "@/shared/api/users";
import {
  staffFinanceApi,
  type StaffLedgerKind,
  type StaffLedgerRow,
} from "@/shared/api/staff-finance";
import { ACCOUNTANT_SCOPE } from "../portalScopes";
import { StaffActivityLog } from "../StaffMemberHistoryPage";
import {
  KIND_CONFIG,
  KIND_ORDER,
  dailySeries,
  dateFilterToRange,
  emptyTotals,
  matchesLedgerSearch,
  summarise,
} from "./ledger";
import {
  DirectionAmount,
  IN_COLOR,
  KindBadge,
  MoneyText,
  OUT_COLOR,
  PanelCard,
  PanelHeader,
  useMoneyFormatter,
} from "./primitives";

const SCOPE = ACCOUNTANT_SCOPE;

type TabKey = "overview" | "ledger" | "activity";

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** One headline figure. Deliberately plain — the dark hero strip above
 *  already carries the page's visual weight. */
function StatTile({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(110,15,45,0.06)", color: accent ?? "var(--text-brand)" }}
        >
          {icon}
        </span>
        <span
          className="text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-3 text-[24px] font-bold leading-tight md:text-[28px]"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * One accountant's money and activity.
 *
 * Three tabs rather than one long page: what they moved (Overview), every
 * individual movement (Money ledger), and the portal audit trail (Activity)
 * — the same audit table the Worker and Shop directories show, reused rather
 * than reimplemented.
 *
 * `user` is null for the "Unattributed" bucket, which has money but no
 * person and therefore no activity log.
 */
export function AccountantMemberPage({
  recorderId,
  user,
  displayName,
  onBack,
}: {
  recorderId: string;
  user: BackendUser | null;
  displayName: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | StaffLedgerKind>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const enabled = useAuthGate("admin", "superadmin");
  const { money: fmtMoney, visible: moneyVisible } = useMoneyFormatter();

  // Period and money type are server parameters; only the free-text search is
  // applied locally, because it is a find-a-row tool rather than a filter the
  // headline figures should follow.
  const range = useMemo(() => dateFilterToRange(dateFilter), [dateFilter]);
  const scope = useMemo(
    () => ({
      recordedById: recorderId,
      ...(kindFilter === "all" ? {} : { kind: kindFilter }),
      ...range,
    }),
    [recorderId, kindFilter, range]
  );
  const scopeKey = [recorderId, kindFilter, range.from ?? "", range.to ?? ""];

  const summaryQuery = useQuery({
    queryKey: ["accountant-staff-summary", ...scopeKey],
    queryFn: () => staffFinanceApi.summary(scope),
    enabled,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["accountant-staff-ledger", ...scopeKey],
    queryFn: () => staffFinanceApi.ledger({ ...scope, limit: 2000 }),
    enabled,
  });

  const allRows = useMemo(() => data?.items ?? [], [data]);
  const rows = useMemo(
    () => allRows.filter((row: StaffLedgerRow) => matchesLedgerSearch(row, search)),
    [allRows, search]
  );

  // Aggregated in the database over the whole period — never clipped by the
  // ledger's row cap, unlike a reduction over `rows` would be.
  const totals = useMemo(() => {
    const entry = summaryQuery.data?.items?.[0];
    if (!entry) return emptyTotals();
    const { recordedById: _ignored, ...rest } = entry;
    return rest;
  }, [summaryQuery.data]);

  /** What the table itself currently shows — only ever used while searching. */
  const shownTotals = useMemo(() => summarise(rows), [rows]);
  const searching = search.trim() !== "";
  // Built from `allRows`, not the search-filtered `rows`: the search box lives
  // on the Ledger tab only, so a chart that honoured it would sit on the
  // Overview tab silently filtered by a control the reader cannot see.
  const chartData = useMemo(
    () =>
      dailySeries(allRows, 30, totals.lastActivity).map(d => ({
        day: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        out: d.out,
        in: d.in,
      })),
    [allRows, totals.lastActivity]
  );

  const isFiltered = kindFilter !== "all" || dateFilter.mode !== "all" || search.trim() !== "";
  const clearFilters = () => {
    setSearch("");
    setKindFilter("all");
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  const tabs: SubTabItem<TabKey>[] = [
    { key: "overview", label: "Overview", icon: <TrendingUp size={15} /> },
    { key: "ledger", label: "Money Ledger", icon: <Receipt size={15} /> },
    ...(user
      ? [{ key: "activity" as TabKey, label: "Activity Log", icon: <Activity size={15} /> }]
      : []),
  ];

  const columns: ColumnDef<StaffLedgerRow>[] = [
    {
      id: "date",
      header: "Date",
      accessor: r => r.date,
      priority: 1,
      sortable: true,
      cell: (_v, r) => (
        <span
          className="whitespace-nowrap font-mono text-[12px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatDay(r.date)}
        </span>
      ),
    },
    {
      id: "kind",
      header: "Type",
      accessor: r => KIND_CONFIG[r.kind].label,
      priority: 2,
      sortable: true,
      // SaleRecord is one row per saree with its own reference, and there is
      // no bill id in the schema to group them by — so a three-saree counter
      // sale is genuinely three entries here, and the header says so rather
      // than letting the count read as three separate customers.
      headerTooltip: "Retail collections are recorded per saree, so one counter sale can be several entries.",
      cell: (_v, r) => <KindBadge kind={r.kind} />,
    },
    {
      id: "party",
      header: "Party",
      accessor: r => r.partyName ?? "",
      priority: 1,
      sortable: true,
      cell: (_v, r) => (
        <div className="min-w-0">
          <div
            className="truncate text-[13px]"
            style={{ color: r.partyName ? "var(--text-primary)" : "var(--text-tertiary)" }}
          >
            {r.partyName ?? "Unknown"}
          </div>
          <div className="truncate font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {r.partyCode ?? KIND_CONFIG[r.kind].partyLabel}
          </div>
        </div>
      ),
    },
    {
      id: "reference",
      header: "Reference",
      accessor: r => r.reference ?? "",
      priority: 3,
      cell: (_v, r) => (
        <div className="min-w-0">
          <div
            className="truncate font-mono text-[12px]"
            style={{ color: r.reference ? "var(--text-secondary)" : "var(--text-tertiary)" }}
          >
            {r.reference ?? "—"}
          </div>
          {r.method && (
            <div
              className="truncate text-[11px] capitalize"
              style={{ color: "var(--text-tertiary)" }}
            >
              {r.method}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "firm",
      header: "Firm",
      accessor: r => r.firmName ?? "",
      priority: 3,
      cell: (_v, r) => (
        <span
          className="truncate text-[12px]"
          style={{ color: r.firmName ? "var(--text-secondary)" : "var(--text-tertiary)" }}
        >
          {r.firmName ?? "—"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      accessor: r => r.amount,
      type: "currency",
      priority: 1,
      sortable: true,
      cell: (_v, r) => <DirectionAmount amount={r.amount} direction={r.direction} />,
    },
  ];

  const money = (
    <>
      <PageShell.Toolbar>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by party, UTR, method or firm…"
          iconLeft={Search}
          className="w-full md:max-w-[320px]"
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

      <PanelCard>
        <PanelHeader
          title="Money ledger"
          sub={
            searching
              ? `${shownTotals.txns} of ${totals.txns} entries match “${search.trim()}” · ${fmtMoney(shownTotals.paidOut)} paid out · ${fmtMoney(shownTotals.collectedIn)} collected in`
              : totals.txns === 0
                ? "Nothing in this period."
                : `${totals.txns} entr${totals.txns === 1 ? "y" : "ies"} · ${fmtMoney(totals.paidOut)} paid out · ${fmtMoney(totals.collectedIn)} collected in`
          }
        />
        <DataTable
          columns={columns}
          data={rows}
          getRowId={r => r.id}
          responsive
          density="compact"
          pagination
          pageSize={15}
          itemLabel="entries"
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          emptyTitle="No money recorded"
          emptyDescription={`No payments or retail collections are attributed to ${displayName}.`}
        />
      </PanelCard>
    </>
  );

  const overview = (
    <div className="flex flex-col gap-5">
      <PageShell.Toolbar>
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

      {totals.txns === 0 ? (
        <EmptyState
          icon="payment"
          title="No money in this period"
          description={`No payments or retail collections are attributed to ${displayName} here. Widen the period or the money type above.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Paid out"
              value={<MoneyText amount={totals.paidOut} compact />}
              sub="Weavers, vendors & suppliers"
              icon={<TrendingUp size={17} />}
              accent={OUT_COLOR}
            />
            <StatTile
              label="Collected in"
              value={<MoneyText amount={totals.collectedIn} compact />}
              sub="Retail counter sales"
              icon={<TrendingDown size={17} />}
              accent={IN_COLOR}
            />
            <StatTile
              label="Entries"
              value={String(totals.txns)}
              sub={
                totals.lastActivity
                  ? `Last on ${formatDay(totals.lastActivity)}`
                  : "Nothing recorded"
              }
              icon={<Receipt size={17} />}
            />
            <StatTile
              label="Average entry"
              value={<MoneyText amount={totals.avgTxn} compact />}
              sub="Across both directions"
              icon={<IndianRupee size={17} />}
            />
          </div>

          <PanelCard>
            <PanelHeader
              title="Daily volume"
              sub={
                totals.lastActivity
                  ? `30 days to ${formatDay(totals.lastActivity)}`
                  : "Nothing in this period"
              }
            />
            <div className="p-4 md:p-5">
              {/* The whole chart is a rupee axis, so nothing is left to show
                  once figures are masked — unlike the breakdown below, whose
                  bars are proportions and counts rather than amounts. */}
              {!moneyVisible ? (
                <div className="py-10 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                  Daily volume is hidden for this account.
                </div>
              ) : (
              <ChartFigure
                title="Daily volume"
                summary={`${fmtMoney(totals.paidOut)} paid out and ${fmtMoney(totals.collectedIn)} collected in across ${totals.txns} entries.`}
              >
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(200,155,71,0.18)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={58}
                        tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                        tickFormatter={(v: number) => fmtMoney(v, { compact: true })}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "rgba(200,155,71,0.08)" }}
                        formatter={(v: number, name) => [
                          fmtMoney(v),
                          name === "out" ? "Paid out" : "Collected in",
                        ]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 10,
                          border: "1px solid rgba(200,155,71,0.25)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(name: string) => (name === "out" ? "Paid out" : "Collected in")}
                      />
                      <Bar
                        dataKey="out"
                        name="out"
                        fill={OUT_COLOR}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={18}
                      />
                      <Bar
                        dataKey="in"
                        name="in"
                        fill={IN_COLOR}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartFigure>
              )}
            </div>
          </PanelCard>

          <PanelCard>
            <PanelHeader
              title="Where the money went"
              sub="Split by entry type, within the current filters"
            />
            <div className="flex flex-col gap-3.5 p-4 md:p-5">
              {KIND_ORDER.map(kind => {
                const bucket = totals.byKind[kind];
                const grandTotal = totals.paidOut + totals.collectedIn;
                const share = grandTotal === 0 ? 0 : (bucket.amount / grandTotal) * 100;
                const color = KIND_CONFIG[kind].direction === "OUT" ? OUT_COLOR : IN_COLOR;
                return (
                  <div key={kind}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {KIND_CONFIG[kind].label}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        <MoneyText amount={bucket.amount} />
                        <span style={{ color: "var(--text-tertiary)" }}>
                          {` · ${bucket.count} entr${bucket.count === 1 ? "y" : "ies"} · ${share.toFixed(0)}%`}
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--surface-sunken)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>
        </>
      )}
    </div>
  );

  return (
    <PageShell>
      {/* Hero Banner Header */}
      <header
        style={{
          background: "#0D0207",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="px-4 md:px-7 xl:px-12 flex-col xl:flex-row"
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: 36,
            paddingBottom: 50,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          <div>
            <div style={{ marginBottom: 12 }}>
              <Button
                variant="link"
                size="sm"
                iconLeft={ChevronLeft}
                onClick={onBack}
                className="h-auto p-0 text-[13px] text-[#C89B47] hover:text-[#E8DCC4]"
              >
                Back to {SCOPE.label} Directory
              </Button>
            </div>
            <div
              style={{
                fontFamily: "var(--font-ui, sans-serif)",
                fontSize: "clamp(11px, 1.4vw, 13px)",
                color: "rgba(255,253,249,0.50)",
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Since 1999 · {SCOPE.singular} Money &amp; Activity
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <h1
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(32px, 6vw, 48px)",
                  fontWeight: 400,
                  color: "#FFFDF9",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </h1>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(18px, 3.5vw, 26px)",
                  fontStyle: "italic",
                  color: "#C89B47",
                  fontWeight: 400,
                }}
              >
                {user?.empId ?? "Historic entries"}
              </span>
            </div>
            <p
              className="max-w-[660px]"
              style={{
                fontFamily: "var(--font-ui, sans-serif)",
                fontWeight: 400,
                fontSize: "clamp(13px, 2vw, 15px)",
                color: "rgba(255,253,249,0.70)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {user
                ? `${user.mobile} — every payment and retail collection recorded by this accountant, and everything they have done in the ${SCOPE.label} portal.`
                : "Payments and retail collections recorded before the system captured who entered them. The money is real; the person is not on record."}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 28, paddingBottom: 56 }}>
        <RoyalSubTabStrip tabs={tabs} activeTab={tab} onTabChange={(k: TabKey) => setTab(k)} />

        {data?.truncated && tab === "ledger" && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-[12px]"
            style={{
              borderColor: "rgba(200,155,71,0.34)",
              background: "rgba(200,155,71,0.10)",
              color: "#8B6018",
            }}
          >
            This table lists the most recent 2,000 entries for this period. The figures above cover
            the whole period.
          </div>
        )}

        {tab === "activity" && user ? (
          <StaffActivityLog scope={SCOPE} user={user} />
        ) : isLoading || summaryQuery.isLoading ? (
          <LoadingState variant="skeleton" rows={5} />
        ) : isError || summaryQuery.isError ? (
          <ErrorState
            error={error ?? summaryQuery.error}
            onRetry={() => {
              void refetch();
              void summaryQuery.refetch();
            }}
          />
        ) : tab === "ledger" ? (
          money
        ) : (
          overview
        )}
      </div>
    </PageShell>
  );
}
