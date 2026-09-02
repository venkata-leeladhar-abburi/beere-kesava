import React from "react";
import { motion } from "motion/react";
import { Bell, ChevronLeft, ChevronRight, LogOut, RotateCcw, UserRound, ChevronDown } from "lucide-react";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F } from "../theme";
import { staffIdentitySubtitle, useAdminStaffView } from "@/shared/ui/portal/AdminStaffView";
import { useAuth } from "../../../../../contexts/AuthContext";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../../shared/ui/overlay";
import type { Role } from "../../../../../contexts/AuthContext";
import { CATEGORY_ACCENT, CATEGORY_ICON, useShopNotifications } from "../notificationsModel";
import { usePendingShopDispatchCount } from "../IncomingDispatchSection";
import { toInitials } from "@/shared/lib/initials";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function DesktopTopNav({
  isTablet, TABS, active, showReturn, showNotifications, setActive, setShowReturn,
  showProfile, setShowProfile, setShowProfileModal,
  handleLogout, selectRole, routerNavigate,
}: {
  isTablet: boolean;
  TABS: { id: TabId; label: string; icon: React.ReactNode }[];
  active: TabId;
  showReturn: boolean;
  showNotifications: boolean;
  setActive: (tab: TabId) => void;
  setShowReturn: (val: boolean) => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfileModal: (v: boolean) => void;
  onBack?: () => void;
  handleLogout: () => void;
  selectRole: (role: Role) => void;
  routerNavigate: (path: string) => void;
}) {
  const { user } = useAuth();
  const { adminViewingAs } = useAdminStaffView();
  const name = user?.name || "Naidu PAVAN";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "NP";
  const { notifications, unreadCount, markAllRead, markRead } = useShopNotifications(20);
  const pendingReceipts = usePendingShopDispatchCount();
  const recent = notifications.slice(0, 8);

  return (
    <div style={{ background: "#2A0815", borderBottom: "1px solid rgba(200,155,71,0.14)", position: "sticky" as const, top: 0, zIndex: "var(--z-nav)", boxShadow: "0 4px 40px rgba(0,0,0,0.28)" }}>
      <div style={{ padding: isTablet ? "0 20px" : "0 56px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, gap: isTablet ? 12 : 24 }}>
        {/* Brand Lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: isTablet ? 10 : 14, flexShrink: 0 }}>
          <div style={{ width: isTablet ? 40 : 52, height: isTablet ? 40 : 52, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.30)", boxShadow: "0 4px 16px rgba(0,0,0,0.30)", flexShrink: 0 }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!isTablet && (
            <div>
              <div style={{ fontFamily: F.d, fontSize: 16, fontWeight: 600, color: "#F5E8D0", lineHeight: 1, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Beere Kesava</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 400, color: "rgba(245,232,208,0.75)", letterSpacing: 1.6, textTransform: "uppercase" as const, marginTop: 2 }}>And Brothers Silks</div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#C89B47", letterSpacing: 3, textTransform: "uppercase" as const, marginTop: 2 }}>Shop Staff</div>
            </div>
          )}
        </div>

        {/* Center Nav Items */}
        <nav className="shop-topnav-groups" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, overflowX: "auto", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.shop-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {TABS.map(tab => {
            const isActive = active === tab.id && !showReturn && !showNotifications;
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
                    ? "bg-[rgba(110,15,45,0.45)] font-semibold !text-[#E7C983] hover:!bg-[rgba(110,15,45,0.55)] hover:!text-[#E7C983]"
                    : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#E7C983]")
                }
              >
                {React.cloneElement(tab.icon as React.ReactElement<{ size?: number; color?: string }>, { size: 16, color: isActive ? "#E7C983" : "rgba(245,232,208,0.80)" })}
                {isTablet ? (tab.id === "inventory" ? "Stock" : tab.id === "sale" ? "Sale" : tab.label) : tab.label}
                {/* Consignments waiting to be received sit under Inventory and
                    are invisible everywhere else — they are not stock yet. */}
                {tab.id === "inventory" && pendingReceipts > 0 && (
                  <span
                    aria-label={`${pendingReceipts} consignment(s) to receive`}
                    style={{
                      marginLeft: 2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                      background: "#C89B47", color: "#2A0815", fontSize: 11, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {pendingReceipts}
                  </span>
                )}
              </Button>
            );
          })}
          <Button
            onClick={() => setShowReturn(true)}
            variant="ghost"
            className={
              "flex items-center gap-2 shrink-0 h-10 border-none rounded-[10px] whitespace-nowrap " +
              (isTablet ? "px-3 " : "px-4 ") +
              (showReturn && !showNotifications
                ? "bg-[rgba(192,57,43,0.28)] font-semibold !text-[#FFB3AA] hover:!bg-[rgba(192,57,43,0.36)] hover:!text-[#FFB3AA]"
                : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#FFB3AA]")
            }
          >
            <RotateCcw size={16} color={showReturn && !showNotifications ? "#FFB3AA" : "rgba(245,232,208,0.80)"} /> Process Return
          </Button>
        </nav>

        {/* Right Actions: Notifications Bell & User Profile Capsule */}
        <div style={{ display: "flex", alignItems: "center", gap: isTablet ? 8 : 12, flexShrink: 0 }}>
          {/* Notifications Dropdown (Desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div style={{ position: "relative" as const, cursor: "pointer" }}>
                <IconButton icon={Bell} label="Notifications" variant="ghost" className={"rounded-[10px] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#E7C983] " + (showNotifications ? "!bg-[rgba(110,15,45,0.45)] !text-[#E7C983]" : "!text-[#F5E8D0]")} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute" as const, top: 4, right: 4, width: 8, height: 8, background: "#F47B72", borderRadius: "50%", pointerEvents: "none" as const }} />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!w-[340px] !max-w-[340px] !p-0 !rounded-[14px] !overflow-hidden !max-h-[min(70vh,520px)] flex flex-col" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.12)`, zIndex: 2000 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className={`p-0 h-auto text-[12px] ${unreadCount > 0 ? "text-[#C89B47]" : "text-[#69635E]"}`}
                >
                  Mark all read
                </Button>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" as const }}>
                {recent.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 13, color: C.muted }}>
                    No notifications.
                  </div>
                ) : (
                  recent.map((n, i) => (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => markRead(n)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); markRead(n); } }}
                      style={{ padding: "10px 16px", borderBottom: i < recent.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: n.unread ? "rgba(200,155,71,0.06)" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = n.unread ? "rgba(200,155,71,0.06)" : "transparent"}
                    >
                      <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${CATEGORY_ACCENT[n.category]}14`, border: `1px solid ${CATEGORY_ACCENT[n.category]}2E` }}>
                        {React.createElement(CATEGORY_ICON[n.category], { size: 16, color: CATEGORY_ACCENT[n.category] })}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{n.desc}</div>
                      </div>
                      <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              {/* A DropdownMenuItem, not a bare <button>: Radix owns closing the
                  menu on select, so the navigation isn't raced by the dismiss. */}
              <DropdownMenuItem
                onSelect={() => routerNavigate("/shop/notifications")}
                className="!h-auto !py-3 !px-4 !justify-center !gap-1.5 !shrink-0 !text-[13px] !font-bold !text-[#6E0F2D] !bg-[rgba(110,15,45,0.04)] border-t border-[rgba(110,15,45,0.08)]"
              >
                View all notifications <ChevronRight size={15} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.12)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "5px 12px 5px 6px",
                  borderRadius: 12,
                  border: `1px solid ${showProfile ? "#C89B47" : "rgba(200,155,71,0.25)"}`,
                  backgroundColor: showProfile ? "rgba(245,232,208,0.12)" : "rgba(245,232,208,0.04)",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #6E0F2D 0%, #8B1A30 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(0,0,0,0.30)", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: "#FFFDF9" }}>{toInitials(initials)}</span>
                </div>
                <div style={{ textAlign: "left" as const, paddingRight: 2 }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", lineHeight: 1.1 }}>{name}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(245,232,208,0.70)", marginTop: 2 }}>Shop Staff</div>
                </div>
                <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: C.white, border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: "16px 18px", background: "rgba(200,155,71,0.08)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#6E0F2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(110,15,45,0.28)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>{toInitials(initials)}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{staffIdentitySubtitle({ adminViewingAs, portalLabel: "Shop Staff", fallback: "Shop Staff" })}</div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <DropdownMenuItem onClick={() => { setShowProfile(false); setShowProfileModal(true); }} className="!h-auto !py-2.5 !px-[18px] !text-sm !text-[#1A0A0F]">
                  <UserRound size={15} color={C.muted} /> View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {localStorage.getItem("bk_original_admin_role") && (
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
