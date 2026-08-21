import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { ArrowRight, Check, Inbox } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { UnifiedNotif, Priority, T, F, PRIORITY, CATEGORIES } from "./notifTypes";
import { NotificationStatStrip } from "./NotificationStatStrip";
import { NotificationDetailPanel } from "./NotificationDetailPanel";
import { SectionCard } from "./common/primitives";
import { BackendNotification, connectNotificationsSocket, notificationsApi } from "../../../shared/api/notifications";
import { useAuth, Role } from "../../../contexts/AuthContext";
import { rupees, formatMoney } from "@/lib/domain/money";

const ROLE_TO_BACKEND: Record<Role, string> = {
  admin: "ADMIN",
  superadmin: "SUPERADMIN",
  worker: "WORKER",
  weaver: "WEAVER",
  shop: "SHOP",
  accountant: "ACCOUNTANT",
};

// Backend Notification rows only carry a `type` string + free-form JSON
// payload (no title/body/priority/category) — this table is the only place
// that turns a real backend event into the rich display shape below. Only
// "invoice_overdue" (from the Day-45 overdue-payment job) is emitted by any
// backend module today; unknown types fall back to a generic info card so
// new notification types never disappear silently.
const TYPE_CONFIG: Record<string, {
  category: UnifiedNotif["category"];
  priority: Priority;
  title: (payload: Record<string, unknown>) => string;
  body: (payload: Record<string, unknown>) => string;
}> = {
  invoice_overdue: {
    category: "payment",
    priority: "critical",
    title: p => `Invoice Overdue${p.invoiceNumber ? ` — ${String(p.invoiceNumber)}` : ""}`,
    body: p => `Outstanding amount ${formatMoney(rupees(Number(p.outstandingAmount ?? 0)))} is more than 45 days overdue.`,
  },
};

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function toUnifiedNotif(n: BackendNotification): UnifiedNotif {
  const cfg = TYPE_CONFIG[n.type];
  const payload = n.payload ?? {};
  return {
    id: n.id,
    priority: cfg?.priority ?? "info",
    category: cfg?.category ?? "payment",
    title: cfg ? cfg.title(payload) : n.type,
    body: cfg ? cfg.body(payload) : JSON.stringify(payload),
    time: formatRelativeTime(n.createdAt),
    read: n.readAt !== null,
  };
}



function relativeTimeToDate(time: string): string {
  const now = new Date();
  if (time === "Just now") return now.toISOString();
  let m = time.match(/^(\d+)\s*min ago$/);
  if (m) return new Date(now.getTime() - parseInt(m[1], 10) * 60000).toISOString();
  m = time.match(/^(\d+)h ago$/);
  if (m) return new Date(now.getTime() - parseInt(m[1], 10) * 3600000).toISOString();
  m = time.match(/^(\d+)\s*days? ago$/);
  if (m) return new Date(now.getTime() - parseInt(m[1], 10) * 86400000).toISOString();
  if (time === "Yesterday") return new Date(now.getTime() - 86400000).toISOString();
  m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (m[3] === "PM") h += 12;
    const d = new Date(now);
    d.setHours(h, parseInt(m[2], 10), 0, 0);
    return d.toISOString();
  }
  return now.toISOString();
}

const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
};

type Filter = "all" | Priority;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",      label: "All Priorities" },
  { key: "critical", label: "Critical Only" },
  { key: "warning",  label: "Warning Only" },
  { key: "success",  label: "Success Only" },
  { key: "info",     label: "Info Only" },
];

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
    >
      {children}
    </motion.div>
  );
}

