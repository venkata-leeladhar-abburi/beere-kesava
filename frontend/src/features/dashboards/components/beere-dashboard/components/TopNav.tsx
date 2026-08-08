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
import { SectionNavigator, MAIN_NAV_H, SUB_NAV_H } from '../../../../../shared/ui/SectionNavigator';
import { T, F, G, EASE, findNavGroup, NAV_GROUPS } from '../theme';
import { Button, IconButton } from '../../../../../shared/ui/primitives';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../../../shared/ui/overlay';

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
  const unreadCount = 0;

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
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(245,232,208,0.75)", letterSpacing: "1.6px", textTransform: "uppercase" }}>
                And Brothers Silks
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase" }}>
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: EASE }}
                  whileHover={{ backgroundColor: "rgba(245,232,208,0.06)" }}
                  style={{ height: "100%" }}
                >
                  <Button
                    onClick={() => { set(g.pages[0].key); setOpenGroup(null); }}
                    variant="tertiary"
                    className={`!h-full ${compact ? "!px-2" : "!px-3"} !shrink-0 !border-none !bg-transparent !flex-col !gap-1.5 !rounded-none hover:!bg-transparent`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Icon size={15} color={isActive ? T.warmCream : "rgba(245,232,208,0.55)"} />
                      <span style={{
                        fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13,
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
                  </Button>
                </motion.div>
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
                    <Button
                      key={p.key}
                      onClick={() => { set(p.key); setOpenGroup(null); }}
                      variant="tertiary"
                      fullWidth
                      className={`!justify-between !py-[13px] !px-3.5 !mb-0.5 !rounded-[10px] !text-sm ${
                        pActive
                          ? "!bg-[rgba(110,15,45,0.07)] !text-[#6E0F2D] !font-semibold hover:!bg-[rgba(110,15,45,0.07)] hover:!text-[#6E0F2D]"
                          : "!bg-transparent !text-[#3B2314] !font-normal hover:!bg-[rgba(110,15,45,0.04)] hover:!text-[#3B2314]"
                      }`}
                    >
                      {p.label}
                      {pActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.royalBurgundy }} />}
                    </Button>
                  );
                })}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 10, flexShrink: 0 }}>
          {!compact && (
            <motion.div initial={{ backgroundColor: "rgba(245,232,208,0.06)" }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{ borderRadius: 12 }}>
              <IconButton
                icon={Search}
                label="Search"
                variant="ghost"
                className="!size-[38px] !rounded-xl !border !border-white/14 !bg-white/6 hover:!bg-white/12"
              />
            </motion.div>
          )}
          <div style={{ position: "relative" }}>
            <motion.div initial={{ backgroundColor: "rgba(245,232,208,0.06)" }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{ borderRadius: 12, position: "relative" }}>
              <IconButton
                icon={Bell}
                label="Notifications"
                onClick={() => setShowNotif(p => !p)}
                variant="ghost"
                className={`!size-[38px] !rounded-xl !border !border-white/14 !bg-white/6 hover:!bg-white/12 ${
                  active === "Notifications" ? "!text-[#C89B47] hover:!text-[#C89B47]" : "!text-[rgba(245,232,208,0.75)] hover:!text-[rgba(245,232,208,0.75)]"
                }`}
              />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, border: `1.5px solid ${T.darkBurgundy}`, pointerEvents: "none" }} />
              )}
            </motion.div>
            {showNotif && (
              <div style={{ position: "absolute", top: 48, right: 0, width: 360, background: "#FFFDF9", borderRadius: 16, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 16px 48px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>Notifications</span>
                    <span style={{ background: T.royalBurgundy, color: "#FFFDF9", fontFamily: F.mono, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>{unreadCount}</span>
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, cursor: "pointer" }}>Mark all read</span>
                </div>
                <div style={{ padding: "24px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  No new notifications.
                </div>
              </div>
            )}
          </div>
          <DropdownMenu open={showProfile} onOpenChange={o => { setShowProfile(o); if (o) setShowNotif(false); }}>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
                whileTap={{ scale: 0.98 }}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`, backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: G.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(0,0,0,0.35)` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 13, color: T.warmCream }}>BK</span>
                </div>
                {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.warmCream, letterSpacing: "0.1px" }}>Admin</span>}
                <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}` }}>
              <div style={{ padding: "16px 18px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.button, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px rgba(110,15,45,0.25)` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.warmCream }}>BK</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Admin User</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <DropdownMenuItem onClick={() => onProfile?.()} className="!h-auto !py-[11px] !px-[18px] !text-[#3B2314]">
                  <UserRound size={15} color={T.taupe} /> View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBack?.()} className="!h-auto !py-[11px] !px-[18px] !text-[#3B2314]">
                  <ChevronLeft size={15} color={T.taupe} /> Switch Portal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLogout?.()} destructive className="!h-auto !py-[11px] !px-[18px]">
                  <LogOut size={15} color="#C0392B" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <Button
                  key={p.key}
                  onClick={() => set(p.key)}
                  variant="tertiary"
                  className={`!relative !rounded-[10px] !py-[9px] !px-[22px] !whitespace-nowrap !border-none !bg-transparent !text-[13px] ${
                    isActive
                      ? "!text-white !font-semibold hover:!bg-transparent hover:!text-white"
                      : "!text-[#3B2314] !font-medium hover:!bg-[rgba(110,15,45,0.06)] hover:!text-[#3B2314]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="subnav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      style={{ position: "absolute", inset: 0, background: T.royalBurgundy, borderRadius: 10, boxShadow: "0 4px 14px rgba(110,15,45,0.28)", zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{p.label}</span>
                </Button>
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
