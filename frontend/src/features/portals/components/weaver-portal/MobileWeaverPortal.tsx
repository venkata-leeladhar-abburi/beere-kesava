import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, CheckSquare, Package, Wallet, Flower2, Bell, UserRound, ChevronLeft, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../../../../contexts/AuthContext';
import { useMaterialIssue } from '../../../materials/contexts/MaterialIssueContext';
import {
  C, F, Tab5
} from './theme';
import { useCurrentWeaver } from './useCurrentWeaver';
import { Button, IconButton } from '../../../../shared/ui/primitives';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../shared/ui/overlay';
import { MobileNav, type MobileNavItem } from '../../../../shared/ui/nav/MobileNav';

import { MyBatchesPage } from './MyBatchesPage';
import { ConfirmMaterialPage } from './ConfirmMaterialPage';
import { WarpRequestPage } from './WarpRequestPage';
import { PaymentLedgerPage } from './PaymentLedgerPage';
import { NotificationsPage } from './NotificationsPage';

export function MobileWeaverPortal({ onBack, active, setActive, onProfile }: { onBack?: () => void; active: Tab5; setActive: (t: Tab5) => void; onProfile?: () => void }) {
  const { selectRole, user, logout } = useAuth();
  const name = user?.name || "—";
  const initials = name === "—" ? "—" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { getRecordsForWeaver } = useMaterialIssue();
  const { weaverId } = useCurrentWeaver();
  const pendingConfirmCount = weaverId ? getRecordsForWeaver(weaverId).filter(r => r.status === 'pending-signature').length : 0;

  const TABS: { id: Tab5; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'batches',   label: 'My Batches', icon: ClipboardList, },
    { id: 'confirm',   label: 'Confirm',    icon: CheckSquare, badge: pendingConfirmCount },
    { id: 'warp',      label: 'Warp Request', icon: Package },
    { id: 'payments',  label: 'Payments',   icon: Wallet },
  ];

  const PAGE_TITLES: Record<Tab5, string> = {
    batches: 'My Batches', confirm: 'Confirm',
    warp: 'Warp Request', payments: 'Payments',
    notifications: 'Notifications'
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', minHeight: '100dvh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', position: 'relative' as const }}>
      {/* Global Header */}
      <div style={{ height: 60, background: C.burg, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0, position: 'sticky' as const, top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(110,15,45,0.30)' }}>
        <IconButton
          icon={Flower2}
          label="Back"
          onClick={onBack}
          variant="ghost"
          className="w-8 text-white/90"
        />
        <div style={{ flex: 1, textAlign: 'center' as const, fontFamily: F.d, fontWeight: 600, fontSize: 18, color: '#FFF' }}>
          {showNotifs ? 'Notifications' : PAGE_TITLES[active]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative' as const }}>
            <IconButton
              icon={Bell}
              label="Notifications"
              onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
              variant="ghost"
              className="w-[30px] text-white/90"
            />
            <span style={{ position: 'absolute' as const, top: 2, right: 4, width: 8, height: 8, background: '#FF3B30', borderRadius: '50%', pointerEvents: 'none' as const }} />
          </div>
          <DropdownMenu open={showProfile} onOpenChange={o => { setShowProfile(o); if (o) setShowNotifs(false); }}>
            <DropdownMenuTrigger asChild>
              <Button className="w-[30px] h-[30px] p-0 rounded-[9px] border border-white/30 bg-white/12 flex-shrink-0">
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: '#FFF' }}>{initials}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[200px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: '#FFFDF9', border: `1px solid ${C.bdr}`, zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: '14px 16px', background: 'rgba(110,15,45,0.04)', borderBottom: `1px solid ${C.bdr}` }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.empId ? `${user.empId} · Handloom Weaver` : "Handloom Weaver"}</div>
              </div>
              <div style={{ padding: '6px 0' }}>
                <DropdownMenuItem onClick={() => onProfile?.()} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#3B2314]">
                  <UserRound size={14} color={C.muted} /> View Profile
                </DropdownMenuItem>
                {localStorage.getItem('bk_original_admin_role') ? (
                  <DropdownMenuItem onClick={() => {
                    const origAdminRole = localStorage.getItem('bk_original_admin_role');
                    if (origAdminRole) {
                      localStorage.removeItem('bk_original_admin_role');
                      selectRole(origAdminRole as any);
                      navigate(origAdminRole === 'superadmin' ? '/superadmin' : '/admin');
                    }
                  }} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#3B2314]">
                    <ChevronLeft size={14} color={C.muted} /> My Portal
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => { selectRole(null); navigate('/select-role'); }} className="!h-auto !py-2.5 !px-4 !text-[13px] !text-[#3B2314]">
                    <ChevronLeft size={14} color={C.muted} /> Switch Portal
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }} destructive className="!h-auto !py-2.5 !px-4 !text-[13px]">
                  <LogOut size={14} color="#C0392B" /> Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' as const, paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}>
        <AnimatePresence mode="wait">
          {showNotifs ? (
            <motion.div key="notifs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <NotificationsPage />
            </motion.div>
          ) : (
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {active === 'batches' && (<MyBatchesPage />)}
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
