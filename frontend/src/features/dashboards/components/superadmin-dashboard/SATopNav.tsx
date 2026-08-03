import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, ChevronDown, ChevronLeft, UserRound, ShoppingCart, Package, LogOut } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import {
  SectionNavigator, MAIN_NAV_H, SUB_NAV_H, SectionNavItem,
} from "../../../../shared/ui/SectionNavigator";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import { T, F, EASE } from "./theme";
import { NAV_GROUPS, findNavGroup } from "./data";

export function SATopNav({ active, set, onBack, sections, onProfile }: { active: string; set: (v: string) => void; onBack?: () => void; sections?: SectionNavItem[]; onProfile?: () => void }) {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const { w } = useResponsive();
  const compact = w < 1320;
  const [showProfile, setShowProfile] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}
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

        {/* Group nav — scrolls internally if the viewport is too narrow to fit every group */}
        <div className="sa-topnav-groups" style={{ display: "flex", height: "100%", alignItems: "stretch", gap: 0, overflowX: "auto", overflowY: "visible", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.sa-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
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
                    height: "100%", padding: compact ? "0 12px" : "0 20px", flexShrink: 0,
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
                      layoutId="sa-group-nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ height: 2, width: "100%", background: T.royalBurgundy }}
                    />
                  )}
                  {!isActive && <div style={{ height: 2, width: "100%", background: "transparent" }} />}
                </motion.button>

                {/* Dropdown is rendered in the fixed overlay below — NOT here */}
              </div>
            );
          })}
        </div>

        {/* ── Dropdown overlay — rendered OUTSIDE the overflow scroll container
            so it is never clipped by overflow-x: auto on the groups div.
            Uses position:fixed measured from the group wrapper's bounding rect. */}
        <AnimatePresence>
          {openGroup && (() => {
            const g = NAV_GROUPS.find(x => x.key === openGroup);
            if (!g || g.pages.length <= 1) return null;
            const wrapperEl = groupBtnRefs.current[g.key];
            const rect = wrapperEl?.getBoundingClientRect();
            const alignRight = NAV_GROUPS.indexOf(g) >= NAV_GROUPS.length - 2;
            const left = rect ? (alignRight ? undefined : rect.left) : 0;
            const right = rect && alignRight ? window.innerWidth - rect.right : undefined;
            const top = rect ? rect.bottom - 8 : MAIN_NAV_H - 8;
            return (
              <motion.div
                key={`dd-${g.key}`}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: EASE }}
                onMouseEnter={() => openGroupNow(g.key)}
                onMouseLeave={closeGroupSoon}
                style={{
                  position: "fixed",
                  top, left, right,
                  minWidth: 250, zIndex: 300,
                  background: "#FFFFFF", borderRadius: 16,
                  border: "1px solid rgba(110,15,45,0.10)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
                  overflow: "hidden", padding: 10,
                }}
              >
                <div style={{ padding: "10px 14px 8px", fontFamily: F.ui, fontWeight: 700, fontSize: 10.5, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const }}>
                  {g.label}
                </div>
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
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {p.label}
                        {p.sa && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />}
                      </span>
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
              style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid rgba(245,232,208,0.14)", backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><Search size={15} color="rgba(245,232,208,0.75)" /></motion.button>
          )}
          <div style={{ position: "relative" }}>
            <motion.button
              onClick={() => set("Notifications")}
              initial={{ backgroundColor: "rgba(245,232,208,0.06)" }}
              whileHover={{ scale: 1.08, backgroundColor: "rgba(245,232,208,0.12)" }}
              whileTap={{ scale: 0.94 }}
              style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid rgba(245,232,208,0.14)", backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><Bell size={15} color={active === "Notifications" ? T.antiqueGold : "rgba(245,232,208,0.75)"} /></motion.button>
            <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, border: `1.5px solid ${T.darkBurgundy}` }} />
          </div>
          {/* Gold SA avatar + profile dropdown */}
          <div style={{ position: "relative" }}>
            <motion.div onClick={() => { setShowProfile(p => !p); setOpenGroup(null); }}
              initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`, backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
              </div>
              {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.warmCream, letterSpacing: "0.1px" }}>Superadmin</span>}
              <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </motion.div>
            {showProfile && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 250, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(196,146,58,0.35)" }}>
                    <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF" }}>SA</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>Superadmin</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>Full Access · All Portals</div>
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
                    localStorage.setItem("bk_original_admin_role", "superadmin");
                    selectRole("shop");
                    navigate("/shop");
                  }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <ShoppingCart size={14} color={T.taupe} /> Shop Staff Portal
                  </button>
                  <button onClick={() => {
                    setShowProfile(false);
                    localStorage.setItem("bk_original_admin_role", "superadmin");
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
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
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

      {/* Sub-nav bar — pages within the active group */}
      {showSubNav && (
        <div
          style={{
            height: SUB_NAV_H,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
            padding: compact ? "0 20px" : "0 56px",
            background: T.warmIvory,
            borderBottom: `1px solid ${T.borderDef}`,
          }}
        >
          <div className="sa-topnav-groups" style={{ display: "flex", alignItems: "center", gap: 4, background: "#F3EEE8", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 6, overflowX: "auto", flexShrink: 0 } as React.CSSProperties}>
            {activeGroup.pages.map(p => {
              const isActive = active === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => set(p.key)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 7,
                    fontFamily: F.ui, fontWeight: isActive ? 600 : 500, fontSize: 14,
                    color: isActive ? "#FFFFFF" : T.luxuryBrown,
                    background: "transparent",
                    border: "none", borderRadius: 10,
                    padding: "12px 26px", cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.06)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sa-subnav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      style={{ position: "absolute", inset: 0, background: T.royalBurgundy, borderRadius: 10, boxShadow: "0 4px 14px rgba(110,15,45,0.28)", zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                    {p.label}
                    {p.sa && (
                      <span
                        title="Superadmin-only"
                        style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? T.goldLight : T.antiqueGold, flexShrink: 0 }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {sections && (
            <>
              <div style={{ width: 1, height: 28, background: T.borderDef, flexShrink: 0 }} />
              <SectionNavigator inline sections={sections} />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
