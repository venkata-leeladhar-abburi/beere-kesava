
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  Bell, Search, TrendingUp, SlidersHorizontal, Moon,
  Facebook, Instagram, Youtube, Linkedin, Menu,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, LayoutDashboard, Factory, IndianRupee, Users, Settings2,
  Activity, MapPin, Phone, Eye, Edit3, Layers3, ShoppingCart, Layers, X
, Flower2 as Lotus } from 'lucide-react';
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import { ImageWithFallback } from "../../../../app/components/figma/ImageWithFallback";
import { useNavigate } from 'react-router';
import { useInView } from 'motion/react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useResponsive } from '../../../../app/components/useResponsive';
import { imgBKLogo, imgSareeFooter } from '../../../../app/constants/weaverImages';
import { SectionNavigator, SHOP_MOBILE_HEADER_H as MAIN_NAV_H } from '../../../../app/components/SectionNavigator';
import { T, F, G, NUM, DARK_MAROON, EASE, findNavGroup, NAV_GROUPS, NAV_GROUP_FALLBACK } from './theme';
import { METRICS, WEAVERS, WEAVER_RATES, MATS, ACT } from './data';
import { FadeUp, FadeIn, AnimatedNumber, AnimatedBar, SectionHeader, Card, Label, Body, Donut, BarChart } from './ui';


