import React from "react";
import { Bell, ChevronLeft, LogOut, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, Tab5 } from "../theme";
import { Button, IconButton, SearchInput } from "../../../../../shared/ui/primitives";

export function TopNav({
  isTablet, NAV, active, showNotifs, setActive, setShowNotifs,
  search, setSearch, showProfile, setShowProfile, onProfile, onBack,
  selectRole, navigate,
}: {
  isTablet: boolean;
  NAV: { id: Tab5; label: string; icon: React.ReactNode }[];
  active: Tab5;
  showNotifs: boolean;
  setActive: (t: Tab5) => void;
  setShowNotifs: React.Dispatch<React.SetStateAction<boolean>>;
  search: string;
  setSearch: (v: string) => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  onProfile?: () => void;
  onBack?: () => void;
  selectRole: (role: any) => void;
  navigate: (path: string) => void;
}) {
  return (
    <div style={{ background: "#FFF", borderBottom: `1px solid ${C.bdr}`, position: "sticky" as const, top: 0, zIndex: 200, boxShadow: "0 1px 10px rgba(107,26,42,0.07)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: isTablet ? "0 24px" : "0 48px", display: "flex", alignItems: "center", height: 64, gap: isTablet ? 16 : 28 }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!isTablet && (
          <div>
            <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1, textTransform: "uppercase" as const }}>Beere Kesava</div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 400, color: "#3B2314", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 1 }}>And Brothers Silks</div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginTop: 4 }}>WEAVER PORTAL</div>
          </div>
          )}
        </div>
        <nav className="wp-filter-scroll" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          {NAV.map(tab => {
            const isActive = active === tab.id && !showNotifs;
            return (
              <Button
                key={tab.id}
                onClick={() => { setActive(tab.id); setShowNotifs(false); }}
                variant="ghost"
                className={
                  "flex items-center gap-1.5 shrink-0 h-16 border-none bg-transparent rounded-none whitespace-nowrap border-b-2 " +
                  (isTablet ? "px-2.5 " : "px-[18px] ") +
                  (isActive ? "border-b-[#6B1A2A] font-semibold text-[#1A0A0F] hover:bg-transparent hover:text-[#1A0A0F]" : "border-b-transparent font-normal text-[#69635E] hover:bg-transparent hover:text-[#1A0A0F]")
                }
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { color: isActive ? C.burg : C.muted })}
                {tab.label}
              </Button>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-full"
            containerClassName={"rounded-full " + (isTablet ? "w-[140px]" : "w-[200px]")}
          />
          <div style={{ position: "relative" as const }}>
            <IconButton
              icon={Bell}
              label="Notifications"
              onClick={() => setShowNotifs(v => !v)}
              variant="ghost"
              className={"rounded-lg " + (showNotifs ? "bg-[rgba(107,26,42,0.08)]" : "")}
            />
            <span style={{ position: "absolute" as const, top: 4, right: 4, width: 10, height: 10, background: "#FF3B30", borderRadius: "50%", border: "2px solid #FFF", pointerEvents: "none" as const }} />
          </div>
          <div style={{ position: "relative" as const }}>
            <Button
              onClick={() => setShowProfile(p => !p)}
              variant="ghost"
              className={
                "flex items-center gap-2.5 h-auto px-3.5 py-1.5 rounded-full border " +
                (showProfile ? "bg-[rgba(107,26,42,0.10)] border-[#6B1A2A]" : "bg-[rgba(107,26,42,0.06)] border-[rgba(139,26,46,0.12)]")
              }
            >
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>RK</span>
              </div>
              <div style={{ textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Ravi Kumar</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>WVR-014 · Handloom</div>
              </div>
              <ChevronLeft size={13} color={C.muted} style={{ transform: showProfile ? "rotate(-90deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
            </Button>
            {showProfile && (
              <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFF", borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", background: "rgba(107,26,42,0.04)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(107,26,42,0.28)" }}>
                    <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>RK</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Ravi Kumar</div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>WVR-014 · Handloom Weaver</div>
                  </div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-[18px] py-2.5 border-none bg-transparent justify-start text-sm text-[#1A0A0F] rounded-none hover:bg-[rgba(107,26,42,0.04)]">
                    <UserRound size={15} color={C.muted} /> View Profile
                  </Button>
                  <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                  {localStorage.getItem("bk_original_admin_role") ? (
                    <Button onClick={() => {
                      setShowProfile(false);
                      const origAdminRole = localStorage.getItem("bk_original_admin_role");
                      if (origAdminRole) {
                        localStorage.removeItem("bk_original_admin_role");
                        selectRole(origAdminRole as any);
                        navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                      }
                    }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-[18px] py-2.5 border-none bg-transparent justify-start text-sm text-[#1A0A0F] rounded-none hover:bg-[rgba(107,26,42,0.04)]">
                      <ChevronLeft size={15} color={C.muted} /> My Portal
                    </Button>
                  ) : (
                    <Button onClick={() => { setShowProfile(false); onBack?.(); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-[18px] py-2.5 border-none bg-transparent justify-start text-sm text-[#1A0A0F] rounded-none hover:bg-[rgba(107,26,42,0.04)]">
                      <ChevronLeft size={15} color={C.muted} /> Switch Portal
                    </Button>
                  )}
                  <Button onClick={() => { setShowProfile(false); onBack?.(); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-[18px] py-2.5 border-none bg-transparent justify-start text-sm text-[#C0392B] rounded-none hover:bg-[rgba(192,57,43,0.05)]">
                    <LogOut size={15} color="#C0392B" /> Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
