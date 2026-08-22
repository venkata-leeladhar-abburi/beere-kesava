import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { C, F } from "./worker/tokens";
import { useAuth } from "../../../contexts/AuthContext";
import { useBatches } from "@/features/production";
import { WorkerHomeDesktop } from "./worker/WorkerHomeDesktop";
import { WorkerWeavers } from "./worker/WorkerWeavers";
import { WorkerQC } from "./worker/WorkerQC";
import { WorkerFinishing } from "./worker/WorkerFinishing";
import { WorkerDispatch } from "./worker/WorkerDispatch";
import { WorkerTopNav } from "./worker/WorkerTopNav";
import { PageHero, SectionHeading, GUTTER_X, GUTTER_X_TABLET } from "./worker/primitives";
import {
  SectionNavigator, PAGE_SECTIONS, WORKER_TOPNAV_H, WORKER_SECTION_NAV_H,
} from "../../../shared/ui/SectionNavigator";

import { LogOut } from "lucide-react";
import { Button, IconButton } from "../../../shared/ui/primitives";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "profile";
type WeaversSubPage = "menu" | "design" | "issue" | "receive-sarees";

interface WorkerPortalDesktopProps {
  onBack?: () => void;
  bp?: "tablet" | "desktop";
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Thin alias so this shell renders the same section marker as admin. */
function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <SectionHeading title={title} subtitle={subtitle} size="lg" />;
}

function DesktopProfile() {
  const { user, logout } = useAuth();
  const userName = user?.name || "Ravindra Kumar";
  const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "RK";
  const userPhone = user?.mobile || "1234567890";
  const workerId = user?.empId || "STAFF-001";

  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <PageHeader title="My Profile" subtitle="Your worker staff portal identity." />

      {/* Hero User Banner Card */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 60%, #8B1A30 100%)`, borderRadius: 20, padding: "28px 36px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, boxShadow: "0 8px 32px rgba(74,6,27,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontSize: 30, fontWeight: 700, color: "#FFF" }}>{initials}</span>
          </div>
          <div>
            <div style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: "#FFF", marginBottom: 4 }}>{userName}</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{userPhone}</div>
            <div style={{ marginTop: 8, display: "inline-block", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "3px 12px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF" }}>Worker Staff</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => logout()}
          variant="secondary"
          className="rounded-full px-6 py-2.5 bg-white/10 hover:bg-red-500/20 text-white border border-white/20 hover:border-red-400/40 gap-2 shrink-0 transition-all"
        >
          <LogOut size={16} color="#FF8A8A" /> Logout
        </Button>
      </div>

      {/* 3 Metric Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "20px 0", marginBottom: 24, boxShadow: "0 2px 10px rgba(110,15,45,0.04)" }}>
        {[
          { val: "8 yrs", label: "Tenure" },
          { val: "Morning", label: "Shift" },
          { val: "Active", label: "Status" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "0 12px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.burg, marginBottom: 3 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Work Details Section */}
      <div style={{ background: "#FFF", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(74,6,27,0.04)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)`, background: "rgba(110,15,45,0.02)" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" }}>WORK DETAILS</span>
        </div>
        {[
          { label: "Worker ID", value: workerId, mono: true },
          { label: "Role", value: "Worker Staff", mono: false },
          { label: "Shift", value: "Morning · 6:00 AM – 2:00 PM", mono: false },
          { label: "Factory", value: "Beere Kesava & Brothers Silks", mono: false },
          { label: "Joined", value: "March 2018", mono: false },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{item.label}</span>
            <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: item.mono ? C.burg : C.dark }}>{item.value}</span>
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

  const handleNavigate = (tab: Tab, sub?: WeaversSubPage) => {
    setActiveTab(tab);
    if (tab === "weavers" && sub) setWeaversSub(sub);
  };

  const weaversSubPageMap: Record<WeaversSubPage, "menu" | "design" | "issue" | "receive"> = {
    menu: "menu", design: "design", issue: "issue", "receive-sarees": "receive",
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: F.u }}>
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
              <WorkerWeavers
                subPage={weaversSubPageMap[weaversSub]}
                onSubPageChange={(p) => {
                  const inv: Record<string, WeaversSubPage> = { menu: "menu", design: "design", issue: "issue", receive: "receive-sarees" };
                  setWeaversSub(inv[p] || "menu");
                }}
              />
            )}

            {activeTab === "qc" && (
              <div>
                {/* Sub-header navigation bar matching Superadmin Production Page */}
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    padding: isTablet ? "0 24px" : "0 56px",
                    background: "#FFFDF9",
                    borderBottom: `1px solid ${C.bdr}`,
                    boxShadow: "0 2px 8px rgba(74,6,27,0.03)",
                    position: "sticky",
                    top: 72,
                    zIndex: 80,
                  }}
                >
                  <SectionNavigator
                    inline
                    sections={PAGE_SECTIONS.WorkerQC}
                    activeColor={C.burg}
                    mutedColor={C.muted}
                    borderColor={C.bdr}
                    fontFamily={F.u}
                    layoutId="worker-qc-section-pill-desktop"
                  />
                </div>
                <PageHero
                  eyebrow="Worker Staff · Quality Control"
                  title="Quality"
                  titleAccent="Check"
                  description="Inspect sarees submitted by weavers, mark each one Passed or Defective, and keep the defective log and QC history in one place."
                  minHeight={300}
                />
                <div className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 64 }}>
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
