import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Package, Users, Bell, ChevronLeft, Menu, Search, X, UserRound, Sparkles, UserCheck } from "lucide-react";
import { C, F } from "./worker/tokens";
import { WorkerHome } from "./worker/WorkerHome";
import { WorkerWeavers } from "./worker/WorkerWeavers";
import { WorkerQC } from "./worker/WorkerQC";
import { WorkerFinishing } from "./worker/WorkerFinishing";
import { WorkerPortalDesktop } from "./WorkerPortalDesktop";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, WORKER_SECTION_NAV_H,
} from "./SectionNavigator";
import { useResponsive } from "./useResponsive";

type Tab = "home" | "qc" | "weavers" | "finishing";

const TABS: { id: Tab; Icon: React.ComponentType<{ size: number; color: string }>; label: string; badge?: string }[] = [
  { id: "home",      Icon: Home,       label: "Home"          },
  { id: "qc",        Icon: Search,     label: "QC", badge: "6" },
  { id: "weavers",   Icon: Users,      label: "Weavers"       },
  { id: "finishing", Icon: Sparkles,   label: "Finishing", badge: "2" },
];

const PAGE_TITLES: Record<Tab, string> = {
  home:      "Today's Tasks",
  qc:        "Quality Check",
  weavers:   "Weavers",
  finishing: "Finishing",
};

interface WorkerPortalProps { onBack?: () => void }

function MobileProfile() {
  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 60%, #8B1A30 100%)`, padding: "28px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontSize: 26, fontWeight: 700, color: "#FFF" }}>RK</span>
          </div>
          <div>
            <div style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>Ravi Kumar</div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>WK-042</div>
            <div style={{ marginTop: 6, display: "inline-block", background: "rgba(196,146,58,0.30)", border: "1px solid rgba(196,146,58,0.50)", borderRadius: 999, padding: "3px 10px" }}>
              <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#C4923A" }}>Floor Supervisor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFF", borderBottom: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(107,26,42,0.06)" }}>
        {[
          { val: "8 yrs", label: "Tenure" },
          { val: "Morning", label: "Shift" },
          { val: "Active", label: "Status" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 8px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.burg, marginBottom: 3 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info section */}
      <div style={{ margin: "16px 16px 0" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Work Details</div>
        <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 14, overflow: "hidden" }}>
          {[
            { label: "Worker ID", value: "WK-042", mono: true },
            { label: "Role", value: "Floor Supervisor", mono: false },
            { label: "Shift", value: "Morning · 6:00 AM – 2:00 PM", mono: false },
            { label: "Factory", value: "Beere Kesava & Brothers Silks", mono: false },
            { label: "Joined", value: "March 2018", mono: false },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item.label}</span>
              <span style={{ fontFamily: item.mono ? F.m : F.u, fontSize: 13, fontWeight: 500, color: item.mono ? C.burg : C.text }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div style={{ margin: "16px 16px 0" }}>
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Permissions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Quality Check", on: true },
            { label: "Issue Material", on: false },
            { label: "Warp Requests", on: false },
            { label: "Receive Stock", on: false },
            { label: "Reports", on: false },
            { label: "Admin Panel", on: false },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.on ? C.green : "#DDD", flexShrink: 0 }} />
              <span style={{ fontFamily: F.u, fontSize: 12, color: p.on ? C.text : C.muted }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ margin: "20px 16px 0", textAlign: "center", fontFamily: F.u, fontSize: 11, color: C.muted }}>
        Beere Kesava & Brothers Silks · Est. 1999
      </div>
    </div>
  );
}

function HamburgerMenu({ onClose, onProfile, onBack }: { onClose: () => void; onProfile: () => void; onBack?: () => void }) {
  return (
    <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: "fixed", top: 0, left: 0, width: 260, height: "100vh", background: C.dark, zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.30)" }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: F.d, fontSize: 14, fontWeight: 700, color: C.gold }}>Worker Portal</div>
          <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Beere Kesava & Brothers Silks</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <X size={20} color="rgba(255,255,255,0.60)" />
        </button>
      </div>
      <div style={{ padding: "16px 12px 12px" }}>
        <button onClick={() => { onProfile(); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 10, textAlign: "left" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <UserRound size={18} color="rgba(255,255,255,0.65)" />
          <span style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.80)" }}>My Profile</span>
        </button>
      </div>
      <div style={{ flex: 1 }} />
      {onBack && (
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { onBack(); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 10, fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)" }}>
            Switch Portal
          </button>
        </div>
      )}
    </motion.div>
  );
}

