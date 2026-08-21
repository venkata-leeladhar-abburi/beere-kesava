import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  AlignLeft, Table2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
} from "lucide-react";
import { F, T, ROLE_COLORS } from "./tokens";
import { PaginationBtn, SectionCard } from "./shared";
import { Button } from "../../../../shared/ui/primitives";
import { auditLogApi, ActionLogEntry } from "../../../../shared/api/audit-log";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

type ActionEntry = {
  id: string;
  role: string;
  user: string;
  time: string;
  action: string;
  module: string;
  record: string;
  oldVal: string | null;
  newVal: string | null;
};

// Backend UserRole enum -> the display labels ROLE_COLORS is keyed on.
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
  WORKER: "WORKER STAFF",
  SHOP: "SHOP STAFF",
  WEAVER: "WEAVERS",
  ACCOUNTANT: "ACCOUNTANT",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today · ${timePart}`;
  if (isYesterday) return `Yesterday · ${timePart}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${timePart}`;
}

function toActionEntry(log: ActionLogEntry): ActionEntry {
  const roleLabel = ROLE_LABELS[log.role] ?? log.role;
  return {
    id: log.id,
    role: roleLabel,
    user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
    time: formatTime(log.createdAt),
    action: log.action,
    module: log.module,
    record: log.recordLabel ?? log.entityId ?? "—",
    oldVal: log.oldValue,
    newVal: log.newValue,
  };
}

function withinPeriod(iso: string, period: string): boolean {
  if (period === "All Time") return true;
  const d = new Date(iso);
  const now = new Date();
  const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (period === "Today") return d.toDateString() === now.toDateString();
  if (period === "This Week") return days <= 7;
  if (period === "This Month") return days <= 31;
  if (period === "Last 3 Months") return days <= 92;
  return true;
}

export function ActionLogSection({
  search = "",
  roleFilter = "All Roles",
  moduleFilter = "All Modules",
  actionFilter = "All Actions",
  periodFilter = "All Time",
}: {
  search?: string;
  roleFilter?: string;
  moduleFilter?: string;
  actionFilter?: string;
  periodFilter?: string;
} = {}) {
  const [actionView, setActionView] = useState<"timeline"|"table">("timeline");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-log", "actions", moduleFilter],
    queryFn: () => auditLogApi.listActions({ pageSize: 200, module: moduleFilter }),
  });

  const allEntries: ActionEntry[] = (data?.items ?? []).map(toActionEntry);
  const rawItems = data?.items ?? [];

  const entries: ActionEntry[] = allEntries.filter((entry, i) => {
    if (roleFilter !== "All Roles" && entry.role !== roleFilter) return false;
    if (actionFilter !== "All Actions" && !entry.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (!withinPeriod(rawItems[i].createdAt, periodFilter)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${entry.action} ${entry.user} ${entry.record} ${entry.module}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const total = data?.total ?? 0;

  const actionColumns: ColumnDef<ActionEntry>[] = [
    {
      id: "time", header: "Timestamp", accessor: e => e.time,
      cell: (_v, e) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{e.time}</span>,
    },
    {
      id: "role", header: "Role", accessor: e => e.role,
      cell: (_v, e) => (
        <span style={{
          background: ROLE_COLORS[e.role]?.badge,
          color: ROLE_COLORS[e.role]?.text,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          padding: "2px 7px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}>
          {e.role}
        </span>
      ),
    },
    {
      id: "user", header: "User", accessor: e => e.user,
      cell: (_v, e) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{e.user}</span>,
    },
    {
      id: "module", header: "Module", accessor: e => e.module, priority: 3,
      cell: (_v, e) => (
        <span style={{
          background: T.cream,
          border: `1px solid ${T.borderDef}`,
          borderRadius: 6,
          padding: "2px 7px",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: T.royalBurgundy,
          whiteSpace: "nowrap",
        }}>
          {e.module}
        </span>
      ),
    },
    {
      id: "action", header: "Action", accessor: e => e.action,
      cell: (_v, e) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, maxWidth: 300, display: "inline-block" }}>{e.action}</span>,
    },
    {
      id: "record", header: "Record", accessor: e => e.record, priority: 1,
      cell: (_v, e) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" }}>{e.record}</span>,
    },
    {
      id: "oldVal", header: "Old Value", accessor: e => e.oldVal, priority: 3,
      cell: (_v, e) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: e.oldVal ? T.crimson : T.taupe }}>{e.oldVal ?? "—"}</span>,
    },
    {
      id: "newVal", header: "New Value", accessor: e => e.newVal, priority: 3,
      cell: (_v, e) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: e.newVal ? T.green : T.taupe }}>{e.newVal ?? "—"}</span>,
    },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
    <SectionCard
      icon={ClipboardList}
      title="Action Log — All System Activity"
      subtitle="Every create, update, approve, issue, and dispatch action — recorded with user, timestamp, and changed values."
      actions={
        <Button variant="secondary" size="sm" className="bg-white/10 text-[#FFFDF9] border-white/20">
          Download Action Log
        </Button>
      }
    >
      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Button
          variant={actionView === "timeline" ? "primary" : "secondary"}
          size="sm"
          iconLeft={AlignLeft}
          className="rounded-full"
          onClick={() => setActionView("timeline")}
        >
          Timeline View
        </Button>
        <Button
          variant={actionView === "table" ? "primary" : "secondary"}
          size="sm"
          iconLeft={Table2}
          className="rounded-full"
          onClick={() => setActionView("table")}
        >
          Table View
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {actionView === "timeline" ? (
          <motion.div
            key="action-timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ position: "relative" }}
          >
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 13,
              top: 0,
              bottom: 0,
              width: 2,
              background: "rgba(110,15,45,0.18)",
              borderRadius: 1,
            }} />

            {isLoading && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "24px 0" }}>
                Loading action log…
              </div>
            )}
            {isError && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, padding: "24px 0" }}>
                Could not load the action log. Please try again later.
              </div>
            )}
            {!isLoading && !isError && entries.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "24px 0" }}>
                No actions recorded yet. As weavers, invoices, and purchase orders are created or
                updated, they'll show up here.
              </div>
            )}

            {entries.map(entry => (
              <div key={entry.id} style={{ display: "flex", gap: 20, marginBottom: 14, position: "relative" }}>
                {/* Circle */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: ROLE_COLORS[entry.role]?.circle ?? T.taupe,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    {ROLE_COLORS[entry.role]?.initial ?? "??"}
                  </span>
                </div>

                {/* Card */}
                <div style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 12,
                  border: `1px solid ${T.borderDef}`,
                  boxShadow: "0 1px 8px rgba(44,24,16,0.06)",
                  padding: "14px 18px",
                }}>
                  {/* Row 1 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        background: ROLE_COLORS[entry.role]?.badge,
                        color: ROLE_COLORS[entry.role]?.text,
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        letterSpacing: "0.5px",
                      }}>
                        {entry.role}
                      </span>
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                        {entry.user}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
                      {entry.time}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown, marginBottom: entry.oldVal ? 8 : 10, lineHeight: 1.5 }}>
                    {entry.action}
                  </div>

                  {/* Row 3 — change values */}
                  {entry.oldVal && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Changed from:</span>
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.crimson }}>{entry.oldVal}</span>
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.antiqueGold }}>→</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Changed to:</span>
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.green }}>{entry.newVal}</span>
                    </div>
                  )}

                  {/* Row 4 */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      background: T.cream,
                      border: `1px solid ${T.borderDef}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: T.royalBurgundy,
                    }}>
                      {entry.module}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>
                      {entry.record}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <Button variant="secondary" size="md" iconLeft={ChevronDown} className="rounded-full">
                Load More Entries
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="action-table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              background: "#fff",
              borderRadius: 16,
              border: `1px solid ${T.borderDef}`,
              boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
              overflowX: "auto",
            }}>
              <DataTable
                columns={actionColumns}
                data={entries}
                getRowId={e => e.id}
                loading={isLoading && entries.length === 0}
                error={isError && entries.length === 0}
                emptyTitle="No actions recorded yet."
              />

              {/* Pagination */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 18px",
                borderTop: `1px solid ${T.borderDef}`,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
                  Showing {entries.length} of {total} entr{total === 1 ? "y" : "ies"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                  {[1, 2, 3].map(n => (
                    <PaginationBtn key={n} active={n === 1}>{n}</PaginationBtn>
                  ))}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, padding: "0 4px" }}>...</span>
                  <PaginationBtn>60</PaginationBtn>
                  <PaginationBtn><ChevronRight size={13} /></PaginationBtn>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
    </div>
  );
}
