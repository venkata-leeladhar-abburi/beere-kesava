// ── Weaver activity feed panel (row 2 of the leaderboard section) ──────────
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, Activity as ActivityIcon } from "lucide-react";
import { BarChart3 as ChartBar } from "lucide-react";
import { T, F } from "../../theme";
import { ACTIVITY_ICONS } from "../../data";
import { auditLogApi } from "../../../../../shared/api/audit-log";
import type { WeaverActivity } from "../../data";
import { FadeUp, SectionCard } from "../../common/primitives";
import { Button } from "../../../../../shared/ui/primitives";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../../../shared/ui/DataPagination";

/** Modules whose action-log entries are genuinely weaver activity. */
const WEAVER_ACTIVITY_MODULES = ["WEAVERS", "WARP_REQUESTS", "QC", "MATERIALS", "BATCHES", "PAYMENTS"];

/** Rough icon/category mapping onto the existing ACTIVITY_ICONS keys. */
function iconForModule(module: string): string {
  if (module === "QC") return "✅";
  if (module === "MATERIALS" || module === "WARP_REQUESTS") return "📦";
  if (module === "PAYMENTS") return "💰";
  return "🔄";
}

export function ActivitiesPanel({ onActivities }: { onActivities: () => void }) {
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // This feed was reading the ACTIVITIES export from ../../data, which is a
  // hardcoded empty array — the panel could only ever render its empty state.
  // Weaver-related entries from the real action log drive it now.
  const { data: actionsRes, isLoading, isError } = useQuery({
    queryKey: ["weaver-activities", WEAVER_ACTIVITY_MODULES],
    queryFn: () => auditLogApi.listActions({ modules: WEAVER_ACTIVITY_MODULES, pageSize: 200 }),
  });

  const activities: WeaverActivity[] = React.useMemo(
    () => (actionsRes?.items ?? []).map(a => ({
      timestamp: a.createdAt,
      // The action log records what already happened; nothing in it is a
      // pending task, so no row claims to need action.
      needsAction: false,
      icon: iconForModule(a.module),
      action: a.action,
      category: a.module.replace(/_/g, " "),
      detail: [a.recordLabel, a.user ? `by ${a.user.firstName} ${a.user.lastName}` : null]
        .filter(Boolean).join(" · ") || "—",
      time: new Date(a.createdAt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
    })),
    [actionsRes],
  );

  const filteredActivities = activities.filter(a => matchesDateFilter(a.date ?? a.timestamp, dateFilter));
  const activitiesNeedingAction = filteredActivities.filter(a => a.needsAction).length;
  const pag = usePagination(filteredActivities, 10);
  return (
      <FadeUp delay={0.12}>
      <SectionCard
        id="weav-activities"
        icon={ActivityIcon}
        title="Weaver Activities"
        subtitle="What's happened, and what's waiting on you"
        actions={
          <>
            {activitiesNeedingAction > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.18)", color: T.goldLight, border: "1px solid rgba(200,155,71,0.40)", borderRadius: 999, padding: "7px 14px", fontFamily: F.ui, fontSize: 13, fontWeight: 700 }}>
                <Bell size={14} /> {activitiesNeedingAction} need{activitiesNeedingAction === 1 ? "s" : ""} your action
              </span>
            )}
            <Button onClick={onActivities} variant="secondary" iconLeft={Bell} className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white hover:border-white/30">
              View All Activities
            </Button>
          </>
        }
      >
        <div style={{ margin: "-24px -28px 0" }} data-pagination-target>
          <div style={{ padding: "18px 32px", borderBottom: `1px solid ${T.borderDef}` }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>

          {/* Activity feed — one row per event, full detail always visible,
              actionable items called out with an amber rail + a way to act on
              them right there rather than needing to guess what to do next. */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {isLoading ? (
              <div style={{ padding: "40px 32px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                Loading weaver activities…
              </div>
            ) : isError ? (
              <div style={{ padding: "40px 32px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
                Couldn't load weaver activities.
              </div>
            ) : filteredActivities.length === 0 ? (
              <div style={{ padding: "40px 32px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                No activities recorded for this period.
              </div>
            ) : pag.pageItems.map((a, i) => {
              const cfg = ACTIVITY_ICONS[a.icon] ?? { PhIcon: ChartBar, bg: "rgba(110,15,45,0.07)", color: T.taupe };
              const PhIcon = cfg.PhIcon as React.ElementType;
              return (
                // WeaverActivity has no id field; timestamp/date + action can still repeat
                // (multiple events logged in the same instant), so the index is kept too.
                <motion.div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${a.date ?? a.timestamp}-${a.action}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ background: "rgba(247,242,234,0.55)" }}
                  style={{
                    padding: "20px 32px",
                    borderBottom: i < pag.pageItems.length - 1 ? `1px solid ${T.borderDef}` : "none",
                    borderLeft: a.needsAction ? `3px solid ${T.antiqueGold}` : "3px solid transparent",
                    display: "flex", alignItems: "flex-start", gap: 16,
                    background: a.needsAction ? "rgba(200,155,71,0.05)" : "#FFFFFF",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PhIcon size={22} color={cfg.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{a.action}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as const, color: T.taupe, background: T.silkCream, borderRadius: 999, padding: "2px 8px" }}>{a.category}</span>
                      {a.needsAction && (
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,155,71,0.18)", borderRadius: 999, padding: "2px 9px" }}>Needs action</span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.55 }}>{a.detail}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>{a.time}</span>
                    {a.needsAction && (
                      <Button onClick={onActivities} variant="primary" size="sm" className="whitespace-nowrap">
                        Review →
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {!isLoading && !isError && filteredActivities.length > 0 && (
            <div className="p-3 border-t" style={{ borderColor: T.borderDef }}>
              <Pagination
                page={pag.page}
                pageCount={pag.pageCount}
                total={pag.total}
                pageSize={pag.pageSize}
                start={pag.start}
                onPageChange={pag.setPage}
                onPageSizeChange={pag.setPageSize}
                itemLabel="activities"
              />
            </div>
          )}

        </div>
      </SectionCard>
      </FadeUp>
  );
}
