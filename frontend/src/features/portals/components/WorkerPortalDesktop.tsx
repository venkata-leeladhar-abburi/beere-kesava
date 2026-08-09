import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { C, F } from "./worker/tokens";
import { useAuth } from "../../../contexts/AuthContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { WorkerHomeDesktop } from "./worker/WorkerHomeDesktop";
import { WorkerWeavers } from "./worker/WorkerWeavers";
import { WorkerQC } from "./worker/WorkerQC";
import { WorkerFinishing } from "./worker/WorkerFinishing";
import { WorkerDispatch } from "./worker/WorkerDispatch";
import { WorkerTopNav } from "./worker/WorkerTopNav";
import {
  SectionNavigator, PAGE_SECTIONS, WORKER_TOPNAV_H, WORKER_SECTION_NAV_H,
} from "../../../shared/ui/SectionNavigator";
import { Button } from "../../../shared/ui/primitives";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "profile";
type WeaversSubPage = "menu" | "design" | "issue" | "receive-sarees";

interface WorkerPortalDesktopProps {
  onBack?: () => void;
  bp?: "tablet" | "desktop";
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 4, height: 24, background: C.gold, borderRadius: 2 }} />
        <h2 style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.dark, margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "0 0 0 14px" }}>{subtitle}</p>}
    </div>
  );
}

