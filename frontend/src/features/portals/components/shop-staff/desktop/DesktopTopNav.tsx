import React from "react";
import { Bell, ChevronLeft, LogOut, RotateCcw, Search, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, TEAL } from "../theme";

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
    <div style={{ background: C.white, borderBottom: `1px solid ${C.bdr}`, position: "sticky" as const, top: 0, zIndex: 200, boxShadow: "0 1px 10px rgba(107,26,42,0.07)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: isTablet ? "0 24px" : "0 48px", display: "flex", alignItems: "center", height: 64, gap: isTablet ? 16 : 28 }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.bdr}`, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!isTablet && (
            <div>
              <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#2C1810", lineHeight: 1.1, textTransform: "uppercase" as const }}>Beere Kesava</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 400, color: "#3B2314", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 1 }}>And Brothers Silks</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: 2.5, textTransform: "uppercase" as const, marginTop: 4 }}>SHOP STAFF PORTAL</div>
            </div>
          )}
        </div>
        <nav className="shop-topnav-groups" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center", gap: 2, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.shop-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActive(tab.id); }} style={{
              display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 12px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
              fontFamily: F.u, fontSize: 14, fontWeight: active === tab.id && !showReturn ? 600 : 400,
              color: active === tab.id && !showReturn ? TEAL : C.muted,
              borderBottom: active === tab.id && !showReturn ? `3px solid ${TEAL}` : "2px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap" as const,
            }}
              onMouseEnter={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = TEAL; }}
              onMouseLeave={e => { if (!(active === tab.id && !showReturn)) e.currentTarget.style.color = C.muted; }}>
              {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, color: active === tab.id && !showReturn ? TEAL : C.muted })}
              {isTablet ? (tab.id === "inventory" ? "Stock" : tab.id === "sale" ? "Sale" : tab.label) : tab.label}
            </button>
          ))}
          <button onClick={() => setShowReturn(true)} style={{
            display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 12px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
            fontFamily: F.u, fontSize: 14, fontWeight: showReturn ? 600 : 400, color: showReturn ? C.crim : C.muted,
            borderBottom: showReturn ? `2px solid ${C.crim}` : "2px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" as const,
          }}
            onMouseEnter={e => { if (!showReturn) e.currentTarget.style.color = C.crim; }}
            onMouseLeave={e => { if (!showReturn) e.currentTarget.style.color = C.muted; }}>
            <RotateCcw size={16} color={showReturn ? C.crim : C.muted} /> Process Return
          </button>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ position: "relative" as const }}>
            <Search size={14} color={C.muted} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: isTablet ? 140 : 200, height: 38, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 999, padding: "0 14px 0 38px", fontFamily: F.u, fontSize: 13, color: C.text, outline: "none" }} />
          </div>
          <button style={{ position: "relative" as const, background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center" }}>
            <Bell size={20} color={C.muted} />
            <span style={{ position: "absolute" as const, top: 4, right: 4, width: 10, height: 10, background: "#FF3B30", borderRadius: "50%", border: "2px solid #FFF" }} />
          </button>
          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, letterSpacing: "1px", textTransform: "uppercase" as const, color: TEAL, background: "rgba(15,118,110,0.10)", border: `1px solid rgba(15,118,110,0.25)`, borderRadius: 999, padding: "5px 12px" }}>
            Shop Staff
          </span>
          <div style={{ position: "relative" as const }}>
            <button onClick={() => setShowProfile(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: showProfile ? "rgba(0,128,128,0.12)" : "rgba(0,128,128,0.07)", border: `1px solid ${showProfile ? "#008080" : "rgba(0,128,128,0.20)"}`, borderRadius: 999, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#008080", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>PS</span>
              </div>
              <div style={{ textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Priya Sharma</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>SS · Shop Staff</div>
              </div>
              <ChevronLeft size={13} color={C.muted} style={{ transform: "rotate(-90deg)", transition: "transform 0.2s" }} />
            </button>
            {showProfile && (
              <div style={{ position: "absolute" as const, top: "calc(100% + 8px)", right: 0, zIndex: 300, background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
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
                  <button onClick={() => { setShowProfile(false); setShowProfileModal(true); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <UserRound size={15} color={C.muted} /> View Profile
                  </button>
                  <div style={{ height: 1, background: C.bdr, margin: "4px 0" }} />
                  {localStorage.getItem("bk_original_admin_role") ? (
                    <button onClick={() => {
                      setShowProfile(false);
                      const origAdminRole = localStorage.getItem("bk_original_admin_role");
                      if (origAdminRole) {
                        localStorage.removeItem("bk_original_admin_role");
                        selectRole(origAdminRole as any);
                        routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                      }
                    }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <ChevronLeft size={15} color={C.muted} /> My Portal
                    </button>
                  ) : (
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,128,128,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <ChevronLeft size={15} color={C.muted} /> Switch Portal
                    </button>
                  )}
                  <button onClick={() => { setShowProfile(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <LogOut size={15} color="#C0392B" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
