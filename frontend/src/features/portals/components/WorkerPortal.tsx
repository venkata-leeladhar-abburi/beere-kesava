import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { scrollToTop } from "@/shared/ui/ScrollToTop";
import { useAuth } from "../../../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Home, Users, Bell, ChevronLeft, Menu, Search, X, UserRound, Sparkles, UserCheck, Truck, LogOut, Activity } from "lucide-react";
import { C, F } from "./worker/tokens";
import { Drawer, Popover } from "../../../shared/ui/overlay";
import { formatRelativeTime, notificationBody, notificationTitle, useNotificationBell } from "@/features/notifications";
import { AdminViewingBanner, roleLabel, staffIdentitySubtitle, useAdminStaffView } from "@/shared/ui/portal/AdminStaffView";
import { WorkerHome } from "./worker/WorkerHome";
import { WorkerWeavers } from "./worker/WorkerWeavers";
import { WorkerQC } from "./worker/WorkerQC";
import { WorkerFinishing } from "./worker/WorkerFinishing";
import { WorkerDispatch } from "./worker/WorkerDispatch";
import { WorkerActivity } from "./worker/WorkerActivity";
import { WorkerPortalDesktop } from "./WorkerPortalDesktop";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, WORKER_SECTION_NAV_H,
} from "../../../shared/ui/SectionNavigator";
import { useResponsive } from "../../../hooks/useResponsive";
import type { IconComponent } from "../../../lib/icon";
import { Button, IconButton } from "../../../shared/ui/primitives";

import { imgBKLogo } from "../../../shared/constants/weaverImages";
import { toInitials } from "@/shared/lib/initials";

type Tab = "home" | "qc" | "weavers" | "finishing" | "dispatch" | "activity" | "profile";

function notifEmoji(type: string): string {
  if (type.includes("qc")) return "🔍";
  if (type.includes("receive") || type.includes("weaver")) return "🧵";
  if (type.includes("pass") || type.includes("complete")) return "✅";
  return "🔔";
}

const TABS: { id: Tab; Icon: IconComponent; label: string; badge?: string }[] = [
  { id: "home",      Icon: Home,       label: "Home"          },
  { id: "qc",        Icon: Search,     label: "QC", badge: "6" },
  { id: "weavers",   Icon: Users,      label: "Receive"       },
  { id: "finishing", Icon: Sparkles,   label: "Finishing", badge: "2" },
  { id: "dispatch",  Icon: Truck,      label: "Dispatch"      },
];


interface WorkerPortalProps { onBack?: () => void }

