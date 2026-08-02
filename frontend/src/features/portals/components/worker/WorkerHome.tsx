import React from "react";
import { ChevronRight, Package, Shield, Sparkles } from "lucide-react";
import { C, F } from "./tokens";
import { useResponsive } from "../useResponsive";

type Tab = "home" | "qc" | "weavers" | "finishing";

interface WorkerHomeProps {
  onNavigate: (tab: Tab) => void;
}

const NAV_CARDS: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  tab: Tab;
  accent: string;
}[] = [
  {
    icon: Package,
    iconBg: "rgba(107,26,42,0.09)",
    iconColor: C.burg,
    label: "Receive Sarees",
    sub: "Record sarees received from weavers — enter weight, batch details and history",
    tab: "weavers",
    accent: C.burg,
  },
  {
    icon: Shield,
    iconBg: "rgba(192,57,43,0.09)",
    iconColor: "#C0392B",
    label: "Quality Check",
    sub: "Inspect sarees submitted by weavers and mark pass or defective",
    tab: "qc",
    accent: "#C0392B",
  },
  {
    icon: Sparkles,
    iconBg: "rgba(196,146,58,0.09)",
    iconColor: C.gold,
    label: "Finishing",
    sub: "Assign sarees to finishing staff and receive them back after finishing",
    tab: "finishing",
    accent: C.gold,
  },
];

const activities = [
  { dot: C.green,  desc: "6 sarees received from Suresh Murti",       time: "Today · 11:42 AM", id: "BATCH-081" },
  { dot: C.gold,   desc: "Saree PADMA-L1-004 passed quality check",    time: "Today · 10:30 AM", id: "BATCH-086" },
  { dot: "#B85C00",desc: "3 sarees assigned to Priya finishing staff", time: "Yesterday · 3:20 PM", id: "BATCH-089" },
];

export function WorkerHome({ onNavigate }: WorkerHomeProps) {
  const { cols } = useResponsive();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Worker identity strip */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>RK</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.60)", marginBottom: 2 }}>{greeting},</div>
            <div style={{ fontFamily: F.d, fontSize: 19, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>Ravi Kumar</div>
            <div style={{ marginTop: 5, display: "inline-block", background: "rgba(196,146,58,0.25)", border: "1px solid rgba(196,146,58,0.45)", borderRadius: 999, padding: "2px 10px" }}>
              <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.gold }}>Floor Supervisor · WK-042</span>
            </div>
          </div>
          <div style={{ fontFamily: F.m, fontSize: 10, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.09)", padding: "5px 9px", borderRadius: 7, textAlign: "right" as const }}>
            {today}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFF", borderBottom: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(107,26,42,0.05)" }}>
        {[
          { val: "6", label: "Pending QC", col: "#C0392B" },
          { val: "2", label: "With Finishing", col: "#B85C00" },
          { val: "14", label: "Done Today", col: C.green },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 8px", textAlign: "center" as const, borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.col, marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div style={{ padding: "20px 16px 4px" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
          Quick Access
        </div>
        <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 3), gap: 12 }}>
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.tab}
                onClick={() => onNavigate(card.tab)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 14px",
                  background: "#FFF",
                  border: `1.5px solid ${C.bdr}`,
                  borderRadius: 16,
                  boxShadow: "0 2px 12px rgba(107,26,42,0.06)",
                  cursor: "pointer", width: "100%", textAlign: "left" as const,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = card.accent;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px rgba(107,26,42,0.12)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = C.bdr;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(107,26,42,0.06)";
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14, background: card.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={22} color={card.iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.d, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{card.sub}</div>
                </div>
                <ChevronRight size={16} color={C.muted} style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text }}>Recent Activity</span>
        <span style={{ fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer", fontWeight: 600 }}>View All →</span>
      </div>
      <div style={{ margin: "0 16px", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 14, overflow: "hidden" }}>
        {activities.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px",
            borderBottom: i < activities.length - 1 ? `1px solid rgba(139,26,46,0.07)` : "none",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.4, marginBottom: 2 }}>{a.desc}</div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{a.time}</div>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: C.burg, flexShrink: 0, background: "rgba(107,26,42,0.06)", padding: "2px 7px", borderRadius: 6 }}>{a.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
