import React from "react";
import { Bell, ChevronLeft, LogOut, RotateCcw, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, TEAL } from "../theme";

const TEAL_LIGHT = "#5EEAD4";
import { Button, IconButton, SearchInput } from "../../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../../shared/ui/overlay";
import type { Role } from "../../../../../contexts/AuthContext";

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
  selectRole: (role: Role) => void;
  routerNavigate: (path: string) => void;
}) {
  return (
    // Dark-burgundy chrome, matching admin/Worker Staff/Weaver — this bar used
    // to be white, the same split those two portals had before their own pass.
    <div style={{ background: "#3D0E1A", borderBottom: "1px solid rgba(200,155,71,0.14)", position: "sticky" as const, top: 0, zIndex: "var(--z-nav)", boxShadow: "0 4px 40px rgba(0,0,0,0.28)" }}>
      {/* Three-column grid, not a flex row: the brand lockup and the actions
          each take exactly the width they need, and the nav owns the middle
          column so its pages are centred against the *bar*, not against
          whatever space the siblings happen to leave. The old flex row let a
          wide brand block push the nav until its first and last tabs were
          clipped ("ome", "Process R"). */}
      <div className="max-w-[1600px] mx-auto" style={{ padding: isTablet ? "0 24px" : "0 56px", display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", height: 72, gap: isTablet ? 16 : 24 }}>
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
        <nav className="shop-topnav-groups" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
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
                {React.cloneElement(tab.icon as React.ReactElement<{ size?: number; color?: string }>, { size: 16, color: isActive ? "#5EEAD4" : "rgba(245,232,208,0.80)" })}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, justifySelf: "end" }}>
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
                      selectRole(origAdminRole as Role);
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
