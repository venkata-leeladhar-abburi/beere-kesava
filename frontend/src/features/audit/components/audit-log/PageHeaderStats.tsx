
import { useQuery } from "@tanstack/react-query";

import { ClipboardList, Zap, UserCheck, Key, Clock } from "lucide-react";

import { F, T } from "./tokens";
import { auditLogApi } from "../../../../shared/api/audit-log";
import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";


function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function PageHeaderStats() {
  const { data: actionsData } = useQuery({
    queryKey: ["audit-log", "actions", "stats"],
    queryFn: () => auditLogApi.listActions({ pageSize: 100 }),
  });
  const { data: loginsData } = useQuery({
    queryKey: ["audit-log", "logins", "stats"],
    queryFn: () => auditLogApi.list({ pageSize: 100 }),
  });

  const actions = actionsData?.items ?? [];
  const totalActions = actionsData?.total ?? 0;
  const todayStr = new Date().toDateString();
  const actionsToday = actions.filter(a => new Date(a.createdAt).toDateString() === todayStr).length;

  const userCounts = new Map<string, { name: string; count: number; last: string }>();
  for (const a of actions) {
    if (!a.user) continue;
    const key = `${a.user.firstName} ${a.user.lastName}`;
    const entry = userCounts.get(key) ?? { name: key, count: 0, last: a.createdAt };
    entry.count += 1;
    if (new Date(a.createdAt) > new Date(entry.last)) entry.last = a.createdAt;
    userCounts.set(key, entry);
  }
  const mostActive = [...userCounts.values()].sort((a, b) => b.count - a.count)[0];

  const logins = loginsData?.items ?? [];
  const loginsToday = logins.filter(l => l.status === "LOGIN" && new Date(l.createdAt).toDateString() === todayStr).length;

  const lastAction = actions[0];

  return (
    <>
      {/* ── 1. PAGE HEADER ── */}
      <header style={{
        background: "#0D0207",
        position: "relative",
        overflow: "hidden",
        minHeight: 340,
        display: "flex",
        alignItems: "center",
      }}>
        <div className="px-4 md:px-7 xl:px-12 w-full flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          {/* Left col */}
          <div>
            {/* Eyebrow */}
            <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
              SINCE 1999 · SUPERADMIN · AUDIT LOG
            </div>
            {/* Title & Italic sub */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400,
                fontSize: "clamp(32px, 6vw, 56px)",
                color: "#FFFDF9",
                margin: 0,
                lineHeight: 1.1,
              }}>
                Audit Log
              </h1>
              <span style={{
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "clamp(22px, 5vw, 36px)",
                color: T.antiqueGold,
              }}>
                &amp; System Activity
              </span>
            </div>
            {/* Description */}
            <p className="max-w-[600px]" style={{
              fontFamily: F.ui,
              fontSize: "clamp(14px, 2.2vw, 16px)",
              color: "rgba(255,253,249,0.70)",
              margin: 0,
              lineHeight: 1.6,
            }}>
              A complete, immutable record of every action performed across the Beere Kesava &amp; Brothers Silks ERP system — materials, production, sales, approvals, and user sessions.
            </p>
          </div>

          {/* Right col — glass chips */}
          <div className="flex flex-wrap xl:flex-col gap-2.5 items-start xl:items-end z-10">
            {/* Chip 1 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.2vw, 13px)",
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
            }}>
              {totalActions.toLocaleString("en-IN")} Total Log Entries
            </div>
            {/* Chip 2 — live */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              backdropFilter: "blur(12px)",
              background: "rgba(200,155,71,0.18)",
              border: "1px solid rgba(200,155,71,0.30)",
              borderRadius: 12,
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.2vw, 13px)",
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
              Live — Updates in Real Time
            </div>
            {/* Chip 3 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.2vw, 13px)",
              fontWeight: 600,
              color: "#fff",
              whiteSpace: "nowrap",
            }}>
              All Time · From System Start
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. STATS STRIP ── */}
      <div className="px-4 md:px-7 xl:px-14 -mt-6 md:-mt-8 xl:-mt-[40px]" style={{ position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={[
          { icon: <ClipboardList size={22} color="rgba(245,232,208,0.90)" />, label: "TOTAL ACTIONS LOGGED", value: totalActions.toLocaleString("en-IN"), sub: "From day one of the system", highlight: false },
          { icon: <Zap size={22} color="rgba(245,232,208,0.90)" />, label: "ACTIONS TODAY", value: String(actionsToday), sub: "↑ Live · Updates in real time", highlight: false },
          { icon: <UserCheck size={22} color="rgba(245,232,208,0.90)" />, label: "MOST ACTIVE USER TODAY", value: mostActive?.name ?? "—", sub: mostActive ? `${mostActive.count} actions · Last active ${timeAgo(mostActive.last)}` : "No activity yet", highlight: true, goldVal: true },
          { icon: <Key size={22} color="rgba(245,232,208,0.90)" />, label: "LOGIN SESSIONS TODAY", value: String(loginsToday), sub: "Across all roles", highlight: false },
          { icon: <Clock size={22} color="rgba(245,232,208,0.90)" />, label: "LAST ACTION RECORDED", value: lastAction ? timeAgo(lastAction.createdAt) : "—", sub: lastAction ? `${lastAction.role} · ${lastAction.action}` : "No actions recorded yet", highlight: false },
        ]} />
      </div>
    </>
  );
}
