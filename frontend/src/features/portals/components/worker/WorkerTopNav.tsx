import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion } from "motion/react";
import {
  User, Bell, ChevronLeft, LogOut,
  Home, Search, Users, Sparkles, Truck, Activity,
} from "lucide-react";
import { C, F } from "./tokens";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import type { IconComponent } from "../../../../lib/icon";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Popover } from "../../../../shared/ui/overlay";
import { formatRelativeTime, notificationBody, notificationTitle, useNotificationBell } from "@/features/notifications";
import { roleLabel, staffIdentitySubtitle, useAdminStaffView } from "@/shared/ui/portal/AdminStaffView";
import { toInitials } from "@/shared/lib/initials";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "activity" | "profile";
type NavTab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "activity";

function topNavItems(pendingQcCount: number): { id: NavTab; Icon: IconComponent; label: string; badge?: number }[] {
  return [
    { id: "home",      Icon: Home,     label: "Home" },
    { id: "qc",        Icon: Search,   label: "Quality Check", badge: pendingQcCount || undefined },
    { id: "weavers",   Icon: Users,    label: "Receive Sarees" },
    { id: "finishing", Icon: Sparkles, label: "Finishing" },
    { id: "dispatch",  Icon: Truck,    label: "Dispatch" },
    { id: "activity",  Icon: Activity, label: "Activity" },
  ];
}

function notifEmoji(type: string): string {
  if (type.includes("qc")) return "🔍";
  if (type.includes("receive") || type.includes("weaver")) return "🧵";
  if (type.includes("pass") || type.includes("complete")) return "✅";
  return "🔔";
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
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationBell();
  // An admin/superadmin can open this portal as themselves — the header must
  // say so rather than presenting them as Worker Staff.
  const { adminViewingAs, isAdminViewing, returnToAdmin } = useAdminStaffView();
  const isTablet = bp === "tablet";

  const name = user?.name || "—";
  const initials = initialsOf(name);
  const subtitle = staffIdentitySubtitle({
    adminViewingAs,
    portalLabel: "Worker Staff",
    fallback: user?.empId ? `${user.empId} · Worker Staff` : "Worker Staff",
  });

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
      <div
        className="no-scrollbar scrollbar-none"
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: isTablet ? "flex-start" : "center",
          flexWrap: "nowrap" as const, gap: isTablet ? 2 : 6, minWidth: 0,
          overflowX: "auto", scrollbarWidth: "none" as const, msOverflowStyle: "none" as const,
        }}>
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
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              style={{ borderRadius: 10, display: "inline-block", position: "relative", cursor: "pointer" }}
            >
              <IconButton
                icon={Bell}
                label="Notifications"
                variant="secondary"
                className="!size-9 !rounded-[10px] border border-[rgba(200,155,71,0.30)] bg-[rgba(245,232,208,0.06)] hover:!bg-[rgba(200,155,71,0.18)] text-[#F5E8D0] hover:!text-[#C89B47] transition-all duration-200"
              />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#C89B47", border: `1.5px solid ${C.dark}`, pointerEvents: "none" }} />
              )}
            </motion.div>
          </Popover.Trigger>
          <Popover.Content align="end" sideOffset={10} className="!w-[360px] !max-w-[calc(100vw-32px)] !p-0 !rounded-[16px] !overflow-hidden" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.14)`, boxShadow: "0 10px 36px rgba(44,24,16,0.18)", zIndex: 200 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFDF9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.dark }}>Notifications</span>
                <span style={{ background: "#6E0F2D", color: "#FFFFFF", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, borderRadius: 999, minWidth: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
                  {unreadCount > 0 ? unreadCount : notifications.length}
                </span>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={notifications.length === 0}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontFamily: F.u,
                  fontSize: 12,
                  fontWeight: 600,
                  color: notifications.length > 0 ? "#C89B47" : "#A39E98",
                  cursor: notifications.length > 0 ? "pointer" : "default",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={e => { if (notifications.length > 0) e.currentTarget.style.color = "#A87B27"; }}
                onMouseLeave={e => { if (notifications.length > 0) e.currentTarget.style.color = "#C89B47"; }}
              >
                Mark all read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
                No new notifications.
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {notifications.map((n, i) => {
                  const isUnread = n.readAt === null;
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${notificationTitle(n)}${isUnread ? " (unread)" : ""}`}
                      onClick={() => markRead(n.id)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); markRead(n.id); } }}
                      style={{
                        padding: "12px 18px",
                        borderBottom: i < notifications.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        background: isUnread ? "rgba(200,155,71,0.07)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = isUnread ? "rgba(200,155,71,0.07)" : "transparent"}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{notifEmoji(n.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: isUnread ? 700 : 500, color: C.dark, marginBottom: 2 }}>
                          {notificationTitle(n)}
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>
                          {notificationBody(n)}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{formatRelativeTime(n.createdAt)}</span>
                        {isUnread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6E0F2D" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{toInitials(initials)}</span>
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
            {isAdminViewing && (
              <DropdownMenuItem onClick={returnToAdmin} className="!h-auto !rounded-none !py-2.5 !px-4 !text-[13px] !text-[#1A0A0F]">
                <ChevronLeft size={14} color={C.muted} /> Return to {roleLabel(adminViewingAs)}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => logout()} destructive className="!h-auto !rounded-none !py-2.5 !px-4 !text-[13px]">
              <LogOut size={14} color="#C0392B" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.nav>
  );
}