function DesktopProfile() {
  const { user } = useAuth();
  const name = user?.name || "—";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
  const subtitle = user?.empId ? `${user.empId} · Worker Staff` : "Worker Staff";

  return (
    <div style={{ padding: "28px 40px" }}>
      <PageHeader title="My Profile" subtitle="Your worker identity." />

      <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 60%, #8B1A30 100%)`, borderRadius: 18, padding: "28px 36px", marginBottom: 24, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.d, fontSize: 30, fontWeight: 700, color: "#FFF" }}>{initials}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: "#FFF", marginBottom: 6 }}>{name}</div>
          <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ background: "#FFF", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, letterSpacing: "0.5px", textTransform: "uppercase" }}>Work Details</span>
        </div>
        {[
          { label: "Worker ID", value: user?.empId || "—", mono: true },
          { label: "Mobile", value: user?.mobile || "—", mono: true },
          { label: "Factory", value: "Beere Kesava & Brothers Silks", mono: false },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{item.label}</span>
            <span style={{ fontFamily: item.mono ? F.m : F.u, fontSize: 14, fontWeight: 500, color: item.mono ? C.burg : C.dark }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkerPortalDesktop({ onBack, bp = "desktop", activeTab, setActiveTab }: WorkerPortalDesktopProps) {
  const isTablet = bp === "tablet";
  const [weaversSub, setWeaversSub] = useState<WeaversSubPage>("menu");
  const { batches } = useBatches();

  const pendingQcCount = useMemo(() => batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && r.weaverName && r.receivedAt && r.qcPassed == null).length,
  [batches]);

  // Weavers with at least one row still outstanding (not yet assigned a
  // saree) in an active batch — real progress, not a fixed sample list.
  const activeWeavers = useMemo(() => {
    const byWeaver = new Map<string, { name: string; initials: string; batchId: string; done: number; total: number }>();
    for (const b of batches) {
      if (b.status !== "active") continue;
      for (const r of b.rows) {
        if (!r.weaverId || !r.weaverName) continue;
        const key = r.weaverId;
        const entry = byWeaver.get(key) ?? { name: r.weaverName, initials: r.weaverInitials || initialsOf(r.weaverName), batchId: b.batchId, done: 0, total: 0 };
        entry.total += 1;
        if (r.sareeId) entry.done += 1;
        byWeaver.set(key, entry);
      }
    }
    return Array.from(byWeaver.values()).filter(w => w.done < w.total).slice(0, 5);
  }, [batches]);

  const handleNavigate = (tab: Tab, sub?: WeaversSubPage) => {
    setActiveTab(tab);
    if (tab === "weavers" && sub) setWeaversSub(sub);
  };

  const weaversSubPageMap: Record<WeaversSubPage, "menu" | "design" | "issue" | "receive"> = {
    menu: "menu", design: "design", issue: "issue", "receive-sarees": "receive",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F4EFE6", fontFamily: F.u }}>
      <WorkerTopNav
        active={activeTab}
        onSelect={setActiveTab}
        onBack={onBack}
        bp={bp}
        pendingQcCount={pendingQcCount}
      />

      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + weaversSub}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {activeTab === "home" && (
              <WorkerHomeDesktop onNavigate={handleNavigate} />
            )}

            {activeTab === "weavers" && (
              <div style={{ padding: isTablet ? "20px 24px" : "28px 40px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <PageHeader
                    title={weaversSub === "menu" ? "Weavers" : "Receive Sarees"}
                    subtitle="Manage weaver material, design planning and saree collection."
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "minmax(0,2fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
                  <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid rgba(110,15,45,0.10)`, overflow: "hidden" }}>
                    <WorkerWeavers
                      subPage={weaversSubPageMap[weaversSub]}
                      onSubPageChange={(p) => {
                        const inv: Record<string, WeaversSubPage> = { menu: "menu", design: "design", issue: "issue", receive: "receive-sarees" };
                        setWeaversSub(inv[p] || "menu");
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid rgba(110,15,45,0.10)`, padding: "18px 20px" }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Weavers</div>
                      {activeWeavers.length === 0 ? (
                        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, padding: "6px 0" }}>No weavers with outstanding sarees right now.</div>
                      ) : activeWeavers.map((w, i) => (
                        <div key={w.batchId + w.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < activeWeavers.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{w.initials}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.dark }}>{w.name}</div>
                            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{w.batchId} · {w.done}/{w.total} sarees</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid rgba(110,15,45,0.10)`, padding: "18px 20px" }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Navigate</div>
                      {[
                        { label: "Receive Sarees", sub: "receive-sarees" as WeaversSubPage },
                      ].map((item, i) => (
                        <Button key={i} variant="tertiary" fullWidth onClick={() => setWeaversSub(item.sub)}
                          className={weaversSub === item.sub ? "justify-between rounded-[10px] border border-[#6B1A2A] bg-[rgba(107,26,42,0.05)] px-3 py-2.5" : "justify-between rounded-[10px] border border-[rgba(110,15,45,0.08)] px-3 py-2.5"}>
                          <span style={{ fontFamily: F.u, fontSize: 13, color: weaversSub === item.sub ? C.burg : C.dark, fontWeight: weaversSub === item.sub ? 600 : 400 }}>{item.label}</span>
                          <ChevronDown size={13} color={C.muted} style={{ transform: "rotate(-90deg)" }} />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "qc" && (
              <div>
                <div style={{ padding: isTablet ? "20px 24px 0" : "28px 40px 0" }}>
                  <PageHeader title="Quality Check" subtitle="Inspect sarees submitted by weavers. Mark as Passed or Defective." />
                </div>
                <SectionNavigator
                  sections={PAGE_SECTIONS.WorkerQC}
                  stickyTop={WORKER_TOPNAV_H}
                  height={WORKER_SECTION_NAV_H}
                  activeColor={C.burg}
                  mutedColor={C.muted}
                  borderColor={C.bdr}
                  fontFamily={F.u}
                  padding={isTablet ? "8px 24px" : "8px 40px"}
                  layoutId="worker-qc-section-pill-desktop"
                />
                <div style={{ padding: isTablet ? "16px 24px 24px" : "20px 40px 28px" }}>
                  <WorkerQC isDesktop={!isTablet} isTablet={isTablet} />
                </div>
              </div>
            )}

            {activeTab === "finishing" && <WorkerFinishing isDesktop={!isTablet} isTablet={isTablet} />}
            {activeTab === "dispatch" && <WorkerDispatch isDesktop={!isTablet} />}
            {activeTab === "profile" && <DesktopProfile />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
