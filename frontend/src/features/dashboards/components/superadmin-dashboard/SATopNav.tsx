import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, Bell, ChevronDown, ChevronLeft, UserRound, ShoppingCart, Package, LogOut } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import {
  SectionNavigator, MAIN_NAV_H, SUB_NAV_H, SectionNavItem,
} from "../../../../shared/ui/SectionNavigator";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import { T, F, EASE } from "./theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../shared/ui/overlay";
import { NAV_GROUPS, findNavGroup } from "./data";

export function SATopNav({ active, set, onBack, sections, onProfile }: { active: string; set: (v: string) => void; onBack?: () => void; sections?: SectionNavItem[]; onProfile?: () => void }) {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const { w } = useResponsive();
  const compact = w < 1320;
  const [showProfile, setShowProfile] = useState(false);
  // Groups with >1 page open a DropdownMenu on click (design-system/05-OVERLAYS.md
  // Part O.2) — this replaces the previous mouseenter + 140ms-timer hover pattern,
  // which had no aria-expanded/aria-haspopup and didn't work on touch.
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const activeGroup = findNavGroup(active);
  const showSubNav = activeGroup.pages.length > 1;

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: "var(--z-nav)" }}
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
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(245,232,208,0.75)", letterSpacing: "1.6px", textTransform: "uppercase" }}>
                And Brothers Silks
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase" }}>
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
            const alignRight = NAV_GROUPS.indexOf(g) >= NAV_GROUPS.length - 2;

            const trigger = (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: EASE }}
                whileHover={{ backgroundColor: "rgba(245,232,208,0.06)" }}
                style={{ height: "100%" }}
              >
                {/* Dropdown groups no longer toggle state here — the
                    surrounding DropdownMenu/DropdownMenuTrigger below
                    already does that via Radix. Doing both raced: this
                    handler and Radix's own trigger click both fired for
                    the same click, off stale state from the same render,
                    which could reopen/reclose the menu unpredictably
                    (same bug fixed in the admin dashboard's TopNav.tsx). */}
                <Button
                  onClick={hasDropdown ? undefined : () => set(g.pages[0].key)}
                  variant="tertiary"
                  aria-current={isActive ? "page" : undefined}
                  aria-haspopup={hasDropdown ? "menu" : undefined}
                  aria-expanded={hasDropdown ? isOpen : undefined}
                  className={`!h-full ${compact ? "!px-3" : "!px-5"} !shrink-0 !border-none !bg-transparent !flex-col !gap-1.5 !rounded-none hover:!bg-transparent`}
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
                      layoutId="sa-group-nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ height: 2, width: "100%", background: T.royalBurgundy }}
                    />
                  )}
                  {!isActive && <div style={{ height: 2, width: "100%", background: "transparent" }} />}
                </Button>
              </motion.div>
            );

            if (!hasDropdown) {
              return <div key={g.key} style={{ position: "relative", height: "100%" }}>{trigger}</div>;
            }

            return (
              <DropdownMenu key={g.key} open={isOpen} onOpenChange={o => setOpenGroup(o ? g.key : null)}>
                <div style={{ position: "relative", height: "100%" }}>
                  <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  align={alignRight ? "end" : "start"}
                  sideOffset={8}
                  className="!min-w-[250px] !p-2.5 !rounded-2xl"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(110,15,45,0.10)", boxShadow: "0 16px 40px rgba(0,0,0,0.28)" }}
                >
                  <div style={{ padding: "10px 14px 8px", fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const }}>
                    {g.label}
                  </div>
                  {g.pages.map(p => {
                    const pActive = active === p.key;
                    return (
                      <DropdownMenuItem
                        key={p.key}
                        aria-current={pActive ? "page" : undefined}
                        onClick={() => { set(p.key); setOpenGroup(null); }}
                        className={`!h-auto !justify-between !py-[13px] !px-3.5 !mb-0.5 !rounded-[10px] !text-sm ${
                          pActive
                            ? "!bg-[rgba(110,15,45,0.07)] !text-[#6E0F2D] !font-semibold data-[highlighted]:!bg-[rgba(110,15,45,0.07)] data-[highlighted]:!text-[#6E0F2D]"
                            : "!bg-transparent !text-[#3B2314] !font-normal data-[highlighted]:!bg-[rgba(110,15,45,0.04)] data-[highlighted]:!text-[#3B2314]"
                        }`}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {p.label}
                          {p.sa && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />}
                        </span>
                        {pActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.royalBurgundy, marginLeft: "auto" }} />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

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
            <motion.div initial={{ backgroundColor: "rgba(245,232,208,0.06)" }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{ borderRadius: 12 }}>
              <IconButton
                icon={Bell}
                label="Notifications"
                onClick={() => set("Notifications")}
                variant="ghost"
                className={`!size-[38px] !rounded-xl !border !border-white/14 !bg-white/6 hover:!bg-white/12 ${
                  active === "Notifications" ? "!text-[#C89B47] hover:!text-[#C89B47]" : "!text-[rgba(245,232,208,0.75)] hover:!text-[rgba(245,232,208,0.75)]"
                }`}
              />
            </motion.div>
            <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, border: `1.5px solid ${T.darkBurgundy}`, pointerEvents: "none" }} />
          </div>
          {/* Gold SA avatar + profile dropdown */}
          <DropdownMenu open={showProfile} onOpenChange={o => { setShowProfile(o); if (o) setOpenGroup(null); }}>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
                whileTap={{ scale: 0.98 }}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`, backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
                </div>
                {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.warmCream, letterSpacing: "0.1px" }}>Superadmin</span>}
                <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[250px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}` }}>
              <div style={{ padding: "16px 18px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF" }}>SA</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Superadmin</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>Full Access · All Portals</div>
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
                <DropdownMenuItem onClick={() => onBack?.()} destructive className="!h-auto !py-[11px] !px-[18px]">
                  <LogOut size={15} color="#C0392B" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <Button
                  key={p.key}
                  onClick={() => set(p.key)}
                  variant="tertiary"
                  className={`!relative !gap-1.5 !rounded-[10px] !py-3 !px-[26px] !whitespace-nowrap !border-none !bg-transparent !text-sm ${
                    isActive
                      ? "!text-white !font-semibold hover:!bg-transparent hover:!text-white"
                      : "!text-[#3B2314] !font-medium hover:!bg-[rgba(110,15,45,0.06)] hover:!text-[#3B2314]"
                  }`}
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
                </Button>
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
