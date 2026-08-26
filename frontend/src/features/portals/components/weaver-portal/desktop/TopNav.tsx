import React from "react";
import { Bell, ChevronLeft, LogOut, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, Tab5 } from "../theme";
import { Button, IconButton, SearchInput } from "../../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../../shared/ui/overlay";
import { useAuth, type Role } from "../../../../../contexts/AuthContext";

import { useCurrentWeaver } from "../useCurrentWeaver";

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
}

export function TopNav({
  isTablet, NAV, active, showNotifs, setActive, setShowNotifs,
  search, setSearch, showProfile, setShowProfile, onProfile,
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
  selectRole: (role: Role | null) => void;
  navigate: (path: string) => void;
}) {
  const { user, logout } = useAuth();
  const { weaver } = useCurrentWeaver();
  const name = weaver?.name || user?.name || "—";
  const code = weaver?.code || user?.empId || "Handloom";
  const initials = initialsOf(name);
  const subtitle = `${code} · Handloom`;

  return (
    // Dark-burgundy chrome, identical to the admin topnav and the Worker Staff
    // portal — this bar used to be white, which was the most visible split
    // between the weaver portal and the rest of the product.
    <div style={{ background: "#3D0E1A", borderBottom: "1px solid rgba(200,155,71,0.14)", position: "sticky" as const, top: 0, zIndex: "var(--z-nav)", boxShadow: "0 4px 40px rgba(0,0,0,0.28)" }}>
      <div className="max-w-[1600px] mx-auto" style={{ padding: isTablet ? "0 24px" : "0 56px", display: "flex", alignItems: "center", height: 72, gap: isTablet ? 16 : 20 }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: isTablet ? 40 : 52, height: isTablet ? 40 : 52, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.30)", boxShadow: "0 4px 16px rgba(0,0,0,0.30)", flexShrink: 0 }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!isTablet && (
          <div>
            <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 600, color: "#F5E8D0", lineHeight: 1, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Beere Kesava</div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 400, color: "rgba(245,232,208,0.75)", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 2 }}>And Brothers Silks</div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.gold, letterSpacing: 3, textTransform: "uppercase" as const, marginTop: 2 }}>Weaver Portal</div>
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
                aria-current={isActive ? "page" : undefined}
                className={
                  "flex items-center gap-2 shrink-0 h-10 border-none rounded-[10px] whitespace-nowrap " +
                  (isTablet ? "px-3 " : "px-4 ") +
                  (isActive
                    ? "bg-[rgba(200,155,71,0.16)] font-semibold !text-[#E7C983] hover:!bg-[rgba(200,155,71,0.22)] hover:!text-[#E7C983]"
                    : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#E7C983]")
                }
              >
                {React.cloneElement(tab.icon as React.ReactElement<{ color?: string }>, { color: isActive ? "#E7C983" : "rgba(245,232,208,0.80)" })}
                {tab.label}
              </Button>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <SearchInput
            aria-label="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-full"
            containerClassName={"rounded-full !bg-[rgba(245,232,208,0.08)] !border-[rgba(200,155,71,0.22)] hidden 2xl:flex " + (isTablet ? "w-[140px]" : "w-[200px]")}
          />
          <div style={{ position: "relative" as const }}>
            <IconButton
              icon={Bell}
              label="Notifications"
              onClick={() => setShowNotifs(v => !v)}
              variant="ghost"
              className={"rounded-[10px] !text-[#F5E8D0] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#E7C983] " + (showNotifs ? "bg-[rgba(200,155,71,0.16)]" : "")}
            />
            <span style={{ position: "absolute" as const, top: 4, right: 4, width: 9, height: 9, background: "#F47B72", borderRadius: "50%", border: "1.5px solid #3D0E1A", pointerEvents: "none" as const }} />
          </div>
          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={
                  "flex items-center gap-2.5 h-auto px-3.5 py-1.5 rounded-full border hover:!bg-[rgba(245,232,208,0.12)] " +
                  (showProfile ? "bg-[rgba(245,232,208,0.14)] border-[rgba(200,155,71,0.40)]" : "bg-[rgba(245,232,208,0.06)] border-[rgba(200,155,71,0.22)]")
                }
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF" }}>{initials}</span>
                </div>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#F5E8D0", lineHeight: 1.2 }}>{name}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(245,232,208,0.70)" }}>{subtitle}</div>
                </div>
                <ChevronLeft size={13} color="rgba(245,232,208,0.70)" style={{ transform: "rotate(-90deg)", transition: "transform 0.2s" }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFF", border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: "16px 18px", background: "rgba(110,15,45,0.04)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(110,15,45,0.28)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>{initials}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.empId ? `${user.empId} · Handloom Weaver` : "Handloom Weaver"}</div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <DropdownMenuItem onClick={() => onProfile?.()} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#3B2314]">
                  <UserRound size={15} color={C.muted} /> View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {localStorage.getItem("bk_original_admin_role") ? (
                  <DropdownMenuItem onClick={() => {
                    const origAdminRole = localStorage.getItem("bk_original_admin_role");
                    if (origAdminRole) {
                      localStorage.removeItem("bk_original_admin_role");
                      selectRole(origAdminRole as Role);
                      navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                    }
                  }} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#3B2314]">
                    <ChevronLeft size={15} color={C.muted} /> My Portal
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} destructive className="!h-auto !py-2.5 !px-[18px] !text-sm">
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
