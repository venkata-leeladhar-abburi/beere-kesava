import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor, Smartphone, AlignLeft, Table2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { F, T } from "./tokens";
import { LoginEvent } from "./data";
import { PaginationBtn } from "./shared";
import { Button } from "../../../../shared/ui/primitives";
import { auditLogApi, BackendAuditLog } from "../../../../shared/api/audit-log";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

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

function formatDuration(minutes: number | null): string | null {
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minute${mins !== 1 ? "s" : ""}`;
  return `${hours} hour${hours !== 1 ? "s" : ""}${mins ? ` ${mins} minute${mins !== 1 ? "s" : ""}` : ""}`;
}

function toLoginEvent(log: BackendAuditLog): LoginEvent {
  return {
    id: log.id,
    status: log.status === "LOGIN" ? "login" : log.status === "LOGOUT" ? "logout" : "failed",
    user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown",
    role: log.user?.role ?? "—",
    time: formatTime(log.createdAt),
    device: log.device ?? "—",
    duration: formatDuration(log.duration),
    failReason: log.failReason ?? undefined,
  };
}

export function LoginHistorySection() {
  const [loginView, setLoginView] = useState<"timeline"|"table">("timeline");
  const [entries, setEntries] = useState<LoginEvent[]>([]);
  const [total, setTotal] = useState(0);

  const columns: ColumnDef<LoginEvent>[] = [
    {
      id: "time", header: "Timestamp", accessor: e => e.time,
      cell: (_v, e) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{e.time}</span>,
    },
    {
      id: "user", header: "User", accessor: e => e.user,
      cell: (_v, e) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{e.user}</span>,
    },
    {
      id: "role", header: "Role", accessor: e => e.role,
      cell: (_v, e) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{e.role}</span>,
    },
    {
      id: "event", header: "Event", accessor: e => e.status,
      cell: (_v, e) => (
        <span style={{
          background: e.status === "login" ? "rgba(30,102,64,0.10)" : e.status === "logout" ? "rgba(139,112,96,0.10)" : "rgba(192,57,43,0.08)",
          color: e.status === "login" ? T.green : e.status === "logout" ? T.taupe : T.crimson,
          fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap",
        }}>
          {e.status === "login" ? "✓ Login" : e.status === "logout" ? "→ Logout" : "✗ Failed Login"}
        </span>
      ),
    },
    {
      id: "device", header: "Device", accessor: e => e.device,
      cell: (_v, e) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" }}>
          {e.device.toLowerCase().includes("mobile") ? <Smartphone size={12} color={T.taupe} /> : <Monitor size={12} color={T.taupe} />}
          {e.device}
        </div>
      ),
    },
    {
      id: "duration", header: "Session Duration", accessor: e => e.duration,
      cell: (_v, e) => e.duration ? (
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{e.duration}</span>
      ) : e.status === "login" ? (
        <span style={{ color: T.antiqueGold, fontFamily: F.mono, fontSize: 12 }}>Ongoing</span>
      ) : (
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>—</span>
      ),
    },
    {
      id: "status", header: "Status", accessor: e => e.status, type: "status",
      cell: (_v, e) => (
        <span style={{
          background: e.status === "login" ? "rgba(30,102,64,0.10)" : e.status === "logout" ? "rgba(139,112,96,0.10)" : "rgba(192,57,43,0.08)",
          color: e.status === "login" ? T.green : e.status === "logout" ? T.taupe : T.crimson,
          fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap",
        }}>
          {e.status === "login" ? "Active" : e.status === "logout" ? "Ended" : "Failed"}
        </span>
      ),
    },
  ];

  useEffect(() => {
    auditLogApi.list().then(res => {
      setEntries(res.items.map(toLoginEvent));
      setTotal(res.total);
    }).catch(() => {
      setEntries([]);
      setTotal(0);
    });
  }, []);

  return (
    <div style={{ padding: "48px 56px 0" }}>
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, alignSelf: "stretch", background: T.royalBurgundy, borderRadius: 2, minHeight: 24 }} />
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, flex: 1 }}>
          Login History — User Sessions
        </span>
        <Button variant="link" size="sm" className="text-[12px] text-[#C89B47] hover:text-[#C89B47]">
          Download Login Log →
        </Button>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 24, marginTop: 0 }}>
        Every login, logout, and failed login attempt — with device, session duration, and status.
      </p>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Button
          variant={loginView === "timeline" ? "primary" : "secondary"}
          size="sm"
          iconLeft={AlignLeft}
          className="rounded-full"
          onClick={() => setLoginView("timeline")}
        >
          Timeline View
        </Button>
        <Button
          variant={loginView === "table" ? "primary" : "secondary"}
          size="sm"
          iconLeft={Table2}
          className="rounded-full"
          onClick={() => setLoginView("table")}
        >
          Table View
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loginView === "timeline" ? (
          <motion.div
            key="login-timeline"
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

            {entries.map(entry => {
              const circleColor = entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson;
              const circleInitial = entry.status === "login" ? "IN" : entry.status === "logout" ? "OUT" : "!";
              return (
                <div key={entry.id} style={{ display: "flex", gap: 20, marginBottom: 14, position: "relative" }}>
                  {/* Circle */}
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: circleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {circleInitial}
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
                        {/* Status badge */}
                        <span style={{
                          background: entry.status === "login"
                            ? "rgba(30,102,64,0.10)"
                            : entry.status === "logout"
                            ? "rgba(139,112,96,0.10)"
                            : "rgba(192,57,43,0.08)",
                          color: entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson,
                          fontFamily: F.ui,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "2px 9px",
                          borderRadius: 999,
                        }}>
                          {entry.status === "login" ? "✓ Login" : entry.status === "logout" ? "→ Logout" : "✗ Failed Login"}
                        </span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                          {entry.user}
                        </span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                          {entry.role}
                        </span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                        {entry.time}
                      </span>
                    </div>

                    {/* Row 2 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: entry.failReason ? 8 : 0 }}>
                      {entry.device.toLowerCase().includes("mobile") ? <Smartphone size={13} /> : <Monitor size={13} />}
                      <span>{entry.device}</span>
                      {entry.duration && (
                        <>
                          <span>·</span>
                          <span>Session:</span>
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{entry.duration}</span>
                        </>
                      )}
                    </div>

                    {/* Row 3 — fail reason */}
                    {entry.failReason && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                        {entry.failReason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="login-table"
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
                columns={columns}
                data={entries}
                getRowId={entry => String(entry.id)}
                emptyTitle="No login history yet"
              />

              {/* Pagination */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 18px",
                borderTop: `1px solid ${T.borderDef}`,
              }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                  Showing {entries.length} of {total} session{total !== 1 ? "s" : ""}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                  <PaginationBtn active>1</PaginationBtn>
                  <PaginationBtn disabled><ChevronRight size={13} /></PaginationBtn>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
