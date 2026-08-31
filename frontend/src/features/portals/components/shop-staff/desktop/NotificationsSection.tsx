/**
 * Shop Staff → Notifications (tablet + desktop, and reused on mobile).
 * ═══════════════════════════════════════════════════════════════════════════
 * Same three-band shape as every other shop page:
 *   1. Hero + stats strip  — PageHero / PortalStatsStrip, like Reports.
 *   2. Controls            — search, category select, read-state tabs and the
 *                            app-wide DateFilterBar in one toolbar card.
 *   3. Records             — notification cards + the shared Pagination.
 */
import React from "react";
import { BellRing, CheckCheck, Inbox, RotateCcw, Clock } from "lucide-react";
import { C, F, PageHero, PortalStatsStrip, type PortalStat } from "../theme";
import { Button, SearchInput, Select, SelectItem, StatusPill } from "../../../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../../../shared/ui/state";
import { RoyalSubTabStrip } from "../../../../../shared/ui/RoyalSubTabStrip";
import { DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../../../shared/ui/DataPagination";
import {
  CATEGORY_ACCENT, CATEGORY_ICON, CATEGORY_LABELS, CATEGORY_TONE, useShopNotifications,
  type NotifCategory, type ShopNotification,
} from "../notificationsModel";

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 20,
  border: "1px solid rgba(110,15,45,0.14)",
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 8px 24px rgba(74,6,27,0.05)",
};

