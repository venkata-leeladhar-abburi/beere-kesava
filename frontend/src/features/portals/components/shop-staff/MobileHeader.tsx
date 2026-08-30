import React, { useState } from "react";
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, UserRound, Home, ShoppingBag, Package, Users, BarChart2, RotateCcw, X } from "lucide-react";
import { staffIdentitySubtitle, useAdminStaffView } from "@/shared/ui/portal/AdminStaffView";
import { C, F } from "./theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";
import { Drawer } from "../../../../shared/ui/overlay/Drawer";
import * as Dialog from "@radix-ui/react-dialog";
import type { Role } from "../../../../contexts/AuthContext";
import { CATEGORY_ACCENT, CATEGORY_ICON, useShopNotifications } from "./notificationsModel";
import { toInitials } from "@/shared/lib/initials";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function MobileHeader({
  title, activeTab, setActive, setShowReturn, showProfile, setShowProfile, setShowProfileModal, handleLogout, selectRole, routerNavigate,
}: {
  title: string;
  onBack?: () => void;
  activeTab?: TabId;
  setActive?: (tab: TabId) => void;
  setShowReturn?: (v: boolean) => void;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfileModal: (v: boolean) => void;
  handleLogout: () => void;
  selectRole: (role: Role) => void;
  routerNavigate: (path: string) => void;
}) {
  const { user } = useAuth();
  const { adminViewingAs } = useAdminStaffView();
  const name = user?.name || "Shop Staff";
  const initials = name === "Shop Staff" ? "SS" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [openDrawer, setOpenDrawer] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useShopNotifications(20);
  const recent = notifications.slice(0, 8);

  const NAV_ITEMS = [
    { id: "home" as TabId, label: "Home", icon: Home },
    { id: "sale" as TabId, label: "New Sale", icon: ShoppingBag },
    { id: "inventory" as TabId, label: "Shop Inventory", icon: Package },
    { id: "customers" as TabId, label: "Customers", icon: Users },
    { id: "reports" as TabId, label: "Sales Reports", icon: BarChart2 },
  ];

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(255,253,249,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `2px solid rgba(200,155,71,0.40)`,
          boxShadow: "0 2px 20px rgba(74,6,27,0.05)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton
            icon={Menu}
            label="Open menu"
            onClick={() => setOpenDrawer(true)}
            variant="ghost"
            className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#1A0A0F]"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.30)` }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.dark, lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: C.muted }}>Shop Staff · {title}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(110,15,45,0.14)",
                  background: "#FFFDF9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "pointer",
                  color: "#1A0A0F",
                  boxShadow: "0 2px 6px rgba(74,6,27,0.06)",
                  outline: "none",
                }}
              >
                <Bell size={18} color="#4A061B" />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#F47B72", border: "1.5px solid #FFFDF9" }} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!w-[min(340px,calc(100vw-24px))] !max-w-[calc(100vw-24px)] !p-0 !rounded-[14px] !overflow-hidden !max-h-[min(70vh,520px)] flex flex-col" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.12)`, zIndex: 2000 }}>
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

          {/* Profile Dropdown */}
          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="User menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(200,155,71,0.50)",
                  background: "#6E0F2D",
                  color: "#FFFDF9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(110,15,45,0.20)",
                  outline: "none",
                }}
              >
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 13, color: "#FFFDF9" }}>{toInitials(initials)}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[220px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFFDF9", border: `1px solid ${C.bdr}`, zIndex: 2000 }}>
              <div style={{ padding: "14px 16px", background: "rgba(110,15,45,0.04)", borderBottom: `1px solid ${C.bdr}` }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{staffIdentitySubtitle({ adminViewingAs, portalLabel: "Shop Staff", fallback: user?.empId ? `${user.empId} · Shop Staff` : "Shop Staff" })}</div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#3B2314]">
                  <UserRound size={14} color={C.muted} /> View Profile
                </DropdownMenuItem>
                {localStorage.getItem("bk_original_admin_role") && (
                  <DropdownMenuItem onClick={() => {
                    const origAdminRole = localStorage.getItem("bk_original_admin_role");
                    if (origAdminRole) {
                      localStorage.removeItem("bk_original_admin_role");
                      selectRole(origAdminRole as Role);
                      routerNavigate(origAdminRole === "superadmin" ? "/superadmin" : "/admin");
                    }
                  }} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#3B2314]">
                    <ChevronLeft size={14} color={C.muted} /> My Portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} destructive className="!h-auto !py-2.5 !px-4 !text-[13px]">
                  <LogOut size={14} color="#C0392B" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Side Navbar Drawer */}
      <Drawer open={openDrawer} onOpenChange={setOpenDrawer} side="left" size="sm">
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.dark }}>
          {/* Header matching Superadmin / Weaver / Worker drawer header */}
          <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid rgba(200,155,71,0.60)`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${C.dark} 0%, #6E0F2D 100%)`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)", flexShrink: 0 }}>
                <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <Dialog.Title asChild>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
                </Dialog.Title>
                <Dialog.Description className="sr-only">Shop staff portal navigation menu</Dialog.Description>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>SHOP STAFF</div>
              </div>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close menu"
                onClick={() => setOpenDrawer(false)}
                variant="ghost"
                className="!size-8 !rounded-[9px] border border-[rgba(245,232,208,0.20)] bg-[rgba(245,232,208,0.10)] text-[rgba(245,232,208,0.85)] hover:bg-[rgba(245,232,208,0.16)]"
              />
            </Dialog.Close>
          </div>

          {/* Menu Navigation Items */}
          <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              const ItemIcon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="tertiary"
                  fullWidth
                  onClick={() => {
                    setOpenDrawer(false);
                    if (setShowReturn) setShowReturn(false);
                    if (setActive) setActive(item.id);
                  }}
                  className={
                    "!justify-start !gap-3 !h-12 !px-4 !mb-1 !rounded-[12px] !border-none !text-sm !font-semibold transition-all " +
                    (isActive
                      ? "!bg-[rgba(200,155,71,0.22)] !text-[#E7C983]"
                      : "!bg-transparent !text-[rgba(255,253,249,0.75)] hover:!bg-[rgba(255,253,249,0.08)] hover:!text-[#FFFDF9]")
                  }
                >
                  <ItemIcon size={18} color={isActive ? "#E7C983" : "rgba(255,253,249,0.65)"} />
                  <span>{item.label}</span>
                </Button>
              );
            })}

            <Button
              variant="tertiary"
              fullWidth
              onClick={() => {
                setOpenDrawer(false);
                if (setShowReturn) setShowReturn(true);
              }}
              className="!justify-start !gap-3 !h-12 !px-4 !mb-1 !rounded-[12px] !border-none !text-sm !font-semibold !bg-transparent !text-[#FFB3AA] hover:!bg-[rgba(192,57,43,0.15)]"
            >
              <RotateCcw size={18} color="#FFB3AA" />
              <span>Process Return</span>
            </Button>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 4px" }} />

            <Button
              variant="tertiary"
              fullWidth
              onClick={() => {
                setOpenDrawer(false);
                setShowProfileModal(true);
              }}
              className="!justify-start !gap-3 !h-12 !px-4 !rounded-[12px] !border-none !text-sm !font-semibold !bg-transparent !text-[rgba(255,253,249,0.75)] hover:!bg-[rgba(255,253,249,0.08)]"
            >
              <UserRound size={18} color="rgba(255,253,249,0.65)" />
              <span>My Profile</span>
            </Button>
          </div>

          {/* Footer Card */}
          <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.20)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.burg, border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{toInitials(initials)}</span>
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFFDF9" }}>{name}</div>
                <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,253,249,0.50)" }}>Shop Staff</div>
              </div>
            </div>
            <IconButton
              icon={LogOut}
              label="Logout"
              onClick={() => { setOpenDrawer(false); handleLogout(); }}
              variant="ghost"
              className="!size-9 !rounded-[10px] text-[#F47B72] hover:bg-[rgba(244,123,114,0.15)]"
            />
          </div>
        </div>
      </Drawer>
    </>
  );
}

export type { TabId };
