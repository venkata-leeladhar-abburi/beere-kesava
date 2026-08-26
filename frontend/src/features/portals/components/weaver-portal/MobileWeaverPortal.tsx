import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, CheckSquare, Package, Wallet, Menu, Bell, UserRound, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from "@radix-ui/react-dialog";

import { useAuth } from '../../../../contexts/AuthContext';import { useMaterialIssue } from '@/features/materials';
import { C, F, Tab5 } from './theme';
import { useCurrentWeaver } from './useCurrentWeaver';
import { Button, IconButton } from '../../../../shared/ui/primitives';
import { Drawer } from '../../../../shared/ui/overlay';
import { MobileNav, type MobileNavItem } from '../../../../shared/ui/nav/MobileNav';
import { imgBKLogo } from '../../../../shared/constants/weaverImages';import { MyBatchesPage } from './MyBatchesPage';
import { ConfirmMaterialPage } from './ConfirmMaterialPage';
import { WarpRequestPage } from './WarpRequestPage';
import { PaymentLedgerPage } from './PaymentLedgerPage';
import { NotificationsPage } from './NotificationsPage';

function WeaverHamburgerMenu({
  open,
  onOpenChange,
  onProfile,
  activeTab,
  onSelectTab,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfile: () => void;
  activeTab: Tab5;
  onSelectTab: (t: Tab5) => void;
}) {
  const { logout } = useAuth();
  const onClose = () => onOpenChange(false);

  const NAV_ITEMS: { id: Tab5; label: string; Icon: React.ElementType }[] = [
    { id: "batches", label: "My Batches", Icon: ClipboardList },
    { id: "confirm", label: "Confirm Material", Icon: CheckSquare },
    { id: "warp", label: "Warp Request", Icon: Package },
    { id: "payments", label: "Payments", Icon: Wallet },
    { id: "notifications", label: "Notifications", Icon: Bell },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="left" size="sm">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.dark }}>
        {/* Header matching Worker/Superadmin drawer header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid rgba(200,155,71,0.60)`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${C.dark} 0%, #6E0F2D 100%)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)", flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Weaver portal navigation menu</Dialog.Description>
              <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>WEAVER PORTAL</div>
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
                  onSelectTab(item.id);
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

          <Button
            variant="tertiary"
            fullWidth
            onClick={() => {
              onProfile();
              onClose();
            }}
            className="justify-between gap-3 rounded-[12px] border-none mb-1.5 px-3.5 py-3 text-left transition-all bg-transparent text-[rgba(255,255,255,0.75)] hover:bg-white/[0.08] hover:text-white"
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.u, fontSize: 14 }}>
              <UserRound size={18} color="rgba(255,255,255,0.65)" />
              My Profile
            </span>
          </Button>
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

export function MobileWeaverPortal({ onBack: _onBack, active, setActive, onProfile }: { onBack?: () => void; active: Tab5; setActive: (t: Tab5) => void; onProfile?: () => void }) {
  const { selectRole: _selectRole, user, logout } = useAuth();
  const name = user?.name || "—";
  const initials = name === "—" ? "—" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { getRecordsForWeaver } = useMaterialIssue();
  const { weaverId } = useCurrentWeaver();
  const pendingConfirmCount = weaverId ? getRecordsForWeaver(weaverId).filter(r => r.status === 'pending-signature').length : 0;

  const TABS: { id: Tab5; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'batches',   label: 'My Batches', icon: ClipboardList, },
    { id: 'confirm',   label: 'Confirm',    icon: CheckSquare, badge: pendingConfirmCount },
    { id: 'warp',      label: 'Warp Request', icon: Package },
    { id: 'payments',  label: 'Payments',   icon: Wallet },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', minHeight: '100dvh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', position: 'relative' as const }}>
      {/* ── TOP NAV BAR MATCHING WORKER STAFF PORTAL ── */}
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
          onClick={() => setMenuOpen(true)}
          variant="ghost"
          className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#1A0A0F]"
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.30)` }}>
            <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.dark, lineHeight: 1.1 }}>Beere Kesava</div>
            <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 11, color: C.muted }}>Weaver Portal · Est. 1999</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <IconButton
              icon={Bell}
              label="Notifications"
              onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
              variant="ghost"
              className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[rgba(0,0,0,0.04)] text-[#1A0A0F]"
            />
            <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#F47B72", border: `1.5px solid #FFFDF9`, pointerEvents: "none" }} />
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ borderRadius: 10, border: `1px solid ${showProfile ? C.gold : "rgba(200,155,71,0.40)"}`, boxShadow: "0 3px 10px rgba(110,15,45,0.15)", display: "inline-block" }}>
              <Button
                onClick={() => setShowProfile(p => !p)}
                variant="tertiary"
                className="!size-9 !rounded-[10px] !p-0 !border-none !bg-[#6E0F2D] hover:!bg-[#6E0F2D]"
              >
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>{initials}</span>
              </Button>
            </div>

            {showProfile && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200, background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.14)`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid rgba(110,15,45,0.10)` }}>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.dark }}>{name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.empId ? `${user.empId} · Handloom Weaver` : "Handloom Weaver"}</div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="tertiary" fullWidth
                    className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                    <UserRound size={14} color={C.muted} /> View Profile
                  </Button>
                  <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "4px 0" }} />
                  <Button onClick={() => { setShowProfile(false); logout(); navigate('/login'); }} variant="tertiary" fullWidth
                    className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#C0392B] hover:!text-[#C0392B]">
                    <LogOut size={14} color="#C0392B" /> Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Side Menu Drawer */}
      <WeaverHamburgerMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onProfile={() => onProfile?.()}
        activeTab={active}
        onSelectTab={t => {
          setActive(t);
          setShowNotifs(false);
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' as const, paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="wait">
          {showNotifs ? (
            <motion.div key="notifs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <NotificationsPage />
            </motion.div>
          ) : (
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {active === 'batches' && (<MyBatchesPage onGoToPayments={() => setActive('payments')} />)}
              {active === 'confirm' && (<ConfirmMaterialPage onGoToBatches={() => setActive('batches')} />)}
              {active === 'warp'    && (<WarpRequestPage />)}
              {active === 'payments' && (<PaymentLedgerPage />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      {!showNotifs && (
        <MobileNav
          items={TABS.map((tab): MobileNavItem => ({
            key: tab.id,
            label: tab.label,
            icon: tab.icon,
            onClick: () => { setActive(tab.id); setShowNotifs(false); },
            badge: tab.badge,
            style: { fontWeight: active === tab.id ? 600 : 500 },
          }))}
          activeKey={active}
          activeColor={C.burg}
          inactiveColor={C.muted}
          indicatorColor={C.burg}
          badgeColor={C.crim}
          labelStyle={{ fontFamily: F.u, fontSize: 12 }}
          baseHeight="66px"
          style={{
            background: '#FFF',
            borderTop: `1px solid ${C.bdr}`,
            boxShadow: '0 -4px 20px rgba(110,15,45,0.08)',
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}