function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** One notification, rendered as a card with a category rail. */
function NotificationCard({ n, onOpen, compact }: { n: ShopNotification; onOpen: () => void; compact: boolean }) {
  const Icon = CATEGORY_ICON[n.category];
  const accent = CATEGORY_ACCENT[n.category];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...CARD,
        display: "grid",
        gridTemplateColumns: compact ? "auto minmax(0, 1fr)" : "auto minmax(0, 1fr) auto",
        gap: compact ? 12 : 16,
        alignItems: compact ? "flex-start" : "center",
        padding: compact ? "14px 16px" : "18px 22px",
        cursor: "pointer",
        borderLeft: `4px solid ${n.unread ? accent : "rgba(110,15,45,0.10)"}`,
        background: n.unread ? "linear-gradient(90deg, rgba(200,155,71,0.055) 0%, #FFFFFF 42%)" : "#FFFFFF",
        transform: hover ? "translateY(-1px)" : "none",
        boxShadow: hover
          ? "0 2px 4px rgba(74,6,27,0.05), 0 14px 32px rgba(74,6,27,0.10)"
          : "0 1px 2px rgba(74,6,27,0.03), 0 8px 24px rgba(74,6,27,0.05)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      <div style={{
        width: compact ? 38 : 44, height: compact ? 38 : 44, borderRadius: 13, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${accent}14`, border: `1px solid ${accent}2E`,
      }}>
        <Icon size={compact ? 18 : 20} color={accent} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontFamily: F.u, fontSize: compact ? 14 : 15, fontWeight: 700, color: C.text, minWidth: 0, overflowWrap: "anywhere" }}>{n.title}</span>
          <StatusPill tone={CATEGORY_TONE[n.category]} size="sm" label={CATEGORY_LABELS[n.category]} className="gap-1.5" />
          {n.unread && <StatusPill tone="info" size="sm" label="New" className="gap-1.5" />}
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.55, overflowWrap: "anywhere" }}>{n.desc}</div>
        {compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontFamily: F.m, fontSize: 12, color: C.muted }}>
            <Clock size={13} color={C.muted} /> {n.time}
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 600, color: C.text }}>{n.time}</div>
          <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 3 }}>{absoluteTime(n.createdAt)}</div>
        </div>
      )}
    </div>
  );
}

type ReadTab = "all" | "unread" | "read";

export function NotificationsSection({ isTablet, compact = false }: {
  bp?: "tablet" | "desktop";
  isTablet: boolean;
  /** Mobile layout — single column, no absolute timestamps, tighter gutters. */
  compact?: boolean;
}) {
  const { notifications, unreadCount, loading, error, refetch, markRead, markAllRead } = useShopNotifications();

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<"all" | NotifCategory>("all");
  const [tab, setTab] = React.useState<ReadTab>("all");
  const [dateFilter, setDateFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const isFiltered = search.trim() !== "" || category !== "all" || tab !== "all" || dateFilter.mode !== "all";

  const clearFilters = () => {
    setSearch(""); setCategory("all"); setTab("all"); setDateFilter(DEFAULT_DATE_FILTER);
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return notifications.filter(n => {
      if (tab === "unread" && !n.unread) return false;
      if (tab === "read" && n.unread) return false;
      if (category !== "all" && n.category !== category) return false;
      if (!matchesDateFilter(n.createdAt, dateFilter)) return false;
      if (q && !(`${n.title} ${n.desc} ${CATEGORY_LABELS[n.category]}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [notifications, tab, category, dateFilter, search]);

  const pg = usePagination(filtered, 10);

  const todayCount = React.useMemo(() => {
    const today = new Date().toDateString();
    return notifications.filter(n => new Date(n.createdAt).toDateString() === today).length;
  }, [notifications]);

  const stats: PortalStat[] = [
    { label: "Unread", value: unreadCount, sub: "Needs your attention", icon: BellRing, highlight: true, alert: unreadCount > 0 },
    { label: "Today", value: todayCount, sub: "Arrived today", icon: Clock },
    { label: "Returns", value: notifications.filter(n => n.category === "return").length, sub: "Return activity", icon: RotateCcw },
    { label: "All notifications", value: notifications.length, sub: "In your feed", icon: Inbox },
  ];

  const tabs = [
    { key: "all" as const, label: `All (${notifications.length})`, icon: <Inbox size={16} /> },
    { key: "unread" as const, label: `Unread (${unreadCount})`, icon: <BellRing size={16} /> },
    { key: "read" as const, label: `Read (${notifications.length - unreadCount})`, icon: <CheckCheck size={16} /> },
  ];

  return (
    <>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Notifications"
        titleAccent="& Alerts"
        description="Every sale, return, stock alert and store message raised for this shop — filter by type, date or read state."
      />
      <PortalStatsStrip stats={stats} />

      <div id="shop-notifications-list" style={{ padding: compact ? "20px 16px 40px" : isTablet ? "24px 28px 48px" : "36px 48px 64px", display: "flex", flexDirection: "column", gap: compact ? 18 : 24 }}>
        {/* ── 1. Controls ─────────────────────────────────────────────── */}
        <section style={{ ...CARD, padding: compact ? "16px" : isTablet ? "18px 20px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
            <SearchInput
              aria-label="Search notifications"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications..."
              containerClassName={compact ? "w-full" : "w-full sm:w-[280px]"}
            />
            <Select
              value={category}
              onValueChange={v => setCategory(v as "all" | NotifCategory)}
              placeholder="All types"
              containerClassName={compact ? "w-full" : "w-[190px]"}
            >
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(CATEGORY_LABELS) as NotifCategory[]).map(k => (
                <SelectItem key={k} value={k}>{CATEGORY_LABELS[k]}</SelectItem>
              ))}
            </Select>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted }}>Timeline</span>
              <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: compact ? undefined : "auto", flexWrap: "wrap" }}>
              {isFiltered && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-[12px] text-[#6E0F2D]">
                  Clear filters
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="rounded-[14px] border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold gap-2 disabled:opacity-50"
              >
                <CheckCheck size={16} /> Mark all read
              </Button>
            </div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
            Showing <strong style={{ color: C.text }}>{filtered.length}</strong> of {notifications.length} notification{notifications.length === 1 ? "" : "s"}
            {unreadCount > 0 && <> · <strong style={{ color: C.text }}>{unreadCount}</strong> unread</>}
          </div>
        </section>

        {/* ── 2. Read-state tabs ──────────────────────────────────────── */}
        <RoyalSubTabStrip tabs={tabs} activeTab={tab} onTabChange={k => setTab(k as ReadTab)} className="mb-0" />

        {/* ── 3. Records ──────────────────────────────────────────────── */}
        {loading ? (
          <LoadingState variant="skeleton" rows={5} />
        ) : error ? (
          <ErrorState error={undefined} onRetry={refetch} />
        ) : notifications.length === 0 ? (
          <div style={{ ...CARD, padding: "12px" }}>
            <EmptyState
              icon="info"
              title="No notifications yet"
              description="Sales, returns and stock alerts for this shop will appear here as they happen."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...CARD, padding: "12px" }}>
            <FilteredEmptyState onClearFilters={clearFilters} />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 14 }}>
              {pg.pageItems.map(n => (
                <NotificationCard key={n.id} n={n} compact={compact} onOpen={() => markRead(n)} />
              ))}
            </div>
            <Pagination
              page={pg.page}
              pageCount={pg.pageCount}
              total={pg.total}
              pageSize={pg.pageSize}
              start={pg.start}
              onPageChange={pg.setPage}
              onPageSizeChange={pg.setPageSize}
              itemLabel="notifications"
              targetId="shop-notifications-list"
            />
          </>
        )}
      </div>
    </>
  );
}