export function NotificationsPage() {
  const { role } = useAuth();
  const backendRole = role ? ROLE_TO_BACKEND[role] : undefined;

  const [notifications, setNotifications] = useState<UnifiedNotif[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filter, setFilter]                 = useState<Filter>("all");
  const [selected, setSelected]             = useState<UnifiedNotif | null>(null);
  const [dateFilter, setDateFilter]         = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [isLoading, setIsLoading]           = useState(true);
  const [isError, setIsError]               = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    notificationsApi.list({ role: backendRole }).then(res => {
      setNotifications(res.items.map(toUnifiedNotif));
    }).catch(() => {
      setNotifications([]);
      setIsError(true);
    }).finally(() => setIsLoading(false));
  }, [backendRole]);

  // Live push — backend gateway emits to `role:<ROLE>` rooms (no per-user
  // auth yet, so we can only reliably subscribe by role).
  useEffect(() => {
    if (!backendRole) return;
    const socket = connectNotificationsSocket({ role: backendRole });
    socket.on("notification", (raw: BackendNotification) => {
      setNotifications(prev => prev.some(n => n.id === raw.id) ? prev : [toUnifiedNotif(raw), ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [backendRole]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setSelected(prev => prev && prev.id === id ? { ...prev, read: true } : prev);
    notificationsApi.markRead(id).catch(() => {
      // Real backend state didn't change — revert the optimistic update.
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    });
  }, []);

  // NOTE: the backend has no "mark unread" endpoint (Notification.readAt is
  // a one-way timestamp) — toggling back to unread is local-UI-only and
  // doesn't persist across a refresh.
  const toggleRead = (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target && !target.read) { markRead(id); return; }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const markAllRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    unreadIds.forEach(id => { notificationsApi.markRead(id).catch(() => {}); });
  };

  const categoryFiltered = activeCategory === "all" ? notifications : notifications.filter(n => n.category === activeCategory);
  const priorityFiltered = filter === "all" ? categoryFiltered : categoryFiltered.filter(n => n.priority === filter);
  const filtered = priorityFiltered.filter(n => matchesDateFilter(relativeTimeToDate(n.time), dateFilter));
  
  const unread   = notifications.filter(n => !n.read).length;
  const countByPriority = (p: Priority) => notifications.filter(n => n.priority === p).length;

  const getDateGroup = (time: string): string => {
    if (time.includes("now") || time.includes("min ago") || time.includes("h ago") || time.includes("AM") || time.includes("PM")) {
      return "Today";
    }
    if (time.includes("Yesterday")) {
      return "Yesterday";
    }
    return "Older Alerts";
  };

  const grouped: Record<string, UnifiedNotif[]> = {};
  filtered.forEach(n => {
    const grp = getDateGroup(n.time);
    if (!grouped[grp]) grouped[grp] = [];
    grouped[grp].push(n);
  });

  return (
    <div style={{ minHeight: "calc(100dvh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* HEADER */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 280, display: "flex", alignItems: "center" }}>
        <div className="px-3 sm:px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 36, paddingBottom: 90 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · NOTIFICATIONS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
              Notifications
            </h1>
            {unread > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: T.antiqueGold, color: T.deepWine, fontFamily: F.ui, fontWeight: 700, fontSize: 12, borderRadius: 999, padding: "2px 10px" }}>
                {unread} new
              </span>
            )}
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "clamp(13px, 2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 600, lineHeight: 1.5, wordBreak: "break-word" }}>
            Live operational alerts, stock updates, payment reminders, and production activity.
          </p>
          {unread > 0 && (
            <div className="mt-3">
              <Button variant="secondary" size="md" iconLeft={Check} onClick={markAllRead}>
                Mark all read
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* FLOATING STAT STRIP */}
      <NotificationStatStrip notifications={notifications} unread={unread} countByPriority={countByPriority} />

      {/* CATEGORIES TAB BUTTONS */}
      <div className="px-3 sm:px-4 md:px-7 xl:px-14" style={{ marginTop: 28 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => {
            const active = activeCategory === c.key;
            const count = c.key === "all" ? notifications.length : notifications.filter(n => n.category === c.key).length;
            const unreadCount = c.key === "all" ? notifications.filter(n => !n.read).length : notifications.filter(n => n.category === c.key && !n.read).length;

            return (
              <Button
                key={c.key}
                variant={active ? "primary" : "secondary"}
                size="md"
                onClick={() => { setActiveCategory(c.key); setSelected(null); }}
              >
                <c.Icon size={15} color={active ? "#FFF" : c.color} />
                <span>{c.label}</span>
                <span style={{
                  fontFamily: F.ui,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.20)" : "rgba(110,15,45,0.07)",
                  color: active ? "#FFF" : T.royalBurgundy
                }}>
                  {count}
                </span>
                {unreadCount > 0 && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? T.goldLight : T.royalBurgundy }} />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* PRIORITY FILTER BAR */}
      <div className="px-3 sm:px-4 md:px-7 xl:px-14" style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, position: "relative", zIndex: 10, marginTop: 20, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0, height: 52, minWidth: "max-content" }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const count = f.key === "all" ? categoryFiltered.length : categoryFiltered.filter(n => n.priority === f.key).length;
            const cfg = f.key !== "all" ? PRIORITY[f.key] : null;
            return (
              <div key={f.key} style={{ height: "100%", borderBottom: active ? `2px solid ${T.royalBurgundy}` : "2px solid transparent" }}>
                <Button variant="tertiary" size="md" className="h-full rounded-none px-2.5 sm:px-4" onClick={() => setFilter(f.key)}>
                  {cfg && <cfg.Icon size={14} color={active ? T.royalBurgundy : cfg.color} />}
                  <span style={{ fontFamily: F.ui, fontWeight: active ? 600 : 400, fontSize: 12, color: active ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap" }}>
                    {f.label}
                  </span>
                  <span style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: active ? `rgba(110,15,45,0.08)` : "rgba(139,112,96,0.08)", color: active ? T.royalBurgundy : T.taupe }}>
                    {count}
                  </span>
                </Button>
              </div>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingLeft: 12 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="px-3 sm:px-4 md:px-7 xl:px-14 flex flex-col lg:flex-row gap-6 md:gap-7 items-start" style={{ paddingTop: 28, paddingBottom: 80 }}>
        {/* Left list */}
        <div className="w-full flex-1 min-w-0">
        <SectionCard
          icon={Inbox}
          title="Notification Feed"
          subtitle="Live operational alerts, stock updates, payment reminders, and production activity."
        >
          <div style={{ marginBottom: 16 }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
          {["Today", "Yesterday", "Older Alerts"].map(dateGroup => {
            const items = grouped[dateGroup] || [];
            if (items.length === 0) return null;

            return (
              <div key={dateGroup} style={{ marginBottom: 32 }}>
                <FadeUp>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: G.gold, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 18, color: T.luxuryBrown, letterSpacing: "-0.2px" }}>{dateGroup}</span>
                    <div style={{ flex: 1, height: 1, background: T.borderDef, marginLeft: 4 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>
                </FadeUp>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map((n, i) => {
                    const cfg = PRIORITY[n.priority];
                    const isRead = n.read;
                    const isSelected = selected?.id === n.id;
                    const PriorityIcon = cfg.Icon;
                    const catCfg = CATEGORIES.find(c => c.key === n.category)!;
                    const CatIcon = catCfg.Icon;

                    return (
                      <FadeUp key={n.id} delay={i * 0.05}>
                        <motion.div
                          onClick={() => { setSelected(isSelected ? null : n); markRead(n.id); }}
                          whileHover={{ y: -2, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.14)" : "0 8px 32px rgba(110,15,45,0.10)" }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          style={{
                            background: isSelected ? "#FFFDF9" : T.warmIvory,
                            borderRadius: 16,
                            border: isSelected ? `1.5px solid ${T.royalBurgundy}` : `1.5px solid ${isRead ? T.borderDef : cfg.border}`,
                            boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.12)" : "0 2px 14px rgba(110,15,45,0.05)",
                            cursor: "pointer",
                            overflow: "hidden",
                            position: "relative",
                          }}>
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`, opacity: isRead ? 0.4 : 1 }} />

                          <div className="p-3 sm:p-5 md:p-6">
                            <div className="flex items-start gap-2.5 sm:gap-4.5">
                              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                <PriorityIcon size={18} color={cfg.color} className="sm:w-5 sm:h-5" />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                  {!isRead && (
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                                  )}
                                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.3, flex: 1, opacity: isRead ? 0.8 : 1, minWidth: 0, wordBreak: "break-word" }}>
                                    {n.title}
                                  </span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>
                                    <PriorityIcon size={10} /> {cfg.label}
                                  </span>
                                </div>

                                <p style={{
                                  fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, lineHeight: 1.6, margin: "0 0 10px",
                                  display: selected ? "block" : "-webkit-box",
                                  WebkitLineClamp: selected ? undefined : 2,
                                  WebkitBoxOrient: selected ? undefined : "vertical" as const,
                                  overflow: selected ? "visible" : "hidden",
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}>
                                  {n.body}
                                </p>

                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: catCfg.color, background: `${catCfg.color}14`, border: `1px solid ${catCfg.color}2A`, borderRadius: 999, padding: "2px 8px" }}>
                                    <CatIcon size={10} /> {catCfg.label}
                                  </span>

                                  <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{n.time}</span>

                                  {n.action && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      iconRight={ArrowRight}
                                      className="ml-auto text-xs"
                                      onClick={e => { e.stopPropagation(); markRead(n.id); }}>
                                      {n.action}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <IconButton
                                icon={Check}
                                label={isRead ? "Mark unread" : "Mark read"}
                                variant="secondary"
                                size="sm"
                                className="rounded-full mt-0.5 shrink-0"
                                onClick={e => { e.stopPropagation(); toggleRead(n.id); }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </FadeUp>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ textAlign: "center", padding: "80px 40px", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
              Loading notifications…
            </div>
          )}

          {!isLoading && isError && (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Inbox size={28} color="#C0392B" />
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#C0392B", marginBottom: 8 }}>Failed to load notifications</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Please try refreshing the page.</div>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Inbox size={28} color={T.taupe} />
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 8 }}>No notifications</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No notifications match the current filter.</div>
            </div>
          )}
        </SectionCard>
        </div>

        {/* Right detail panel */}
        <AnimatePresence>
          {selected && (
            <NotificationDetailPanel selected={selected} setSelected={setSelected} markRead={markRead} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
