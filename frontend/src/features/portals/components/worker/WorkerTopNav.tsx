import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion } from "motion/react";
import {
  User, Bell, ChevronDown, LogOut,
  Home, Search, Users, Sparkles, Truck,
} from "lucide-react";
import { C, F } from "./tokens";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import type { IconComponent } from "../../../../lib/icon";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "profile";
type NavTab = "home" | "qc" | "weavers" | "finishing" | "dispatch";

const TOPNAV_ITEMS: { id: NavTab; Icon: IconComponent; label: string; badge?: number }[] = [
  { id: "home",      Icon: Home,     label: "Home" },
  { id: "qc",        Icon: Search,   label: "Quality Check", badge: 6 },
  { id: "weavers",   Icon: Users,    label: "Receive Sarees" },
  { id: "finishing", Icon: Sparkles, label: "Finishing" },
  { id: "dispatch",  Icon: Truck,    label: "Dispatch" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface WorkerTopNavProps {
  active: Tab;
  onSelect: (t: Tab) => void;
  onBack?: () => void;
  bp: "tablet" | "desktop";
}

export function WorkerTopNav({ active, onSelect, onBack, bp }: WorkerTopNavProps) {
  const { selectRole } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const isTablet = bp === "tablet";

  const closeAll = () => { setShowNotif(false); setShowUser(false); };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "sticky", top: 0, zIndex: 100, height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 20,
        padding: isTablet ? "0 24px" : "0 40px",
        background: "rgba(255,253,249,0.97)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(110,15,45,0.08)",
        boxShadow: "0 2px 24px rgba(74,6,27,0.06)",
      }}
    >
      {/* Logo + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", flexShrink: 0, boxShadow: "0 3px 12px rgba(110,15,45,0.16)", border: "1.5px solid rgba(200,155,71,0.28)" }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        {!isTablet && (
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.dark, lineHeight: 1.1 }}>Beere Kesava</div>
            <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 12, color: C.dark, marginTop: 1 }}>&amp; Brothers Silks</div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.gold, letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>Worker Staff</div>
          </div>
        )}
      </div>

      {/* Nav tabs */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: isTablet ? 2 : 6, overflowX: "auto", minWidth: 0 }}>
        {TOPNAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                padding: isTablet ? "8px 12px" : "9px 16px", borderRadius: 10,
                border: "none", borderBottom: isActive ? `2.5px solid ${C.burg}` : "2.5px solid transparent",
                background: isActive ? "rgba(107,26,42,0.06)" : "transparent",
                cursor: "pointer", position: "relative" as const,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(107,26,42,0.03)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <item.Icon size={isTablet ? 15 : 16} color={isActive ? C.burg : C.muted} />
              <span style={{ fontFamily: F.u, fontSize: isTablet ? 13 : 14, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.text, whiteSpace: "nowrap" as const }}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF", background: C.crim, minWidth: 18, height: 18, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Bell */}
        <div style={{ position: "relative" }}>
          <motion.button onClick={() => { setShowNotif(p => !p); setShowUser(false); }}
            whileHover={{ scale: 1.05, backgroundColor: "rgba(110,15,45,0.05)" }}
            whileTap={{ scale: 0.95 }}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid rgba(110,15,45,0.10)`, backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Bell size={15} color={C.muted} />
          </motion.button>
          <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: C.crim, border: "1.5px solid #FFFDF9" }} />
          {showNotif && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>Notifications</span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>Mark all read</span>
              </div>
              {[
                { emoji: "🔍", title: "6 sarees awaiting QC", desc: "BATCH-086, BATCH-081 need inspection", time: "Now" },
                { emoji: "🧵", title: "8 sarees received from weavers", desc: "Ready to record weight and details", time: "1h ago" },
                { emoji: "✅", title: "6 sarees cleared QC", desc: "BATCH-086 ready for stock", time: "2h ago" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < 2 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{n.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{n.desc}</div>
                  </div>
                  <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker avatar + name */}
        <div style={{ position: "relative" }}>
          <motion.div
            onClick={() => { setShowUser(p => !p); setShowNotif(false); }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.04)" }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px 5px 5px", borderRadius: 10, border: `1px solid rgba(110,15,45,0.10)`, backgroundColor: "rgba(110,15,45,0.02)" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.burg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFF" }}>RK</span>
            </div>
            <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.dark }}>Ravi Kumar</span>
            <ChevronDown size={12} color={C.muted} />
          </motion.div>
          {showUser && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 210, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
                <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.dark }}>Ravi Kumar</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>WK-042 · Floor Supervisor</div>
              </div>
              <button onClick={() => { onSelect("profile"); closeAll(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.dark, textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <User size={14} color={C.muted} /> My Profile
              </button>
              {localStorage.getItem("bk_original_admin_role") ? (
                <button onClick={() => {
                  closeAll();
                  const origAdminRole = localStorage.getItem("bk_original_admin_role");
                  if (origAdminRole) {
                    localStorage.removeItem("bk_original_admin_role");
                    selectRole(origAdminRole as any);
                    navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                  }
                }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: `1px solid rgba(110,15,45,0.08)`, cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <LogOut size={14} color={C.muted} /> My Portal
                </button>
              ) : (
                <button onClick={() => { closeAll(); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", borderTop: `1px solid rgba(110,15,45,0.08)`, cursor: "pointer", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <LogOut size={14} color={C.muted} /> Switch Portal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