const SUB_NAV_H = 48;
const imgHero = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const imgSaree       = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom    = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function TopNav({ active, set, onBack, onLogout, sections, onProfile }: { active: string; set: (v: string) => void; onBack?: () => void; onLogout?: () => void; sections?: import("../../../../app/components/SectionNavigator").SectionNavItem[]; onProfile?: () => void }) {
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

        {/* Group nav — scrolls internally if the viewport is too narrow to fit every group, so it
            can never force the page itself to overflow horizontally. */}
        <div className="admin-topnav-groups" style={{ display: "flex", height: "100%", alignItems: "stretch", gap: 0, overflowX: "auto", overflowY: "visible", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.admin-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {NAV_GROUPS.map((g, i) => {
            const isActive = activeGroup.key === g.key;
            const isOpen = openGroup === g.key;
            const hasDropdown = g.pages.length > 1;
            const alignRight = i >= NAV_GROUPS.length - 2;
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
                      layoutId="group-nav-underline"
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
            const top  = rect ? rect.bottom - 8 : MAIN_NAV_H - 8;
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
                  background: "#FFFDF9", borderRadius: 16,
                  border: `1px solid rgba(110,15,45,0.10)`,
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
                {/* Quick preview items */}
                {[
                  { Icon: AlertTriangle, iconColor: "#B91C1C", iconBg: "rgba(185,28,28,0.10)", title: "Low Stock Alert", body: "Only 12 sarees remaining in shop", time: "Just now", urgent: true },
                  { Icon: CheckCircle2,  iconColor: "#1E6640",  iconBg: "rgba(30,102,64,0.10)",  title: "Batch 089 Completed", body: "Ravi Kumar completed 3 sarees", time: "2h ago", urgent: false },
                  { Icon: AlertCircle,  iconColor: "#B45309",  iconBg: "rgba(180,83,9,0.10)",   title: "Jari Stock Low", body: "Below minimum threshold — 8 kg remaining", time: "4h ago", urgent: true },
                ].map((n, i) => (
                  <div key={i} onClick={() => { setShowNotif(false); set("Notifications"); }} style={{ padding: "12px 20px", background: n.urgent ? "rgba(192,57,43,0.03)" : "rgba(0,0,0,0)", borderBottom: `1px solid rgba(110,15,45,0.06)`, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
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
          <div className="admin-topnav-groups" style={{ display: "flex", alignItems: "center", gap: 4, background: "#F3EEE8", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 6, overflowX: "auto", flexShrink: 0 } as React.CSSProperties}>
            {activeGroup.pages.map(p => {
              const isActive = active === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => set(p.key)}
                  style={{
                    position: "relative",
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
              <div style={{ width: 1, height: 28, background: T.borderDef, flexShrink: 0 }} />
              <SectionNavigator inline sections={sections} />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section style={{ position: "relative", height: "calc(100vh - 90px - 160px)", minHeight: 380, overflow: "hidden", background: "#0D0207" }}>
      {/* Ken Burns hero image — actual Beere Kesava showroom */}
      <motion.img
        src={imgHero}
        alt="Beere Kesava & Brothers Silks Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />

      {/* ── Gold sweep reveal line ── */}
      <motion.div
        initial={{ scaleX: 0, x: "-100%" }}
        animate={{ scaleX: 1, x: "200vw" }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", top: 0, left: 0, width: "60%", height: "100%",
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.06) 40%, rgba(200,155,71,0.12) 50%, rgba(200,155,71,0.06) 60%, transparent 100%)",
          pointerEvents: "none", zIndex: 8, transformOrigin: "left center",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px)` }} />

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Heritage Craftsmanship
          </span>
        </motion.div>

        {/* Headline lines — staggered clip reveal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving",          italic: false, color: T.warmCream,   delay: 0.5  },
            { text: "Heritage",         italic: true,  color: T.antiqueGold, delay: 0.68 },
            { text: "Into Every Thread", italic: false, color: T.warmCream,   delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(36px, 3.8vw, 60px)", letterSpacing: "-0.5px", color }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 360, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship,<br />we deliver excellence at every step — for four generations.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.15, ease: EASE }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <motion.button
            initial={{ boxShadow: "0px 8px 32px rgba(110,15,45,0.40)" }}
            whileHover={{ scale: 1.04, boxShadow: "0px 16px 48px rgba(110,15,45,0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 16, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.warmCream, letterSpacing: "0.2px", boxShadow: `0 8px 32px rgba(110,15,45,0.40)` }}
          >
            Explore Production
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={T.warmCream} />
            </div>
          </motion.button>
          <motion.button
            initial={{ backgroundColor: "rgba(245,232,208,0.10)" }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.16)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 22px", borderRadius: 16, cursor: "pointer", backgroundColor: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.92)", letterSpacing: "0.1px" }}
          >
            View Reports
          </motion.button>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}
        >
          <motion.svg
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            width="14" height="24" viewBox="0 0 14 24" fill="none"
          >
            <rect x="1" y="1" width="12" height="22" rx="6" stroke="rgba(245,232,208,0.22)" strokeWidth="1.5" />
            <rect x="5.5" y="5" width="3" height="6" rx="1.5" fill="rgba(200,155,71,0.50)" />
          </motion.svg>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 9, color: "rgba(245,232,208,0.28)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Scroll to Explore</span>
        </motion.div>
      </div>

      <div style={{ position: "absolute", right: 24, top: "40%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 10 }}>
        {[SlidersHorizontal, Moon].map((Icon, i) => (
          <motion.button
            key={i}
            initial={{ backgroundColor: "rgba(245,232,208,0.07)" }}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(245,232,208,0.12)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(245,232,208,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(245,232,208,0.10)", boxShadow: "0 4px 16px rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon size={15} color="rgba(245,232,208,0.55)" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function MetricsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {METRICS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {m.ico}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
                {m.hi && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(200,155,71,0.10)" }}
                  >
                    <ChevronRight size={10} color={T.goldLight} />
                  </motion.div>
                )}
              </div>
            </div>
            {m.hi && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — THREE-COLUMN SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const PROG_BARS = [
  { label: "Production", pct: 72, color: "#6B1A2A" },
  { label: "Inventory",  pct: 84, color: "#C4923A" },
  { label: "Payments",   pct: 46, color: "#A0506A" },
];

function ProductionProgress() {
  return (
    <Card style={{ flex: "0 0 26%", display: "flex", flexDirection: "column", padding: "32px" }}>
      <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 4, letterSpacing: "-0.1px", lineHeight: 1.15 }}>
        Production Progress
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 16, letterSpacing: "0.1px" }}>
        Real-time weaving & supply
      </div>
      
      {/* Centered large progress chart taking up remaining space */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200, margin: "10px 0 20px" }}>
        <Donut />
      </div>

      {/* Redesigned horizontal breakdown that matches SareesProduced bottom layout style */}
      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, marginTop: "auto" }}>
        {PROG_BARS.map((b, i) => (
          <div key={b.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
              {b.label}
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: b.color, ...NUM }}>
              {b.pct}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SareesProduced({ compact }: { compact?: boolean }) {
  const [period, setPeriod] = useState("Month");
  return (
    <Card style={{ flex: compact ? undefined : "0 0 44%", display: "flex", flexDirection: "column", padding: compact ? "24px 24px 0" : "32px 32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 18 : 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>
          Sarees Produced
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Week","Month","Quarter"].map(p => (
            <motion.button
              key={p}
              onClick={() => setPeriod(p)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 11, letterSpacing: "0.1px", background: period === p ? G.button : "rgba(110,15,45,0.06)", color: period === p ? T.warmCream : T.taupe, transition: "all 0.18s" }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 48 : 60, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw="248" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <TrendingUp size={12} color={T.green} />
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.green, letterSpacing: "0.1px" }}>14% from last month</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 130 }}><BarChart /></div>
      <div style={{ display: "flex", gap: 22, paddingBottom: 14 }}>
        {[{ dot: T.royalBurgundy, label: "Produced" }, { dot: T.antiqueGold, label: "Dispatched" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.taupe }}>{l.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, paddingBottom: 28 }}>
        {[{ num: "7", label: "Active Batches" }, { num: "6", label: "Weavers Working" }, { num: "84", label: "In Stock" }].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 34, color: T.luxuryBrown, lineHeight: 1.1, ...NUM }}>
              <AnimatedNumber raw={s.num} />
            </div>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, marginTop: 3, letterSpacing: "0.1px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FeaturedProduct({ compact }: { compact?: boolean }) {
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Weavers",  val: "6 active",   vc: T.luxuryBrown,  rb: true,  bb: true  },
          { label: "Saree Codes",  val: "24 codes",   vc: T.luxuryBrown,  rb: false, bb: true  },
          { label: "QC Pass",  val: "96%",        vc: T.green,        rb: true,  bb: true  },
          { label: "Overdue",  val: "2 invoices", vc: "#C0392B",      rb: false, bb: true, alert: true },
          { label: "Inventory",val: "1,240 pcs",  vc: T.luxuryBrown,  rb: true,  bb: false },
          { label: "Dispatch", val: "18 today",   vc: T.antiqueGold,  rb: false, bb: false },
        ].map((s, idx) => (
          <div key={s.label} style={{ 
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: compact ? "16px 20px" : "24px 32px", 
            borderRight: s.rb ? `1px solid ${T.borderDef}` : "none", 
            borderBottom: s.bb ? `1px solid ${T.borderDef}` : "none",
            background: idx % 2 === 0 ? "transparent" : "rgba(110,15,45,0.01)" // subtle alternating bg
          }}>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: compact ? 10 : 11, color: T.taupe, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1.5px" }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 20 : 24, color: s.vc, lineHeight: 1.1, ...NUM, display: "flex", alignItems: "center", gap: 6 }}>
              {(s as any).alert && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C0392B", flexShrink: 0, display: "inline-block" }} />}
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ThreeCol({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "56px 48px 36px", background: T.silkCream }}>
      <SectionHeader title="Performance Overview" actionText="Full Analytics →" onAction={() => onNavigate("Reports")} />
      <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <ProductionProgress />
        <SareesProduced />
        <FeaturedProduct />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — ACTIVITY STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityStrip({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <section style={{ padding: "0 48px 60px", background: T.silkCream }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.75, ease: EASE }}
        style={{ background: G.card, borderRadius: 28, padding: "34px 32px 38px", boxShadow: "0 20px 60px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: G.gold }} />
              <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, color: T.warmCream, letterSpacing: "-0.2px" }}>Recent Activity</span>
            </div>
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.75)", paddingLeft: 13, letterSpacing: "0.1px" }}>Live operational feed</span>
          </div>
          <motion.button
            onClick={() => onNavigate("Notifications")}
            whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.14)" }}
            whileTap={{ scale: 0.97 }}
            style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.antiqueGold, cursor: "pointer", padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(200,155,71,0.28)", backgroundColor: "rgba(200,155,71,0.07)", letterSpacing: "0.2px" }}
          >
            View All Activity →
          </motion.button>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {ACT.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36, scale: 0.88, filter: "blur(7px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" }}
              animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
              whileHover={{ y: -7, scale: 1.025, boxShadow: `0px 22px 56px ${a.glow}`, backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{
                type: "spring", stiffness: 260, damping: 22,
                delay: 0.1 + i * 0.1,
                opacity: { duration: 0.4 }, filter: { duration: 0.5 },
              }}
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", border: "1px solid rgba(245,232,208,0.09)", borderRadius: 20, padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 175, position: "relative", overflow: "hidden", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: a.bg, opacity: 0.70 }} />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: a.bg, boxShadow: `0 4px 18px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {a.icon}
              </motion.div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: "rgba(245,232,208,0.97)", lineHeight: 1.65, flex: 1, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.bg, boxShadow: `0 0 8px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(245,232,208,0.70)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — WEAVERS
// ═══════════════════════════════════════════════════════════════════════════════
function WeaverSection({ onNavigate }: { onNavigate: (tab: string, ctx?: any) => void }) {
  return (
    <section style={{ padding: "0 48px 64px", background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
      <div style={{ display: "flex", gap: 18, alignItems: "stretch", position: "relative" }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            initial={{ opacity: 0, y: 44, scale: 0.90, filter: "blur(7px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.06)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.06)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.012, boxShadow: "0px 32px 80px rgba(74,6,27,0.18)" }}
            transition={{
              type: "spring", stiffness: 240, damping: 22,
              delay: i * 0.12,
              opacity: { duration: 0.45 }, filter: { duration: 0.5 },
            }}
            style={{ flex: 1, background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            {/* Header Banner - Full Image Height 170px */}
            <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
              {w.img ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                </div>
              )}

              {/* Dark gradient overlay for modern look */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

              {/* Floating ID badge in top left */}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                {w.id}
              </div>

              {/* Floating gentle status pill overlay at the bottom left of the image banner */}
              <div style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px"
              }}>
                {w.status === "active" ? (
                  <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                ) : w.status === "qc" ? (
                  <PhClock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontFamily: F.ui,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                }}>
                  {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Name and Batch beside it */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                  {w.name}
                </div>
                {w.batch && (
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                    {w.batch}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.village}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.mobile}</span>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

              {/* Looms stat */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Rows size={14} color={T.royalBurgundy} weight="fill" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Eye size={14} /> Details
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "edit" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Edit3 size={13} /> Edit
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Layers3 size={14} /> Batches
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <motion.div
            onClick={() => onNavigate("AllWeavers")}
            whileHover={{ scale: 1.12, boxShadow: "0px 10px 30px rgba(74,6,27,0.16)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.warmIvory, border: `1.5px solid ${T.borderGold}`, boxShadow: "0px 6px 20px rgba(74,6,27,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={18} color={T.royalBurgundy} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — RAW MATERIAL
// ═══════════════════════════════════════════════════════════════════════════════
function RawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" onAction={() => onNavigate("Materials")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
        {MATS.map((m, i) => (
          <FadeUp key={m.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              onClick={() => onNavigate("Materials")}
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img
                  src={m.img}
                  alt={m.name}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{m.desc}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: m.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{m.stock}</div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background: T.silkCream }}>
      <FadeUp style={{ padding: "0 48px" }}>
        <div style={{ background: G.card, borderRadius: 28, overflow: "hidden", display: "flex", alignItems: "stretch", position: "relative", height: 180, boxShadow: "0 20px 60px rgba(74,6,27,0.20)", border: "1px solid rgba(200,155,71,0.12)" }}>
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", gap: 20, padding: "0 36px", zIndex: 2 }}>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: "0px 0px 32px rgba(200,155,71,0.32)" }}
              style={{ width: 54, height: 54, borderRadius: 16, overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(200,155,71,0.32)", boxShadow: "0px 0px 24px rgba(200,155,71,0.18)" }}
            >
              <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "sepia(1) saturate(3) hue-rotate(340deg) brightness(1.2)" }} />
            </motion.div>
            <div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.warmCream, lineHeight: 1.2, marginBottom: 2 }}>Crafted with Pride.</div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.antiqueGold, lineHeight: 1.2 }}>Delivered with Trust.</div>
            </div>
          </div>
          <div style={{ flex: "0 0 28%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px 0 0", zIndex: 2 }}>
            <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.88)", lineHeight: 1.85, margin: "0 0 18px", letterSpacing: "0.05px" }}>
              Four generations of passion,<br />woven into every creation.
            </p>
            <motion.button
              initial={{ backgroundColor: "rgba(200,155,71,0.09)" }}
              whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.16)" }}
              whileTap={{ scale: 0.97 }}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 16, border: "1px solid rgba(200,155,71,0.32)", backgroundColor: "rgba(200,155,71,0.09)", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.goldLight, letterSpacing: "0.1px" }}
            >
              Know Our Story <ArrowRight size={12} color={T.goldLight} />
            </motion.button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60%", background: `linear-gradient(to right, #2C0913 0%, rgba(44,9,19,0.7) 35%, rgba(44,9,19,0) 100%)`, zIndex: 1 }} />
            <motion.img
              src={imgSareeFooter}
              alt="Luxury Silk Saree"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.6 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.1} style={{ padding: "36px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderGold}` }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.luxuryBrown, letterSpacing: "0.2px" }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, letterSpacing: "0.1px" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {["About Us","Our Legacy","Sustainability","Careers","Contact Us"].map(l => (
              <motion.span
                key={l}
                whileHover={{ opacity: 1 }}
                style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.luxuryBrown, cursor: "pointer", opacity: 0.70, letterSpacing: "0.1px" }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.14, y: -3, boxShadow: "0px 6px 20px rgba(74,6,27,0.14)" }}
                whileTap={{ scale: 0.93 }}
                style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${T.borderDef}`, background: T.warmIvory, boxShadow: "0px 0px 0px rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Icon size={14} color={T.luxuryBrown} />
              </motion.div>
            ))}
          </div>
        </div>
      </FadeUp>
      <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "28px 48px 0", padding: "18px 0 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, opacity: 0.75, letterSpacing: "0.1px" }}>© 1999 Beere Kesava &amp; Brothers Silks. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lotus size={14} color={T.antiqueGold} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: T.antiqueGold, letterSpacing: "2px", opacity: 0.75, textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — MENU DRAWER
// ═══════════════════════════════════════════════════════════════════════════════

export { TopNav, Hero, MetricsBar, ProductionProgress, SareesProduced, FeaturedProduct, ThreeCol, ActivityStrip, WeaverSection, RawMaterial, Footer };
