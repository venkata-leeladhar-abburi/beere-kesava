import React, { useEffect, useState } from "react";
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Popover } from "../../../../shared/ui/overlay";
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

export function WorkerTopNav({ active, onSelect, bp, pendingQcCount = 0 }: WorkerTopNavProps) {
  const { user, logout } = useAuth();
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

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "sticky", top: 0, zIndex: "var(--z-nav)", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 20,
        padding: isTablet ? "0 24px" : "0 56px",
        // Same dark-burgundy chrome as the admin topnav (beere-dashboard/
        // components/TopNav.tsx) — the worker portal used to invert this to a
        // pale bar, which was the single most visible split between the two.
        background: C.dark,
        borderBottom: "1px solid rgba(200,155,71,0.14)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.28)",
      }}
    >
      {/* Logo + brand — admin's three-line lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: isTablet ? 10 : 14, flexShrink: 0 }}>
        <div style={{ width: isTablet ? 40 : 52, height: isTablet ? 40 : 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.30)", border: "1.5px solid rgba(200,155,71,0.30)" }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {!isTablet && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 16, color: C.cream, letterSpacing: "0.5px", lineHeight: 1, textTransform: "uppercase" }}>Beere Kesava</div>
            <div style={{ fontFamily: F.u, fontWeight: 400, fontSize: 12, color: "rgba(245,232,208,0.75)", letterSpacing: "1.6px", textTransform: "uppercase" }}>And Brothers Silks</div>
            <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: C.gold, letterSpacing: "3px", textTransform: "uppercase" }}>Worker Staff</div>
          </div>
        )}
      </div>

      {/* Nav tabs */}
      <div className="scrollbar-none" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: isTablet ? 2 : 6, overflowX: isTablet ? "auto" : "hidden", minWidth: 0, scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {topNavItems(pendingQcCount).map(item => {
          const isActive = active === item.id;
          return (
            <Button
              key={item.id}
              variant="tertiary"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex-shrink-0 gap-2 rounded-[10px] border-0 relative hover:!text-[#E7C983] ${isTablet ? "px-3 py-2" : "px-4 py-2.5"} ${isActive ? "bg-[rgba(200,155,71,0.16)] hover:!bg-[rgba(200,155,71,0.22)]" : "bg-transparent hover:!bg-[rgba(245,232,208,0.10)]"}`}
            >
              <item.Icon size={isTablet ? 15 : 16} color={isActive ? C.goldL : "rgba(245,232,208,0.80)"} />
              <span style={{ fontFamily: F.u, fontSize: isTablet ? 13 : 14, fontWeight: isActive ? 600 : 500, color: isActive ? C.goldL : "rgba(245,232,208,0.80)", whiteSpace: "nowrap" as const }}>
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
        <Popover open={showNotif} onOpenChange={o => { setShowNotif(o); if (o) setShowUser(false); }}>
          <Popover.Trigger asChild>
            <motion.div
              whileHover={{ scale: 1.05, backgroundColor: "rgba(245,232,208,0.08)" }}
              whileTap={{ scale: 0.95 }}
              style={{ borderRadius: 10, display: "inline-block", position: "relative" }}
            >
              <IconButton icon={Bell} label="Notifications" variant="secondary"
                className="w-9 h-9 rounded-[10px] border-[rgba(200,155,71,0.22)] bg-transparent text-[#F5E8D0]" />
              <div style={{ position: "absolute", top: 5, right: 5, width: 8, height: 8, borderRadius: "50%", background: "#F47B72", border: `1.5px solid ${C.dark}`, pointerEvents: "none" }} />
            </motion.div>
          </Popover.Trigger>
          <Popover.Content align="end" sideOffset={10} className="!w-[300px] !max-w-[300px] !p-0 !overflow-hidden">
            <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>Notifications</span>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>Mark all read</span>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 13, color: C.muted }}>No notifications.</div>
            ) : notifications.map((n, i) => (
              <div key={n.id} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); } }} style={{ padding: "10px 16px", borderBottom: i < notifications.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
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
          </Popover.Content>
        </Popover>

        {/* Worker avatar + name */}
        <DropdownMenu open={showUser} onOpenChange={o => { setShowUser(o); if (o) setShowNotif(false); }}>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 10px 5px 5px", borderRadius: 10, border: "1px solid rgba(200,155,71,0.22)", backgroundColor: "rgba(245,232,208,0.06)" }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.burg, border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials}</span>
              </div>
              <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.cream }}>{name}</span>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="!min-w-[210px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.12)`, zIndex: "var(--z-tooltip)" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)` }}>
              <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.dark }}>{name}</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>
            </div>
            <DropdownMenuItem onClick={() => onSelect("profile")} className="!h-auto !rounded-none !py-2.5 !px-4 !text-[13px] !text-[#1A0A0F]">
              <User size={14} color={C.muted} /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()} destructive className="!h-auto !rounded-none !py-2.5 !px-4 !text-[13px]">
              <LogOut size={14} color="#C0392B" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.nav>
  );
}
