import React from "react";
import { Bell, ChevronLeft, Flower2, LogOut, UserRound } from "lucide-react";
import { C, F } from "./theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function MobileHeader({
  title, onBack, showProfile, setShowProfile, setShowProfileModal, handleLogout, selectRole, routerNavigate,
}: {
  title: string;
  onBack?: () => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfileModal: (v: boolean) => void;
  handleLogout: () => void;
  selectRole: (role: any) => void;
  routerNavigate: (path: string) => void;
}) {
  return (
    <div style={{ height: 56, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, position: "sticky" as const, top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(107,26,42,0.30)" }}>
      <IconButton
        icon={Flower2}
        label="Back"
        onClick={onBack}
        variant="ghost"
        className="w-8 text-white/90"
      />
      <div style={{ flex: 1, textAlign: "center" as const, fontFamily: F.d, fontWeight: 600, fontSize: 16, color: "#FFF" }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ position: "relative" as const }}>
          <IconButton icon={Bell} label="Notifications" variant="ghost" className="w-[30px] text-white/90" />
          <span style={{ position: "absolute" as const, top: 4, right: 2, width: 8, height: 8, background: "#FF3B30", borderRadius: "50%", pointerEvents: "none" as const }} />
        </div>
        <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
          <DropdownMenuTrigger asChild>
            <Button className="w-[30px] h-[30px] p-0 rounded-[9px] border border-white/30 bg-white/12 flex-shrink-0">
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFF" }}>PS</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="!min-w-[200px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: C.white, border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
            <div style={{ padding: "14px 16px", background: "rgba(0,128,128,0.05)", borderBottom: `1px solid ${C.bdr}` }}>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Priya Sharma</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>SS-001 · Shop Staff</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#1A0A0F]">
                <UserRound size={14} color={C.muted} /> View Profile
              </DropdownMenuItem>
              {localStorage.getItem("bk_original_admin_role") ? (
                <DropdownMenuItem onClick={() => {
                  const origAdminRole = localStorage.getItem("bk_original_admin_role");
                  if (origAdminRole) {
                    localStorage.removeItem("bk_original_admin_role");
                    selectRole(origAdminRole as any);
                    routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                  }
                }} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#1A0A0F]">
                  <ChevronLeft size={14} color={C.muted} /> My Portal
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onBack?.()} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#1A0A0F]">
                  <ChevronLeft size={14} color={C.muted} /> Switch Portal
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} destructive className="!h-auto !py-2.5 !px-4 !text-[13px]">
                <LogOut size={14} color="#C0392B" /> Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export type { TabId };
