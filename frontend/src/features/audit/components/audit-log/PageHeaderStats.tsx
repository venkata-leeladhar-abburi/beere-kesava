import React from "react";
import { useQuery } from "@tanstack/react-query";
import { F, T } from "./tokens";
import { StatCol } from "./shared";
import { auditLogApi } from "../../../../shared/api/audit-log";

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
    queryFn: () => auditLogApi.list(100),
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
      <div style={{
        background: T.darkBurgundy,
        position: "relative",
        overflow: "hidden",
        minHeight: 180,
        display: "flex",
        alignItems: "stretch",
      }}>
        {/* Left col */}
        <div className="pl-4 md:pl-7 xl:pl-14" style={{ flex: 1, paddingTop: 44, paddingBottom: 90, zIndex: 10, position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: `${T.antiqueGold}80`,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>
              SINCE 1999 · SUPERADMIN · AUDIT LOG
            </span>
          </div>
          {/* H1 */}
          <h1 style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: "clamp(28px, 7vw, 48px)",
            color: "#fff",
            margin: "0 0 4px",
            lineHeight: 1.1,
          }}>
            Audit Log
          </h1>
          {/* Italic sub */}
          <div style={{
            fontFamily: F.display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "clamp(20px, 5vw, 30px)",
            color: T.antiqueGold,
            marginBottom: 14,
            lineHeight: 1.2,
          }}>
            &amp; System Activity
          </div>
          {/* Description */}
          <p className="max-w-[520px]" style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: "rgba(255,255,255,0.60)",
            margin: 0,
            lineHeight: 1.65,
          }}>
            A complete, immutable record of every action performed across the Beere Kesava &amp; Brothers Silks ERP system — materials, production, sales, approvals, and user sessions.
          </p>
        </div>

        {/* Right col — glass chips */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginRight: 56,
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 10,
          position: "relative",
        }}>
          {/* Chip 1 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            {totalActions.toLocaleString("en-IN")} Total Log Entries
          </div>
          {/* Chip 2 — live */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
              Live — Updates in Real Time
            </div>
          </div>
          {/* Chip 3 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            All Time · From System Start
          </div>
        </div>

        {/* Decorative rings */}
        <div className="w-[400px] h-[400px]" style={{
          position: "absolute",
          right: -120,
          bottom: -120,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.12)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: -60,
          bottom: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.09)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.07)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── 2. STATS STRIP ── */}
      <div className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-14 xl:-mt-[80px]" style={{ position: "relative", zIndex: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 24,
          minHeight: 130,
          display: "flex",
          alignItems: "stretch",
          boxShadow: "0 8px 40px rgba(44,9,19,0.40), 0 2px 8px rgba(44,9,19,0.20)",
          overflow: "hidden",
        }}>
          {/* Col 1 */}
          <StatCol
            icon="📋"
            label="TOTAL ACTIONS LOGGED"
            value={totalActions.toLocaleString("en-IN")}
            sub="From day one of the system"
            divider
          />
          {/* Col 2 */}
          <StatCol
            icon="⚡"
            label="ACTIONS TODAY"
            value={String(actionsToday)}
            sub="↑ Live · Updates in real time"
            divider
          />
          {/* Col 3 — gold highlight */}
          <StatCol
            icon="👤"
            label="MOST ACTIVE USER TODAY"
            value={mostActive?.name ?? "—"}
            valueFontSize={22}
            valueColor={T.antiqueGold}
            sub={mostActive ? `${mostActive.count} actions · Last active ${timeAgo(mostActive.last)}` : "No activity yet"}
            divider
            highlight
          />
          {/* Col 4 */}
          <StatCol
            icon="🔑"
            label="LOGIN SESSIONS TODAY"
            value={String(loginsToday)}
            sub="Across all roles"
            divider
          />
          {/* Col 5 */}
          <StatCol
            icon="🕐"
            label="LAST ACTION RECORDED"
            value={lastAction ? timeAgo(lastAction.createdAt) : "—"}
            valueFontSize={20}
            sub={lastAction ? `${lastAction.role} · ${lastAction.action}` : "No actions recorded yet"}
          />
        </div>
      </div>
    </>
  );
}
