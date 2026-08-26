import { formatMoney, rupees } from "@/lib/domain/money";
import React, { useState } from "react";
import { Bell, ChevronLeft, LogOut, RotateCcw, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { imgBKLogo } from "../../../../../shared/constants/weaverImages";
import { C, F } from "../theme";
import { useAuth } from "../../../../../contexts/AuthContext";
import { Button, IconButton, SearchInput } from "../../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../../../shared/ui/overlay";
import type { Role } from "../../../../../contexts/AuthContext";
import { notificationsApi } from "../../../../../shared/api/notifications";
import { salesApi } from "../../../../../shared/api/sales";

function notifEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("return")) return "🔄";
  if (t.includes("sale")) return "🛍️";
  if (t.includes("inventory") || t.includes("stock")) return "📦";
  if (t.includes("pass") || t.includes("complete")) return "✅";
  return "🔔";
}

function formatRelativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1 || isNaN(diffMin)) return "Now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function DesktopTopNav({
  isTablet, TABS, active, showReturn, setActive, setShowReturn,
  search, setSearch, showProfile, setShowProfile, setShowProfileModal,
  handleLogout, selectRole, routerNavigate,
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
  selectRole: (role: Role) => void;
  routerNavigate: (path: string) => void;
}) {
  const { user } = useAuth();
  const name = user?.name || "Naidu PAVAN";
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "NP";
  const [markedRead, setMarkedRead] = useState(false);

  const { data: notifRes } = useQuery({
    queryKey: ["notifications-list-shop-desktop"],
    queryFn: () => notificationsApi.list({ role: "SHOP", pageSize: 20 }),
  });

  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-notif-desktop"],
    queryFn: () => salesApi.listReturns(20),
  });

  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-notif-desktop"],
    queryFn: () => salesApi.list(20),
  });

  const backendNotifs = (notifRes?.items ?? []).map(n => ({
    id: n.id,
    type: n.type,
    title: n.type.replace(/_/g, " "),
    desc: typeof n.payload === "object" && n.payload ? JSON.stringify(n.payload).replace(/[{}"]/g, " ") : "Store activity alert",
    time: formatRelativeTime(n.createdAt),
    unread: !n.readAt,
  }));

  const returnNotifs = (returnsRes?.items ?? []).slice(0, 4).map(r => ({
    id: `return-${r.returnRef}`,
    type: "return",
    title: `Return: ${r.sareeId}`,
    desc: `Reason: ${r.reason || "Customer return"}${r.refundAmount ? ` · Refund: ${formatMoney(rupees(Number(r.refundAmount)))}` : ""}`,
    time: formatRelativeTime(r.returnDate),
    unread: true,
  }));

  const saleNotifs = (salesRes?.items ?? []).slice(0, 4).map(s => ({
    id: `sale-${s.saleRef}`,
    type: "sale",
    title: `Sale Recorded: ${s.sareeId}`,
    desc: `${s.channel === "WHOLESALE" ? "Wholesale" : "Retail"} sale · ${s.customer?.name || "Walk-in Customer"}`,
    time: formatRelativeTime(s.saleDate),
    unread: false,
  }));

  const liveNotifications = [...backendNotifs, ...returnNotifs, ...saleNotifs];
  const unreadCount = markedRead ? 0 : liveNotifications.filter(n => n.unread).length;

  const handleMarkAllRead = async () => {
    setMarkedRead(true);
    for (const n of notifRes?.items ?? []) {
      if (!n.readAt) {
        try { await notificationsApi.markRead(n.id); } catch { /* ignore single error */ }
      }
    }
  };

  return (
    <div style={{ background: "#2A0815", borderBottom: "1px solid rgba(200,155,71,0.14)", position: "sticky" as const, top: 0, zIndex: "var(--z-nav)", boxShadow: "0 4px 40px rgba(0,0,0,0.28)" }}>
      <div className="max-w-[1600px] mx-auto" style={{ padding: isTablet ? "0 24px" : "0 56px", display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", height: 72, gap: isTablet ? 16 : 24 }}>
        {/* Brand Lockup */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: isTablet ? 10 : 14 }}>
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
            const isActive = active === tab.id && !showReturn;
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
              </Button>
            );
          })}
          <Button
            onClick={() => setShowReturn(true)}
            variant="ghost"
            className={
              "flex items-center gap-2 shrink-0 h-10 border-none rounded-[10px] whitespace-nowrap " +
              (isTablet ? "px-3 " : "px-4 ") +
              (showReturn
                ? "bg-[rgba(192,57,43,0.28)] font-semibold !text-[#FFB3AA] hover:!bg-[rgba(192,57,43,0.36)] hover:!text-[#FFB3AA]"
                : "bg-transparent font-medium !text-[rgba(245,232,208,0.80)] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#FFB3AA]")
            }
          >
            <RotateCcw size={16} color={showReturn ? "#FFB3AA" : "rgba(245,232,208,0.80)"} /> Process Return
          </Button>
        </nav>

        {/* Right Actions: Notifications Bell & User Profile Capsule */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, justifySelf: "end" }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded-full"
            containerClassName={"rounded-full !bg-[rgba(245,232,208,0.08)] !border-[rgba(200,155,71,0.22)] hidden 2xl:flex " + (isTablet ? "w-[140px]" : "w-[200px]")}
          />

          {/* Notifications Dropdown (Desktop) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div style={{ position: "relative" as const, cursor: "pointer" }}>
                <IconButton icon={Bell} label="Notifications" variant="ghost" className="rounded-[10px] !text-[#F5E8D0] hover:!bg-[rgba(245,232,208,0.10)] hover:!text-[#E7C983]" />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute" as const, top: 4, right: 4, width: 8, height: 8, background: "#F47B72", borderRadius: "50%", pointerEvents: "none" as const }} />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!w-[300px] !max-w-[300px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.12)`, zIndex: 2000 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: C.dark }}>Notifications</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className={`p-0 h-auto text-[12px] ${unreadCount > 0 ? "text-[#C89B47]" : "text-[#69635E]"}`}
                >
                  Mark all read
                </Button>
              </div>
              {liveNotifications.length === 0 || markedRead ? (
                <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 13, color: C.muted }}>
                  No notifications.
                </div>
              ) : (
                liveNotifications.map((n, i) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    style={{ padding: "10px 16px", borderBottom: i < liveNotifications.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(110,15,45,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{notifEmoji(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{n.desc}</div>
                    </div>
                    <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted, flexShrink: 0 }}>{n.time}</span>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={
                  "flex items-center gap-3 h-auto px-2.5 py-1.5 rounded-full border transition-all " +
                  (showProfile ? "bg-[rgba(245,232,208,0.12)] border-[rgba(200,155,71,0.45)]" : "bg-[rgba(255,255,255,0.04)] border-[rgba(200,155,71,0.22)] hover:bg-[rgba(245,232,208,0.08)]")
                }
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6E0F2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{initials}</span>
                </div>
                <div style={{ textAlign: "left" as const, paddingRight: 4 }}>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.1 }}>{name}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 2 }}>Shop Staff</div>
                </div>
                <ChevronLeft size={14} color="rgba(255,255,255,0.70)" style={{ transform: "rotate(-90deg)", transition: "transform 0.2s" }} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: C.white, border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: "16px 18px", background: "rgba(200,155,71,0.08)", borderBottom: `1px solid ${C.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#6E0F2D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(110,15,45,0.28)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: "#FFF" }}>{initials}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>Shop Staff</div>
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
