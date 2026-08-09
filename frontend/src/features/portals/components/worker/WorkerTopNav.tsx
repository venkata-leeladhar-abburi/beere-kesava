import React, { useEffect, useState } from "react";
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
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { BackendNotification, notificationsApi } from "../../../../shared/api/notifications";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "profile";
type NavTab = "home" | "qc" | "weavers" | "finishing" | "dispatch";

function topNavItems(pendingQcCount: number): { id: NavTab; Icon: IconComponent; label: string; badge?: number }[] {
  return [
    { id: "home",      Icon: Home,     label: "Home" },
    { id: "qc",        Icon: Search,   label: "Quality Check", badge: pendingQcCount || undefined },
    { id: "weavers",   Icon: Users,    label: "Receive Sarees" },
    { id: "finishing", Icon: Sparkles, label: "Finishing" },
    { id: "dispatch",  Icon: Truck,    label: "Dispatch" },
  ];
}

function notifEmoji(type: string): string {
  if (type.includes("qc")) return "🔍";
  if (type.includes("receive") || type.includes("weaver")) return "🧵";
  if (type.includes("pass") || type.includes("complete")) return "✅";
  return "🔔";
}

function formatRelativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface WorkerTopNavProps {
  active: Tab;
  onSelect: (t: Tab) => void;
  onBack?: () => void;
  bp: "tablet" | "desktop";
  pendingQcCount?: number;
}

function initialsOf(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "—";
}

export function WorkerTopNav({ active, onSelect, onBack, bp, pendingQcCount = 0 }: WorkerTopNavProps) {
  const { selectRole, user } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const isTablet = bp === "tablet";

  useEffect(() => {
    notificationsApi.list({ role: "WORKER", pageSize: 5 })
      .then(res => setNotifications(res.items))
      .catch(() => setNotifications([]));
  }, []);

  const name = user?.name || "—";
  const initials = initialsOf(name);
  const subtitle = user?.empId ? `${user.empId} · Worker Staff` : "Worker Staff";

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
        {topNavItems(pendingQcCount).map(item => {
          const isActive = active === item.id;
          return (
            <Button
              key={item.id}
              variant="tertiary"
              onClick={() => onSelect(item.id)}
              className={`flex-shrink-0 gap-2 rounded-[10px] border-0 border-b-[2.5px] relative ${isTablet ? "px-3 py-2" : "px-4 py-2.5"} ${isActive ? "border-b-[#6B1A2A] bg-[rgba(107,26,42,0.06)]" : "border-b-transparent bg-transparent"}`}
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
            </Button>
          );
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Bell */}
        <div style={{ position: "relative" }}>
          <motion.div
            whileHover={{ scale: 1.05, backgroundColor: "rgba(110,15,45,0.05)" }}
            whileTap={{ scale: 0.95 }}
            style={{ borderRadius: 10, display: "inline-block" }}
          >
            <IconButton icon={Bell} label="Notifications" variant="secondary" onClick={() => { setShowNotif(p => !p); setShowUser(false); }}
              className="w-9 h-9 rounded-[10px] border-[rgba(110,15,45,0.10)] bg-transparent" />
          </motion.div>
          <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: C.crim, border: "1.5px solid #FFFDF9" }} />
          {showNotif && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>Notifications</span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>Mark all read</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 13, color: C.muted }}>No notifications.</div>
              ) : notifications.map((n, i) => (
                <div key={n.id} style={{ padding: "10px 16px", borderBottom: i < notifications.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{notifEmoji(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{n.type.replace(/_/g, " ")}</div>
                    {n.payload && Object.keys(n.payload).length > 0 && (
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{JSON.stringify(n.payload)}</div>
                    )}
                  </div>
                  <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{formatRelativeTime(n.createdAt)}</span>
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
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials}</span>
            </div>
            <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.dark }}>{name}</span>
            <ChevronDown size={12} color={C.muted} />
          </motion.div>
          {showUser && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 210, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 12px 40px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
                <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.dark }}>{name}</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>
              </div>
              <Button variant="tertiary" fullWidth iconLeft={User} onClick={() => { onSelect("profile"); closeAll(); }}
                className="justify-start gap-2 rounded-none border-0 px-4 py-2.5 text-[13px] text-[#1A0A0F]">
                My Profile
              </Button>
              {localStorage.getItem("bk_original_admin_role") ? (
                <Button variant="tertiary" fullWidth iconLeft={LogOut} onClick={() => {
                  closeAll();
                  const origAdminRole = localStorage.getItem("bk_original_admin_role");
                  if (origAdminRole) {
                    localStorage.removeItem("bk_original_admin_role");
                    selectRole(origAdminRole as any);
                    navigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                  }
                }} className="justify-start gap-2 rounded-none border-0 border-t border-[rgba(110,15,45,0.08)] px-4 py-2.5 text-[13px] text-[#69635E]">
                  My Portal
                </Button>
              ) : (
                <Button variant="tertiary" fullWidth iconLeft={LogOut} onClick={() => { closeAll(); onBack?.(); }}
                  className="justify-start gap-2 rounded-none border-0 border-t border-[rgba(110,15,45,0.08)] px-4 py-2.5 text-[13px] text-[#69635E]">
                  Switch Portal
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
