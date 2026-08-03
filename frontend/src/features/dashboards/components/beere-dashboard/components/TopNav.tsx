import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Bell, Search,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useResponsive } from "../../../../../hooks/useResponsive";
import { imgBKLogo } from '../../../../../shared/constants/weaverImages';
import { SectionNavigator, MAIN_NAV_H } from '../../../../../shared/ui/SectionNavigator';
import { T, F, G, EASE, findNavGroup, NAV_GROUPS } from '../theme';

const SUB_NAV_H = 60;

export function TopNav({
  active,
  set,
  onBack,
  onLogout,
  sections,
  onProfile
}: {
  active: string;
  set: (v: string) => void;
  onBack?: () => void;
  onLogout?: () => void;
  sections?: import("../../../../../shared/ui/SectionNavigator").SectionNavItem[];
  onProfile?: () => void;
}) {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const { w } = useResponsive();
  const compact = w < 1320;
  const [showNotif, setShowNotif] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unreadCount = 3;

  const activeGroup = findNavGroup(active);
  const showSubNav = activeGroup.pages.length > 1;

  const groupBtnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const openGroupNow = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(key);
  };
  const closeGroupSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100 }}
    >
      <nav
        style={{
          height: MAIN_NAV_H,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: compact ? "0 20px" : "0 56px",
          gap: compact ? 12 : 0,
          background: T.darkBurgundy,
          borderBottom: `1px solid rgba(200,155,71,0.14)`,
          boxShadow: "0 4px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* Logo + Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, flexShrink: 0, cursor: "pointer" }}
        >
          <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.30)", border: `1.5px solid rgba(200,155,71,0.30)` }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!compact && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: T.warmCream, letterSpacing: "0.5px", lineHeight: 1, textTransform: "uppercase" }}>
                Beere Kesava
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 10.5, color: "rgba(245,232,208,0.75)", letterSpacing: "1.6px", textTransform: "uppercase" }}>
                And Brothers Silks
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase" }}>
                Since 1999
              </div>
            </div>
          )}
        </motion.div>

        {/* Group nav */}
        <div className="admin-topnav-groups" style={{ display: "flex", height: "100%", alignItems: "stretch", gap: 12, overflowX: "auto", overflowY: "visible", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.admin-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {NAV_GROUPS.map((g, i) => {
            const isActive = activeGroup.key === g.key;
            const isOpen = openGroup === g.key;
            const hasDropdown = g.pages.length > 1;
            const Icon = g.icon;
            return (
              <div
                key={g.key}
                ref={el => { groupBtnRefs.current[g.key] = el; }}
                style={{ position: "relative", height: "100%" }}
                onMouseEnter={() => hasDropdown && openGroupNow(g.key)}
                onMouseLeave={closeGroupSoon}
              >
                <motion.button
                  onClick={() => { set(g.pages[0].key); setOpenGroup(null); }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: EASE }}
                  whileHover={{ backgroundColor: "rgba(245,232,208,0.06)" }}
                  style={{
                    height: "100%", padding: compact ? "0 8px" : "0 12px", flexShrink: 0,
                    border: "none", backgroundColor: "rgba(0,0,0,0)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isActive ? T.warmCream : "rgba(245,232,208,0.55)"} />
                    <span style={{
                      fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13.5,
                      color: isActive ? T.warmCream : "rgba(245,232,208,0.72)",
                      whiteSpace: "nowrap", letterSpacing: "0.1px",
                      transition: "color 0.2s",
                    }}>{g.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        size={12}
                        color={isActive ? "rgba(245,232,208,0.85)" : "rgba(245,232,208,0.45)"}
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      />
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="group-nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ height: 2, width: "100%", background: T.royalBurgundy }}
                    />
                  )}
                  {!isActive && <div style={{ height: 2, width: "100%", background: "transparent" }} />}
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Fixed dropdown overlay */}
        <AnimatePresence>
          {openGroup && (() => {
            const g = NAV_GROUPS.find(gr => gr.key === openGroup);
            if (!g || g.pages.length <= 1) return null;
            const btnEl = groupBtnRefs.current[openGroup];
            const rect = btnEl?.getBoundingClientRect();
            const left = rect ? rect.left : 0;
            const top = rect ? rect.bottom + 6 : 80;

            return (
              <motion.div
                key={openGroup}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => openGroupNow(openGroup)}
                onMouseLeave={closeGroupSoon}
                style={{
                  position: "fixed",
                  top, left,
                  zIndex: 999,
                  background: "#FFFDF9",
                  borderRadius: 16,
                  border: `1px solid ${T.borderDef}`,
                  boxShadow: "0 16px 48px rgba(44,24,16,0.18)",
                  padding: 8,
                  minWidth: 200,
                }}
              >
                {g.pages.map(p => {
                  const pActive = active === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => { set(p.key); setOpenGroup(null); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "13px 14px", marginBottom: 2, border: "none", borderRadius: 10,
                        background: pActive ? "rgba(110,15,45,0.07)" : "transparent",
                        cursor: "pointer", textAlign: "left" as const,
                        fontFamily: F.ui, fontSize: 14, fontWeight: pActive ? 600 : 400,
                        color: pActive ? T.royalBurgundy : T.luxuryBrown,
                      }}
                      onMouseEnter={e => { if (!pActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.04)"; }}
                      onMouseLeave={e => { if (!pActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      {p.label}
                      {pActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.royalBurgundy }} />}
                    </button>
                  );
                })}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 10, flexShrink: 0 }}>
          {!compact && (
            <motion.button
              initial={{ backgroundColor: "rgba(245,232,208,0.06)" }}
              whileHover={{ scale: 1.08, backgroundColor: "rgba(245,232,208,0.12)" }}
              whileTap={{ scale: 0.94 }}
              style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid rgba(245,232,208,0.14)`, backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Search size={15} color="rgba(245,232,208,0.75)" />
            </motion.button>
          )}
          <div style={{ position: "relative" }}>
            <motion.button
              onClick={() => setShowNotif(p => !p)}
              initial={{ backgroundColor: "rgba(245,232,208,0.06)" }}
              whileHover={{ scale: 1.08, backgroundColor: "rgba(245,232,208,0.12)" }}
              whileTap={{ scale: 0.94 }}
              style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid rgba(245,232,208,0.14)`, backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
            >
              <Bell size={15} color={active === "Notifications" ? T.antiqueGold : "rgba(245,232,208,0.75)"} />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, border: `1.5px solid ${T.darkBurgundy}` }} />
              )}
            </motion.button>
            {showNotif && (
              <div style={{ position: "absolute", top: 48, right: 0, width: 360, background: "#FFFDF9", borderRadius: 16, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 16px 48px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>Notifications</span>
                    <span style={{ background: T.royalBurgundy, color: "#FFFDF9", fontFamily: F.mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>{unreadCount}</span>
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, cursor: "pointer" }}>Mark all read</span>
                </div>
                {[
                  { Icon: AlertTriangle, iconColor: "#B91C1C", iconBg: "rgba(185,28,28,0.10)", title: "Low Stock Alert", body: "Only 12 sarees remaining in shop", time: "Just now", urgent: true },
                  { Icon: CheckCircle2, iconColor: "#1E6640", iconBg: "rgba(30,102,64,0.10)", title: "Batch 089 Completed", body: "Ravi Kumar completed 3 sarees", time: "2h ago", urgent: false },
                  { Icon: AlertCircle, iconColor: "#B45309", iconBg: "rgba(180,83,9,0.10)", title: "Jari Stock Low", body: "Below minimum threshold — 8 kg remaining", time: "4h ago", urgent: true },
                ].map((n, i) => (
                  <div key={i} onClick={() => { setShowNotif(false); set("Notifications"); }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => { setShowNotif(false); set("Notifications"); })?.(); } }} style={{ padding: "12px 20px", background: n.urgent ? "rgba(192,57,43,0.03)" : "rgba(0,0,0,0)", borderBottom: `1px solid rgba(110,15,45,0.06)`, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.urgent ? "rgba(192,57,43,0.03)" : "rgba(0,0,0,0)")}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: n.iconBg, border: `1px solid ${n.iconColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <n.Icon size={15} color={n.iconColor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: n.urgent ? "#C0392B" : T.luxuryBrown, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{n.body}</div>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, flexShrink: 0, marginTop: 2 }}>{n.time}</span>
                  </div>
                ))}
                <div style={{ padding: "12px 20px", textAlign: "center" as const }}>
                  <span onClick={() => { setShowNotif(false); set("Notifications"); }} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                    View all {unreadCount} notifications →
                  </span>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <motion.div
              onClick={() => { setShowProfile(p => !p); setShowNotif(false); }}
              initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`, backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: G.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(0,0,0,0.35)` }}>
                <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 13, color: T.warmCream }}>BK</span>
              </div>
              {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.warmCream, letterSpacing: "0.1px" }}>Admin</span>}
              <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </motion.div>
            {showProfile && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.button, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px rgba(110,15,45,0.25)` }}>
                    <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.warmCream }}>BK</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>Admin User</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
                  </div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <button onClick={() => { setShowProfile(false); onProfile?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <UserRound size={15} color={T.taupe} /> View Profile
                  </button>
                  <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
                  <div style={{ padding: "6px 18px 4px", fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Staff Portals</div>
                  <button onClick={() => {
                    setShowProfile(false);
                    localStorage.setItem("bk_original_admin_role", "admin");
                    selectRole("shop");
                    navigate("/shop");
                  }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <ShoppingCart size={14} color={T.taupe} /> Shop Staff Portal
                  </button>
                  <button onClick={() => {
                    setShowProfile(false);
                    localStorage.setItem("bk_original_admin_role", "admin");
                    selectRole("worker");
                    navigate("/worker");
                  }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <Package size={14} color={T.taupe} /> Worker Staff Portal
                  </button>
                  <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <ChevronLeft size={15} color={T.taupe} /> Switch Portal
                  </button>
                  <button onClick={() => { setShowProfile(false); onLogout?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.05)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <LogOut size={15} color="#C0392B" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-nav bar */}
      {showSubNav && (
        <div
          style={{
            height: SUB_NAV_H,
            display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 20,
            padding: compact ? "0 16px" : "0 28px",
            background: "#FFFDF9",
            borderBottom: `1px solid ${T.borderDef}`,
          }}
        >
          <div className="admin-topnav-groups" style={{ display: "flex", alignItems: "center", gap: 4, background: "#F3EEE8", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 5, overflowX: "auto", flexShrink: 0 } as React.CSSProperties}>
            {activeGroup.pages.map(p => {
              const isActive = active === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => set(p.key)}
                  style={{
                    position: "relative",
                    fontFamily: F.ui, fontWeight: isActive ? 600 : 500, fontSize: 13.5,
                    color: isActive ? "#FFFFFF" : T.luxuryBrown,
                    background: "transparent",
                    border: "none", borderRadius: 10,
                    padding: "9px 22px", cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.06)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="subnav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      style={{ position: "absolute", inset: 0, background: T.royalBurgundy, borderRadius: 10, boxShadow: "0 4px 14px rgba(110,15,45,0.28)", zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{p.label}</span>
                </button>
              );
            })}
          </div>

          {sections && (
            <>
              <div style={{ width: 1, height: 24, background: T.borderDef, flexShrink: 0 }} />
              <SectionNavigator inline sections={sections} />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