function MobilePortal({ onBack }: WorkerPortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleNavigate = (tab: Tab) => setActiveTab(tab);

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100vh", background: "#FFFFFF", display: "flex", flexDirection: "column", fontFamily: F.u, position: "relative" }}>
      {/* Hamburger overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              onClick={() => setShowMenu(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 190 }} />
            <HamburgerMenu onClose={() => setShowMenu(false)} onProfile={() => setShowProfile(true)} onBack={onBack} />
          </>
        )}
      </AnimatePresence>

      {/* Profile slide */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.22 }}
            style={{ position: "fixed", inset: 0, background: "#FFF", zIndex: 180, overflowY: "auto" }}>
            <div style={{ height: 56, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px" }}>
              <button onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <ChevronLeft size={22} color="#FFF" />
              </button>
              <span style={{ flex: 1, textAlign: "center", fontFamily: F.d, fontSize: 18, fontWeight: 600, color: "#FFF" }}>My Profile</span>
              <div style={{ width: 36 }} />
            </div>
            <MobileProfile />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header */}
      <div style={{ height: 56, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(107,26,42,0.25)" }}>
        <button onClick={() => setShowMenu(true)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", minWidth: 36 }}>
          <Menu size={22} color="rgba(255,255,255,0.85)" />
        </button>
        <span style={{ flex: 1, textAlign: "center", fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>
          {PAGE_TITLES[activeTab]}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={{ background: "none", border: "none", padding: 4, cursor: "pointer", position: "relative", minWidth: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={21} color="rgba(255,255,255,0.85)" />
            <span style={{ position: "absolute", top: 0, right: 2, width: 16, height: 16, background: C.crim, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#FFF", fontFamily: F.u }}>3</span>
          </button>
          <button onClick={() => setShowProfile(true)} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 11, color: "#FFF" }}>RK</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 68 }}>
        {activeTab === "qc" && (
          <SectionNavigator
            sections={PAGE_SECTIONS.WorkerQC}
            stickyTop={0}
            height={WORKER_SECTION_NAV_H}
            activeColor={C.burg}
            mutedColor={C.muted}
            borderColor={C.bdr}
            fontFamily={F.u}
            padding="8px 16px"
            layoutId="worker-qc-section-pill"
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === "home"      && <WorkerHome onNavigate={handleNavigate} />}
            {activeTab === "qc"       && <WorkerQC />}
            {activeTab === "weavers"  && <WorkerWeavers />}
            {activeTab === "finishing"&& <WorkerFinishing />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating quick-action button — QC and Finishing only */}
      <div style={{ position: "fixed", bottom: 76, left: 0, width: "100%", zIndex: 110, pointerEvents: "none" }}>
        <AnimatePresence>
          {(activeTab === "qc" || activeTab === "finishing") && (
            <motion.button
              key={activeTab}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab(activeTab)}
              style={{
                position: "absolute", right: 16, bottom: 0, pointerEvents: "auto",
                width: 56, height: 56, borderRadius: "50%",
                background: C.burg, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(107,26,42,0.30)",
              }}
              aria-label={activeTab === "qc" ? "Start QC" : "Assign"}
            >
              {activeTab === "qc" ? <Search size={22} color="#FFF" /> : <UserCheck size={22} color="#FFF" />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar — 5 tabs */}
      <div style={{ height: 66, background: "#FFF", borderTop: `1px solid ${C.bdr}`, display: "flex", position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 100, boxShadow: "0 -4px 20px rgba(107,26,42,0.08)" }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: "pointer", padding: 0, position: "relative" }}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {active && (
                  <motion.div layoutId="worker-tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    style={{ position: "absolute", top: -9, left: "50%", marginLeft: -13, width: 26, height: 3, borderRadius: 4, background: C.burg }} />
                )}
                {tab.badge && (
                  <span style={{ position: "absolute", top: -3, right: -7, minWidth: 16, height: 16, background: C.crim, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#FFF", fontFamily: F.u, padding: "0 3px" }}>
                    {tab.badge}
                  </span>
                )}
                <tab.Icon size={20} color={active ? C.burg : C.muted} />
                <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: active ? 600 : 500, color: active ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorkerPortal({ onBack }: WorkerPortalProps) {
  const { w, isMobile } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1024 ? "desktop" : "tablet";

  return (
    <>
      <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {isMobile ? <MobilePortal onBack={onBack} /> : <WorkerPortalDesktop onBack={onBack} bp={bp} />}
    </>
  );
}
