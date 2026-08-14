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
  const { user } = useAuth();
  const name = user?.name || "—";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
  const subtitle = user?.empId ? `${user.empId} · Worker Staff` : "Worker Staff";

  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32 }}>
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
            <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 500, color: item.mono ? C.burg : C.dark }}>{item.value}</span>
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
              <div style={{ padding: isTablet ? `24px ${GUTTER_X_TABLET}px` : `32px ${GUTTER_X}px` }}>
                <PageHeader
                  title={weaversSub === "menu" ? "Weavers" : "Receive Sarees"}
                  subtitle="Manage weaver material, design planning and saree collection."
                />
                {/* Full-width — the Active Weavers / Quick Navigate rail was
                    removed so the receive flow (table, form, signature and
                    history) gets the whole measure. */}
                <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
                  <WorkerWeavers
                    subPage={weaversSubPageMap[weaversSub]}
                    onSubPageChange={(p) => {
                      const inv: Record<string, WeaversSubPage> = { menu: "menu", design: "design", issue: "issue", receive: "receive-sarees" };
                      setWeaversSub(inv[p] || "menu");
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "qc" && (
              <div>
                <PageHero
                  eyebrow="Worker Staff · Quality Control"
                  title="Quality"
                  titleAccent="Check"
                  description="Inspect sarees submitted by weavers, mark each one Passed or Defective, and keep the defective log and QC history in one place."
                  minHeight={300}
                />
                <div style={{ height: 24 }} />
                <SectionNavigator
                  sections={PAGE_SECTIONS.WorkerQC}
                  stickyTop={WORKER_TOPNAV_H}
                  height={WORKER_SECTION_NAV_H}
                  activeColor={C.burg}
                  mutedColor={C.muted}
                  borderColor={C.bdr}
                  fontFamily={F.u}
                  padding={isTablet ? `8px ${GUTTER_X_TABLET}px` : `8px ${GUTTER_X}px`}
                  layoutId="worker-qc-section-pill-desktop"
                />
                <div style={{ padding: isTablet ? `20px ${GUTTER_X_TABLET}px 32px` : `24px ${GUTTER_X}px 40px` }}>
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
