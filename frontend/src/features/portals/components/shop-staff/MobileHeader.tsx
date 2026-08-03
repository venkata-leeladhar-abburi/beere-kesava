import React from "react";
import { Bell, ChevronLeft, Flower2, LogOut, UserRound } from "lucide-react";
import { C, F } from "./theme";

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
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, width: 32, display: "flex", alignItems: "center" }}>
        <Flower2 size={22} color="rgba(255,255,255,0.90)" />
      </button>
      <div style={{ flex: 1, textAlign: "center" as const, fontFamily: F.d, fontWeight: 600, fontSize: 17, color: "#FFF" }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" as const, width: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={21} color="rgba(255,255,255,0.90)" />
          <span style={{ position: "absolute" as const, top: 4, right: 2, width: 8, height: 8, background: "#FF3B30", borderRadius: "50%" }} />
        </button>
        <div style={{ position: "relative" as const }}>
          <button onClick={() => setShowProfile(v => !v)} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.30)", background: "rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 11, color: "#FFF" }}>PS</span>
          </button>
          {showProfile && (
            <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.18)", minWidth: 200, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", background: "rgba(0,128,128,0.05)", borderBottom: `1px solid ${C.bdr}` }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Priya Sharma</div>
                <div style={{ fontFamily: F.m, fontSize: 10.5, color: C.muted, marginTop: 2 }}>SS-001 · Shop Staff</div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <button onClick={() => { setShowProfile(false); setShowProfileModal(true); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                  <UserRound size={14} color={C.muted} /> View Profile
                </button>
                {localStorage.getItem("bk_original_admin_role") ? (
                  <button onClick={() => {
                    setShowProfile(false);
                    const origAdminRole = localStorage.getItem("bk_original_admin_role");
                    if (origAdminRole) {
                      localStorage.removeItem("bk_original_admin_role");
                      selectRole(origAdminRole as any);
                      routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                    }
                  }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                    <ChevronLeft size={14} color={C.muted} /> My Portal
                  </button>
                ) : (
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.text, textAlign: "left" as const }}>
                    <ChevronLeft size={14} color={C.muted} /> Switch Portal
                  </button>
                )}
                <button onClick={() => { setShowProfile(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
                  <LogOut size={14} color="#C0392B" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { TabId };
