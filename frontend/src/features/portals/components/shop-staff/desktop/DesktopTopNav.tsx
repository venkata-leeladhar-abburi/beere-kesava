import React from "react";
import { Bell, ChevronLeft, LogOut, RotateCcw, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, TEAL } from "../theme";

const TEAL_LIGHT = "#5EEAD4";
import { Button, IconButton, SearchInput } from "../../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../../shared/ui/overlay";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function DesktopTopNav({
  isTablet, TABS, active, showReturn, setActive, setShowReturn,
  search, setSearch, showProfile, setShowProfile, setShowProfileModal,
  onBack, handleLogout, selectRole, routerNavigate,
}: {
  isTablet: boolean;
  TABS: { id: TabId; label: string; icon: React.ReactNode }[];
  active: TabId;
  showReturn: boolean;
  setActive: (tab: TabId) => void;
  setShowReturn: (val: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfileModal: (v: boolean) => void;
  onBack?: () => void;
  handleLogout: () => void;
  selectRole: (role: any) => void;
  routerNavigate: (path: string) => void;
}) {
  return (
    // Dark-burgundy chrome, matching admin/Worker Staff/Weaver — this bar used
    // to be white, the same split those two portals had before their own pass.
    <div style={{ background: "#3D0E1A", borderBottom: "1px solid rgba(200,155,71,0.14)", position: "sticky" as const, top: 0, zIndex: "var(--z-nav)", boxShadow: "0 4px 40px rgba(0,0,0,0.28)" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: isTablet ? "0 24px" : "0 56px", display: "flex", alignItems: "center", height: 72, gap: isTablet ? 16 : 20 }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: isTablet ? 10 : 14 }}>
          <div style={{ width: isTablet ? 40 : 52, height: isTablet ? 40 : 52, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.30)", boxShadow: "0 4px 16px rgba(0,0,0,0.30)", flexShrink: 0 }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!isTablet && (
            <div>
              <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 600, color: "#F5E8D0", lineHeight: 1, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Beere Kesava</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 400, color: "rgba(245,232,208,0.75)", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 2 }}>And Brothers Silks</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: TEAL_LIGHT, letterSpacing: 3, textTransform: "uppercase" as const, marginTop: 2 }}>Shop Staff Portal</div>
            </div>
          )}
        </div>
        <nav className="shop-topnav-groups" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.shop-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {TABS.map(tab => {
            const isActive = active === tab.id && !showReturn;
            return (
              <Button
                key={tab.id}
                onClick={() => { setActive(tab.id); }}
                variant="ghost"
                aria-current={isActive ? "page" : undefined}
                className={
                  "flex items-center gap-2 shrink-0 h-10 border-none rounded-[10px] whitespace-nowrap " +
                  (isTablet ? "px-3 " : "px-4 ") +
                  (isActive
                    ? "bg-[rgba(15,118,110,0.22)] font-semibold !text-[#5EEAD4] hover:!bg-[rgba(15,118,110,0.28)] hover:!text-[#5EEAD4]"
                    : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#5EEAD4]")
                }
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, color: isActive ? "#5EEAD4" : "rgba(245,232,208,0.80)" })}
                {isTablet ? (tab.id === "inventory" ? "Stock" : tab.id === "sale" ? "Sale" : tab.label) : tab.label}
              </Button>
            );
          })}
          <Button
            onClick={() => setShowReturn(true)}
            variant="ghost"
            className={
              "flex items-center gap-2 shrink-0 h-10 border-none rounded-[10px] whitespace-nowrap " +
              (isTablet ? "px-3 " : "px-4 ") +
              (showReturn
                ? "bg-[rgba(171,56,50,0.22)] font-semibold !text-[#FFB3AA] hover:!bg-[rgba(171,56,50,0.28)] hover:!text-[#FFB3AA]"
                : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#FFB3AA]")
            }
          >
            <RotateCcw size={16} color={showReturn ? "#FFB3AA" : "rgba(245,232,208,0.80)"} /> Process Return
          </Button>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-full"
            containerClassName={"rounded-full !bg-[rgba(245,232,208,0.08)] !border-[rgba(200,155,71,0.22)] hidden 2xl:flex " + (isTablet ? "w-[140px]" : "w-[200px]")}
          />
          <div style={{ position: "relative" as const }}>
            <IconButton icon={Bell} label="Notifications" variant="ghost" className="rounded-[10px] !text-[#F5E8D0] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#5EEAD4]" />
            <span style={{ position: "absolute" as const, top: 4, right: 4, width: 9, height: 9, background: "#F47B72", borderRadius: "50%", border: "1.5px solid #3D0E1A", pointerEvents: "none" as const }} />
          </div>
          <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#5EEAD4", background: "rgba(15,118,110,0.22)", border: "1px solid rgba(94,234,212,0.30)", borderRadius: 999, padding: "5px 12px" }}>
            Shop Staff
          </span>
          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={
                  "flex items-center gap-2.5 h-auto px-3.5 py-1.5 rounded-full border hover:!bg-[rgba(245,232,208,0.12)] " +
                  (showProfile ? "bg-[rgba(245,232,208,0.14)] border-[rgba(94,234,212,0.45)]" : "bg-[rgba(245,232,208,0.06)] border-[rgba(200,155,71,0.22)]")
                }
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEAL, border: "1px solid rgba(94,234,212,0.40)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF" }}>PS</span>
                </div>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#F5E8D0", lineHeight: 1.2 }}>Priya Sharma</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(245,232,208,0.70)" }}>SS · Shop Staff</div>
                </div>
                <ChevronLeft size={13} color="rgba(245,232,208,0.70)" style={{ transform: "rotate(-90deg)", transition: "transform 0.2s" }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: C.white, border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: "16px 18px", background: "rgba(0,128,128,0.05)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(0,128,128,0.28)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>PS</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Priya Sharma</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>SS-001 · Shop Staff</div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#1A0A0F]">
                  <UserRound size={15} color={C.muted} /> View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {localStorage.getItem("bk_original_admin_role") ? (
                  <DropdownMenuItem onClick={() => {
                    const origAdminRole = localStorage.getItem("bk_original_admin_role");
                    if (origAdminRole) {
                      localStorage.removeItem("bk_original_admin_role");
                      selectRole(origAdminRole as any);
                      routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                    }
                  }} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#1A0A0F]">
                    <ChevronLeft size={15} color={C.muted} /> My Portal
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onBack?.()} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#1A0A0F]">
                    <ChevronLeft size={15} color={C.muted} /> Switch Portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} destructive className="!h-auto !py-2.5 !px-[18px] !text-sm">
                  <LogOut size={15} color="#C0392B" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