function WorkerMobileTopNav({ onMenuOpen, onProfile }: { onMenuOpen: () => void; onProfile: () => void }) {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationBell();
  // An admin/superadmin can open this portal as themselves — say so instead
  // of presenting them as Worker Staff.
  const { adminViewingAs, isAdminViewing, returnToAdmin } = useAdminStaffView();

  const userName = user?.name || "Ravi Kumar";
  const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "RK";
  const subtitleText = staffIdentitySubtitle({
    adminViewingAs,
    portalLabel: "Worker Staff",
    fallback: user?.empId ? `Worker Staff · ${user.empId}` : "Worker Staff · Est. 1999",
  });

  return (
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
      <IconButton
        icon={Menu}
        label="Open menu"
        onClick={onMenuOpen}
        variant="ghost"
        className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#1A0A0F]"
      />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.30)` }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.dark, lineHeight: 1.1 }}>Beere Kesava</div>
          <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: C.muted }}>Worker Staff · Est. 1999</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Notifications Icon Button */}
        <Popover open={showNotif} onOpenChange={o => { setShowNotif(o); if (o) setShowProfileDropdown(false); }}>
          <Popover.Trigger asChild>
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              style={{ position: "relative", cursor: "pointer" }}
            >
              <IconButton
                icon={Bell}
                label="Notifications"
                variant="ghost"
                className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.16)] bg-[rgba(110,15,45,0.04)] hover:!bg-[rgba(110,15,45,0.10)] text-[#6E0F2D] hover:!text-[#6E0F2D] transition-all duration-200"
              />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#6E0F2D", border: `1.5px solid #FFFDF9`, pointerEvents: "none" }} />
              )}
            </motion.div>
          </Popover.Trigger>
          <Popover.Content align="end" sideOffset={8} className="!w-[360px] !max-w-[calc(100vw-32px)] !p-0 !rounded-[16px] !overflow-hidden !z-[200]" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.14)`, boxShadow: "0 10px 36px rgba(44,24,16,0.18)" }}>
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
              <div style={{ maxHeight: 360, overflowY: "auto", background: "#FFF" }}>
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

        {/* Profile Avatar Button */}
        <div style={{ position: "relative" }}>
          <div style={{ borderRadius: 10, border: `1px solid ${showProfileDropdown ? C.gold : "rgba(200,155,71,0.40)"}`, boxShadow: "0 3px 10px rgba(110,15,45,0.15)", display: "inline-block" }}>
            <Button
              onClick={() => { setShowProfileDropdown(p => !p); if (!showProfileDropdown) setShowNotif(false); }}
              variant="tertiary"
              className="!size-9 !rounded-[10px] !p-0 !border-none !bg-[#6E0F2D] hover:!bg-[#6E0F2D]"
            >
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>{toInitials(initials)}</span>
            </Button>
          </div>

          {showProfileDropdown && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.14)`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid rgba(110,15,45,0.10)` }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.dark }}>{userName}</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitleText}</div>
              </div>
              <div style={{ padding: "6px 0" }}>
                <Button onClick={() => { setShowProfileDropdown(false); onProfile(); }} variant="tertiary" fullWidth
                  className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                  <UserRound size={14} color={C.muted} /> View Profile
                </Button>
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "4px 0" }} />
                {isAdminViewing && (
                  <Button onClick={() => { setShowProfileDropdown(false); returnToAdmin(); }} variant="tertiary" fullWidth
                    className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#1A0A0F]">
                    <ChevronLeft size={14} color={C.muted} /> Return to {roleLabel(adminViewingAs)}
                  </Button>
                )}
                <Button onClick={() => { setShowProfileDropdown(false); logout(); }} variant="tertiary" fullWidth
                  className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#C0392B] hover:!text-[#C0392B]">
                  <LogOut size={14} color="#C0392B" /> Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function MobileProfile({ onClose }: { onClose?: () => void }) {
  const { user, phone, logout } = useAuth();
  const userName = user?.name || "Ravindra Kumar";
  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "RK";
  const userPhone = user?.mobile || phone || "1234567890";
  const workerId = user?.empId || "STAFF-001";

  return (
    <div style={{ paddingBottom: 48, background: "#FDFBF7", minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <div style={{ height: 56, background: C.burg, display: "flex", alignItems: "center", padding: "0 16px" }}>
        {onClose && (
          <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={onClose} className="text-white" />
        )}
        <span style={{ flex: 1, textAlign: "center", fontFamily: F.d, fontSize: 18, fontWeight: 600, color: "#FFF" }}>My Profile</span>
        {onClose && <div style={{ width: 36 }} />}
      </div>

      {/* Hero User Banner Card */}
      <div style={{ background: C.burg, padding: "20px 20px 28px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: "#FFF" }}>{toInitials(initials)}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 3 }}>{userPhone}</div>
            
            {/* Single line with Worker Staff badge on left and Logout button on right */}
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "3px 12px" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF" }}>Worker Staff</span>
              </div>

              <Button
                onClick={() => logout()}
                variant="secondary"
                className="rounded-full px-3.5 py-1 bg-white/10 hover:bg-red-500/20 text-white border border-white/20 text-xs gap-1.5 shrink-0"
              >
                <LogOut size={13} color="#FF8A8A" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#FFF", borderBottom: `1px solid ${C.bdr}`, padding: "16px 0", boxShadow: "0 2px 10px rgba(110,15,45,0.04)" }}>
        {[
          { val: "8 yrs", label: "Tenure" },
          { val: "Morning", label: "Shift" },
          { val: "Active", label: "Status" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "0 8px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.burg, marginBottom: 2 }}>{s.val}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Work Details Section */}
      <div style={{ margin: "24px 16px 0" }}>
        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>WORK DETAILS</div>
        <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          {[
            { label: "Worker ID", value: workerId, mono: true },
            { label: "Role", value: "Worker Staff", mono: false },
            { label: "Shift", value: "Morning · 6:00 AM – 2:00 PM", mono: false },
            { label: "Factory", value: "Beere Kesava & Brothers Silks", mono: false },
            { label: "Joined", value: "March 2018", mono: false },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: i < arr.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item.label}</span>
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: item.mono ? C.burg : C.dark }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HamburgerMenu({ open, onOpenChange, onProfile, activeTab, onSelectTab }: { open: boolean; onOpenChange: (open: boolean) => void; onProfile: () => void; onBack?: () => void; activeTab?: Tab; onSelectTab?: (t: Tab) => void }) {
  const { logout } = useAuth();
  const onClose = () => onOpenChange(false);

  const NAV_ITEMS: { id: Tab; label: string; Icon: IconComponent }[] = [
    { id: "home", label: "Home", Icon: Home },
    { id: "qc", label: "Quality Check", Icon: Search },
    { id: "weavers", label: "Receive Sarees", Icon: Users },
    { id: "finishing", label: "Finishing", Icon: Sparkles },
    { id: "dispatch", label: "Dispatch Details", Icon: Truck },
    { id: "activity", label: "Activity Log", Icon: Activity },
    { id: "profile", label: "My Profile", Icon: UserRound },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="left" size="sm">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.dark }}>
        {/* Header matching Superadmin drawer header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid rgba(200,155,71,0.60)`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${C.dark} 0%, #6E0F2D 100%)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)", flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Worker staff portal navigation menu</Dialog.Description>
              <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>WORKER STAFF</div>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close menu"
              onClick={onClose}
              variant="ghost"
              className="!size-8 !rounded-[9px] border border-[rgba(245,232,208,0.20)] bg-[rgba(245,232,208,0.10)] text-[rgba(245,232,208,0.85)] hover:bg-[rgba(245,232,208,0.16)]"
            />
          </Dialog.Close>
        </div>

        {/* Menu Navigation Items */}
        <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const ItemIcon = item.Icon;
            return (
              <Button
                key={item.id}
                variant="tertiary"
                fullWidth
                onClick={() => {
                  if (item.id === "profile") {
                    onProfile();
                  } else if (onSelectTab) {
                    onSelectTab(item.id);
                  }
                  onClose();
                }}
                className={`justify-between gap-3 rounded-[12px] border-none mb-1.5 px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? "bg-[linear-gradient(135deg,rgba(200,155,71,0.20)_0%,rgba(110,15,45,0.25)_100%)] text-white font-semibold border border-[rgba(200,155,71,0.30)]"
                    : "bg-transparent text-[rgba(255,255,255,0.75)] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.u, fontSize: 14 }}>
                  <ItemIcon size={18} color={isActive ? C.gold : "rgba(255,255,255,0.65)"} />
                  {item.label}
                </span>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />}
              </Button>
            );
          })}
        </div>

        {/* Footer Logout Button */}
        <div style={{ padding: "16px 16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <Button variant="tertiary" fullWidth onClick={() => { onClose(); logout(); }}
            className="justify-start gap-2.5 rounded-[12px] border-none bg-red-500/10 px-3.5 py-3 text-[13px] text-red-400 hover:bg-red-500/20">
            <LogOut size={16} color="#FF6B6B" /> Logout
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

interface MobilePortalProps extends WorkerPortalProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}

function MobilePortal({ onBack, activeTab, setActiveTab }: MobilePortalProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    scrollToTop();
  }, [activeTab]);

  const handleNavigate = (tab: Tab) => setActiveTab(tab);

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100dvh", background: "#FFFFFF", display: "flex", flexDirection: "column", fontFamily: F.u, position: "relative" }}>
      {/* Hamburger overlay */}
      <HamburgerMenu open={showMenu} onOpenChange={setShowMenu} onProfile={() => setShowProfile(true)} onBack={onBack} activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Profile slide */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.22 }}
            style={{ position: "fixed", inset: 0, background: "#FDFBF7", zIndex: "var(--z-tooltip)", overflowY: "auto" }}>
            <MobileProfile onClose={() => setShowProfile(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header matching Superadmin mobile header */}
      <WorkerMobileTopNav onMenuOpen={() => setShowMenu(true)} onProfile={() => setShowProfile(true)} />
      <AdminViewingBanner portalLabel="Worker Staff" />

      {/* Sticky Section Navigator — matching SuperadminDashboard layout */}
      {activeTab === "qc" && (
        <SectionNavigator
          sections={PAGE_SECTIONS.WorkerQC}
          stickyTop={60}
          height={WORKER_SECTION_NAV_H}
          activeColor={C.burg}
          mutedColor={C.muted}
          borderColor={C.bdr}
          fontFamily={F.u}
          padding="8px 16px"
          layoutId="worker-qc-section-pill"
        />
      )}

      {/* Content — window scroll matching SuperadminDashboard */}
      <div style={{ flex: 1, paddingBottom: 80 }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {activeTab === "home"      && <WorkerHome onNavigate={handleNavigate} />}
            {activeTab === "qc"       && <WorkerQC />}
            {activeTab === "weavers"  && <WorkerWeavers />}
            {activeTab === "finishing"&& <WorkerFinishing />}
            {activeTab === "dispatch" && <WorkerDispatch />}
            {activeTab === "activity" && <WorkerActivity isDesktop={false} />}
            {activeTab === "profile"  && <MobileProfile />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating quick-action button — QC and Finishing only */}
      <div style={{ position: "fixed", bottom: 76, left: 0, width: "100%", zIndex: 110, pointerEvents: "none" }}>
        <AnimatePresence>
          {(activeTab === "qc" || activeTab === "finishing") && (
            <motion.div
              key={activeTab}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              style={{ position: "absolute", right: 16, bottom: 0, pointerEvents: "auto" }}
            >
              <IconButton
                icon={activeTab === "qc" ? Search : UserCheck}
                label={activeTab === "qc" ? "Start QC" : "Assign"}
                variant="primary"
                size="lg"
                onClick={() => setActiveTab(activeTab)}
                className="w-14 h-14 rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] shadow-[0_4px_16px_rgba(110,15,45,0.30)]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar — 5 tabs */}
      <div style={{ height: 66, background: "#FFF", borderTop: `1px solid ${C.bdr}`, display: "flex", position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 100, boxShadow: "0 -4px 20px rgba(110,15,45,0.08)" }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <Button key={tab.id} variant="ghost" onClick={() => setActiveTab(tab.id)} className="relative flex-1 h-full justify-center rounded-none p-0">
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {active && (
                  <motion.div layoutId="worker-tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    style={{ position: "absolute", top: -9, left: "50%", marginLeft: -13, width: 26, height: 3, borderRadius: 4, background: C.burg }} />
                )}
                {tab.badge && (
                  <span style={{ position: "absolute", top: -3, right: -7, minWidth: 16, height: 16, background: C.crim, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#FFF", fontFamily: F.u, padding: "0 3px" }}>
                    {tab.badge}
                  </span>
                )}
                <tab.Icon size={20} color={active ? C.burg : C.muted} />
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: active ? 600 : 500, color: active ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function WorkerPortal({ onBack }: WorkerPortalProps) {
  const { w, isMobile } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1024 ? "desktop" : "tablet";

  const { pathname } = useLocation();
  const routerNavigate = useNavigate();

  let activeTab: Tab = "home";
  if (pathname.includes("/qc")) activeTab = "qc";
  else if (pathname.includes("/weavers")) activeTab = "weavers";
  else if (pathname.includes("/finishing")) activeTab = "finishing";
  else if (pathname.includes("/dispatch")) activeTab = "dispatch";
  else if (pathname.includes("/activity")) activeTab = "activity";
  else if (pathname.includes("/profile")) activeTab = "profile";

  const setActiveTab = (tab: Tab) => {
    const routeMap: Record<Tab, string> = {
      home: "/worker/home",
      qc: "/worker/qc",
      weavers: "/worker/weavers",
      finishing: "/worker/finishing",
      dispatch: "/worker/dispatch",
      activity: "/worker/activity",
      profile: "/worker/profile",
    };
    const path = routeMap[tab] || "/worker/home";
    routerNavigate(path);
  };

  return (
    <>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {isMobile ? (
        <MobilePortal onBack={onBack} activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <WorkerPortalDesktop onBack={onBack} bp={bp} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </>
  );
}
