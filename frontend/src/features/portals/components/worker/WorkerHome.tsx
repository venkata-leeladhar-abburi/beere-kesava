import React, { useMemo } from "react";
import { ChevronRight, Package, Shield, Sparkles } from "lucide-react";
import { C, F } from "./tokens";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBatches } from "../../../production/contexts/BatchContext";
import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { useQc } from "../../../qc/contexts/QcContext";
import { Button } from "../../../../shared/ui/primitives";

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

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
}

export function WorkerHome({ onNavigate }: WorkerHomeProps) {
  const { cols } = useResponsive();
  const { user } = useAuth();
  const { batches } = useBatches();
  const { assignments } = useFinishing();
  const { qcRecords } = useQc();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = user?.name || "—";
  const subtitle = user?.empId ? `${user.empId} · Worker Staff` : "Worker Staff";

  const pendingQcCount = useMemo(() => batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && r.weaverName && r.receivedAt && r.qcPassed == null).length,
  [batches]);
  const withFinishingCount = assignments.filter(a => a.status === "awaiting-return").length;
  const doneTodayCount = useMemo(() => {
    const now = new Date();
    return qcRecords.filter(r => {
      const d = new Date(r.qcDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
  }, [qcRecords]);

  const activities = useMemo(() => qcRecords
    .slice()
    .sort((a, b) => new Date(b.qcDate).getTime() - new Date(a.qcDate).getTime())
    .slice(0, 3)
    .map(r => ({
      dot: r.result === "passed" ? C.green : r.result === "defective" ? "#C0392B" : C.gold,
      desc: `Saree ${r.sareeId} ${r.result === "passed" ? "passed" : r.result === "defective" ? "failed" : "semi-passed"} quality check`,
      time: new Date(r.qcDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      id: r.batchId ?? "—",
    })),
  [qcRecords]);

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
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>{initialsOf(name)}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.60)", marginBottom: 2 }}>{greeting},</div>
            <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>{name}</div>
            <div style={{ marginTop: 5, display: "inline-block", background: "rgba(196,146,58,0.25)", border: "1px solid rgba(196,146,58,0.45)", borderRadius: 999, padding: "2px 10px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold }}>{subtitle}</span>
            </div>
          </div>
          <div style={{ fontFamily: F.m, fontSize: 12, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.09)", padding: "5px 9px", borderRadius: 7, textAlign: "right" as const }}>
            {today}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFF", borderBottom: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(107,26,42,0.05)" }}>
        {[
          { val: String(pendingQcCount), label: "Pending QC", col: "#C0392B" },
          { val: String(withFinishingCount), label: "With Finishing", col: "#B85C00" },
          { val: String(doneTodayCount), label: "Done Today", col: C.green },
        ].map((s, i) => (
          <div key={i} style={{ padding: "12px 8px", textAlign: "center" as const, borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: s.col, marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div style={{ padding: "20px 16px 4px" }}>
        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
          Quick Access
        </div>
        <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 3), gap: 12 }}>
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Button
                key={card.tab}
                variant="tertiary"
                fullWidth
                onClick={() => onNavigate(card.tab)}
                className="justify-start gap-3.5 rounded-2xl border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(107,26,42,0.06)] transition-all"
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
                  <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{card.sub}</div>
                </div>
                <ChevronRight size={16} color={C.muted} style={{ flexShrink: 0 }} />
              </Button>
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
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{a.time}</div>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, flexShrink: 0, background: "rgba(107,26,42,0.06)", padding: "2px 7px", borderRadius: 6 }}>{a.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
