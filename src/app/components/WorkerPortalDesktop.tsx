import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Bell, ChevronDown, LogOut,
  Home, Search, Users, Sparkles,
} from "lucide-react";
import { C, F } from "./worker/tokens";
import { WorkerHomeDesktop } from "./worker/WorkerHomeDesktop";
import { WorkerWeavers } from "./worker/WorkerWeavers";
import { WorkerQC } from "./worker/WorkerQC";
import { WorkerFinishing } from "./worker/WorkerFinishing";
import { imgBKLogo } from "../constants/weaverImages";
import {
  SectionNavigator, PAGE_SECTIONS, WORKER_TOPNAV_H, WORKER_SECTION_NAV_H,
} from "./SectionNavigator";

type Tab = "home" | "qc" | "weavers" | "finishing" | "profile";
type WeaversSubPage = "menu" | "design" | "issue" | "receive-sarees";

interface WorkerPortalDesktopProps {
  onBack?: () => void;
  bp?: "tablet" | "desktop";
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}

// ─── Top Nav Tabs ───────────────────────────────────────────────────────────────
type NavTab = "home" | "qc" | "weavers" | "finishing";

const TOPNAV_ITEMS: { id: NavTab; Icon: React.ComponentType<{ size?: number; color?: string }>; label: string; badge?: number }[] = [
  { id: "home",      Icon: Home,     label: "Home" },
  { id: "qc",        Icon: Search,   label: "Quality Check", badge: 6 },
  { id: "weavers",   Icon: Users,    label: "Weavers" },
  { id: "finishing", Icon: Sparkles, label: "Finishing" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Top Nav ──────────────────────────────────────────────────────────────────
function WorkerTopNav({ active, onSelect, onBack, bp }: {
  active: Tab;
  onSelect: (t: Tab) => void;
  onBack?: () => void;
  bp: "tablet" | "desktop";
}) {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showUser,    setShowUser]    = useState(false);
  const isTablet = bp === "tablet";

  const closeAll = () => { setShowNotif(false); setShowUser(false); };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "sticky", top: 0, zIndex: 100, height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 20,
        padding: isTablet ? "0 24px" : "0 40px",
        background: "rgba(255,253,249,0.97)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(110,15,45,0.08)",
        boxShadow: "0 2px 24px rgba(74,6,27,0.06)",
      }}
    >
      {/* Logo + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", flexShrink: 0, boxShadow: "0 3px 12px rgba(110,15,45,0.16)", border: "1.5px solid rgba(200,155,71,0.28)" }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        {!isTablet && (
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 13, color: C.dark, lineHeight: 1.1 }}>Beere Kesava</div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 8, color: C.gold, letterSpacing: "2px", textTransform: "uppercase" }}>Worker Staff</div>
          </div>
        )}
      </div>

      {/* Nav tabs */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: isTablet ? 2 : 6, overflowX: "auto", minWidth: 0 }}>
        {TOPNAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                padding: isTablet ? "8px 12px" : "9px 16px", borderRadius: 10,
                border: "none", borderBottom: isActive ? `2.5px solid ${C.burg}` : "2.5px solid transparent",
                background: isActive ? "rgba(107,26,42,0.06)" : "transparent",
                cursor: "pointer", position: "relative" as const,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(107,26,42,0.03)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <item.Icon size={isTablet ? 15 : 16} color={isActive ? C.burg : C.muted} />
              <span style={{ fontFamily: F.u, fontSize: isTablet ? 13 : 14, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.text, whiteSpace: "nowrap" as const }}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 700, color: "#FFF", background: C.crim, minWidth: 18, height: 18, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Bell */}
        <div style={{ position: "relative" }}>
          <motion.button onClick={() => { setShowNotif(p => !p); setShowUser(false); }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(110,15,45,0.05)" }}
            whileTap={{ scale: 0.95 }}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid rgba(110,15,45,0.10)`, backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Bell size={15} color={C.muted} />
          </motion.button>
          <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: C.crim, border: "1.5px solid #FFFDF9" }} />
          {showNotif && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>Notifications</span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>Mark all read</span>
              </div>
              {[
                { emoji: "🔍", title: "6 sarees awaiting QC", desc: "BATCH-086, BATCH-081 need inspection", time: "Now" },
                { emoji: "🧵", title: "8 sarees received from weavers", desc: "Ready to record weight and details", time: "1h ago" },
                { emoji: "✅", title: "6 sarees cleared QC", desc: "BATCH-086 ready for stock", time: "2h ago" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{n.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{n.desc}</div>
                  </div>
                  <span style={{ fontFamily: F.m, fontSize: 10, color: C.muted, flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker avatar + name */}
        <div style={{ position: "relative" }}>
          <motion.div
            onClick={() => { setShowUser(p => !p); setShowNotif(false); }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.04)" }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px 5px 5px", borderRadius: 10, border: `1px solid rgba(110,15,45,0.10)`, backgroundColor: "rgba(110,15,45,0.02)" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.burg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 11, color: "#FFF" }}>RK</span>
            </div>
            <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.dark }}>Ravi Kumar</span>
            <ChevronDown size={12} color={C.muted} />
          </motion.div>
          {showUser && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 210, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
                <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.dark }}>Ravi Kumar</div>
                <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 2 }}>WK-042 · Floor Supervisor</div>
              </div>
              <button onClick={() => { onSelect("profile"); closeAll(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.dark, textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <User size={14} color={C.muted} /> My Profile
              </button>
               {localStorage.getItem("bk_original_admin_role") ? (
                <button onClick={() => {
                  closeAll();
                  const origAdminRole = localStorage.getItem("bk_original_admin_role");
                  if (origAdminRole) {
                    localStorage.removeItem("bk_original_admin_role");
                    selectRole(origAdminRole as any);
                    navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                  }
                }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: `1px solid rgba(110,15,45,0.08)`, cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <LogOut size={14} color={C.muted} /> My Portal
                </button>
              ) : (
                <button onClick={() => { closeAll(); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: `1px solid rgba(110,15,45,0.08)`, cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <LogOut size={14} color={C.muted} /> Switch Portal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 4, height: 24, background: C.gold, borderRadius: 2 }} />
        <h2 style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontFamily: F.u, fontSize: 14, color: C.muted, margin: "0 0 0 14px" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Desktop Profile ──────────────────────────────────────────────────────────
function DesktopProfile() {
  return (
    <div style={{ padding: "28px 40px" }}>
      <PageHeader title="My Profile" subtitle="Your worker identity and shift information." />

      {/* Hero card */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 60%, #8B1A30 100%)`, borderRadius: 18, padding: "28px 36px", marginBottom: 24, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: F.d, fontSize: 28, fontWeight: 700, color: "#FFF" }}>RK</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.d, fontSize: 26, fontWeight: 700, color: "#FFF", marginBottom: 6 }}>Ravi Kumar</div>
          <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>WK-042 · Floor Supervisor</div>
          <div style={{ fontFamily: F.m, fontSize: 13, color: "#C4923A", marginTop: 4 }}>Morning Shift · 6:00 AM – 2:00 PM</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[{ val: "8 yrs", label: "Tenure" }, { val: "Active", label: "Status" }, { val: "4", label: "Batches Today" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Work Details */}
        <div style={{ background: "#FFF", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, letterSpacing: "0.5px", textTransform: "uppercase" }}>Work Details</span>
          </div>
          {[
            { label: "Worker ID", value: "WK-042", mono: true },
            { label: "Role", value: "Floor Supervisor", mono: false },
            { label: "Shift", value: "Morning · 6:00 AM – 2:00 PM", mono: false },
            { label: "Factory", value: "Beere Kesava & Brothers Silks", mono: false },
            { label: "Joined", value: "March 2018", mono: false },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < arr.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{item.label}</span>
              <span style={{ fontFamily: item.mono ? F.m : F.u, fontSize: 14, fontWeight: 500, color: item.mono ? C.burg : C.dark }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Permissions */}
        <div style={{ background: "#FFF", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, letterSpacing: "0.5px", textTransform: "uppercase" }}>Permissions</span>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Quality Check", on: true },
              { label: "Issue Material", on: false },
              { label: "Warp Requests", on: false },
              { label: "Receive Stock", on: false },
              { label: "Reports", on: false },
              { label: "Admin Panel", on: false },
            ].map(p => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: p.on ? "rgba(30,102,64,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${p.on ? "rgba(30,102,64,0.15)" : "rgba(0,0,0,0.06)"}`, borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.on ? C.green : "#CCC", flexShrink: 0 }} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: p.on ? C.dark : C.muted }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Desktop Export ──────────────────────────────────────────────────────
export function WorkerPortalDesktop({ onBack, bp = "desktop", activeTab, setActiveTab }: WorkerPortalDesktopProps) {
  const isTablet = bp === "tablet";
  const [weaversSub, setWeaversSub] = useState<WeaversSubPage>("menu");

  const handleNavigate = (tab: Tab, sub?: WeaversSubPage) => {
    setActiveTab(tab);
    if (tab === "weavers" && sub) setWeaversSub(sub);
  };

  const weaversSubPageMap: Record<WeaversSubPage, "menu" | "design" | "issue" | "receive"> = {
    menu: "menu", design: "design", issue: "issue", "receive-sarees": "receive",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4EFE6", fontFamily: F.u }}>
      <WorkerTopNav
        active={activeTab}
        onSelect={setActiveTab}
        onBack={onBack}
        bp={bp}
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
                  {/* Main form */}
                  <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid rgba(110,15,45,0.10)`, overflow: "hidden" }}>
                    <WorkerWeavers
                      subPage={weaversSubPageMap[weaversSub]}
                      onSubPageChange={(p) => {
                        const inv: Record<string, WeaversSubPage> = { menu: "menu", design: "design", issue: "issue", receive: "receive-sarees" };
                        setWeaversSub(inv[p] || "menu");
                      }}
                    />
                  </div>
                  {/* Context panel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid rgba(110,15,45,0.10)`, padding: "18px 20px" }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Weavers</div>
                      {[
                        { name: "Padma Veni",  code: "WV-002", batch: "BATCH-086", progress: "3/5", avatar: "PV" },
                        { name: "Ravi Kumar",  code: "WV-001", batch: "BATCH-089", progress: "4/8", avatar: "RK" },
                        { name: "Suresh Murti",code: "WV-007", batch: "BATCH-081", progress: "2/4", avatar: "SM" },
                      ].map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: F.d, fontSize: 11, fontWeight: 700, color: "#FFF" }}>{w.avatar}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.dark }}>{w.name}</div>
                            <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{w.batch} · {w.progress} sarees</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid rgba(110,15,45,0.10)`, padding: "18px 20px" }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Navigate</div>
                      {[
                        { label: "Receive Sarees",   sub: "receive-sarees" as WeaversSubPage },
                      ].map((item, i) => (
                        <button key={i} onClick={() => setWeaversSub(item.sub)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", background: weaversSub === item.sub ? "rgba(107,26,42,0.05)" : "none", border: `1px solid ${weaversSub === item.sub ? C.burg : "rgba(110,15,45,0.08)"}`, borderRadius: 10, cursor: "pointer" }}>
                          <span style={{ fontFamily: F.u, fontSize: 13, color: weaversSub === item.sub ? C.burg : C.dark, fontWeight: weaversSub === item.sub ? 600 : 400 }}>{item.label}</span>
                          <ChevronDown size={13} color={C.muted} style={{ transform: "rotate(-90deg)" }} />
                        </button>
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
            {activeTab === "profile" && <DesktopProfile />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
