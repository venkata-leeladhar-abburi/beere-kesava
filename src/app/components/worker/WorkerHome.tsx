import React from "react";
import { ChevronRight, Package, Shield } from "lucide-react";
import { C, F } from "./tokens";
import { useResponsive } from "../useResponsive";

type Tab = "home" | "qc" | "weavers";

interface WorkerHomeProps {
  onNavigate: (tab: Tab) => void;
}

const tasks = [
  {
    icon: Package,
    iconBg: "#B8860B",
    title: "Sarees Received — Record Them",
    badge: "8 sarees",
    badgeColor: C.burg,
    sub: "Completed sarees submitted by weavers — enter weight and details",
    tab: "weavers" as Tab,
  },
  {
    icon: Shield,
    iconBg: C.crim,
    title: "Sarees Awaiting Quality Check",
    badge: "6 pending",
    badgeColor: C.crim,
    sub: "Inspect sarees submitted by weavers",
    tab: "qc" as Tab,
  },
];

const activities = [
  { dot: C.green, desc: "6 sarees received from Suresh Murti", time: "Today · 11:42 AM", id: "BATCH-081" },
  { dot: C.gold, desc: "Saree PADMA-L1-004 passed quality check", time: "Today · 10:30 AM", id: "BATCH-086" },
];

export function WorkerHome({ onNavigate }: WorkerHomeProps) {
  const { cols } = useResponsive();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Worker identity strip */}
      <div style={{ background: C.dark, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: C.burg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: "#FFF" }}>RK</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.60)", marginBottom: 2 }}>Good morning,</div>
          <div style={{ fontFamily: F.u, fontSize: 17, fontWeight: 600, color: "#FFF" }}>Ravi Kumar</div>
        </div>
        <div style={{ fontFamily: F.m, fontSize: 11, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.10)", padding: "4px 8px", borderRadius: 6 }}>
          {today}
        </div>
      </div>

      {/* Today's Tasks */}
      <div style={{ padding: "20px 20px 4px", fontFamily: F.u, fontSize: 16, fontWeight: 600, color: C.text }}>
        Today's Tasks
      </div>

      <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 3), gap: 12, padding: "0 20px 12px" }}>
        {tasks.map((task, i) => {
          const Icon = task.icon;
          return (
            <button
              key={i}
              onClick={() => onNavigate(task.tab)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: 16,
                background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 14,
                boxShadow: "0 2px 10px rgba(107,26,42,0.06)",
                cursor: "pointer", width: "100%", textAlign: "left",
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: task.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={20} color="#FFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{task.title}</span>
                  <span style={{
                    fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#FFF",
                    background: task.badgeColor, padding: "2px 8px", borderRadius: 999,
                  }}>{task.badge}</span>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.4 }}>{task.sub}</div>
              </div>
              <ChevronRight size={18} color={C.muted} />
            </button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div style={{ padding: "20px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 600, color: C.text }}>Recent Activity</span>
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.gold, cursor: "pointer" }}>View All →</span>
      </div>
      <div style={{ margin: "0 20px", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 14, overflow: "hidden" }}>
        {activities.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
            borderBottom: i < activities.length - 1 ? `1px solid rgba(139,26,46,0.08)` : "none",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.dot, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.4, marginBottom: 2 }}>{a.desc}</div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{a.time}</div>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: C.burg, flexShrink: 0 }}>{a.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
