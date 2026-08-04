import React from "react";
import { Bell, ChevronLeft, LogOut, Search, UserRound } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F, Tab5 } from "../theme";

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
          {NAV.map(tab => (
            <button key={tab.id} onClick={() => { setActive(tab.id); setShowNotifs(false); }} style={{
              display: "flex", alignItems: "center", gap: 7, flexShrink: 0, padding: isTablet ? "0 10px" : "0 18px", height: 64, border: "none", background: "transparent", cursor: "pointer",
              fontFamily: F.u, fontSize: 14, fontWeight: active === tab.id && !showNotifs ? 600 : 400,
              color: active === tab.id && !showNotifs ? C.text : C.muted,
              borderBottom: active === tab.id && !showNotifs ? `2px solid ${C.burg}` : "2px solid transparent",
              transition: "all 0.15s", whiteSpace: "nowrap" as const,
            }}
            onMouseEnter={e => { if (!(active === tab.id && !showNotifs)) e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { if (!(active === tab.id && !showNotifs)) e.currentTarget.style.color = C.muted; }}>
              {React.cloneElement(tab.icon as React.ReactElement<any>, { color: active === tab.id && !showNotifs ? C.burg : C.muted })}
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ position: "relative" as const }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: isTablet ? 140 : 200, height: 38, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 999, padding: "0 14px 0 38px", fontFamily: F.u, fontSize: 13, color: C.text, outline: "none" }} />
            <Search size={14} color={C.muted} style={{ position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)" }} />
          </div>
          <button onClick={() => setShowNotifs(v => !v)} style={{ position: "relative" as const, background: showNotifs ? "rgba(107,26,42,0.08)" : "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center" }}>
            <Bell size={20} color={showNotifs ? C.burg : C.muted} />
            <span style={{ position: "absolute" as const, top: 4, right: 4, width: 10, height: 10, background: "#FF3B30", borderRadius: "50%", border: "2px solid #FFF" }} />
          </button>
          <div style={{ position: "relative" as const }}>
            <button onClick={() => setShowProfile(p => !p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: showProfile ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.06)", border: `1px solid ${showProfile ? C.burg : C.bdr}`, borderRadius: 999, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>RK</span>
              </div>
              <div style={{ textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Ravi Kumar</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>WVR-014 · Handloom</div>
              </div>
              <ChevronLeft size={13} color={C.muted} style={{ transform: showProfile ? "rotate(-90deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
            </button>
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
                  <button onClick={() => { setShowProfile(false); onProfile?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
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
                        navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                      }
                    }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <ChevronLeft size={15} color={C.muted} /> My Portal
                    </button>
                  ) : (
                    <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: C.text, textAlign: "left" as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(107,26,42,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <ChevronLeft size={15} color={C.muted} /> Switch Portal
                    </button>
                  )}
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.u, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
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
