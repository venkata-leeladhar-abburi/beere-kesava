import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, CheckSquare, ArrowUpRight, Wallet, Flower2, Bell, UserRound, ChevronLeft, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../../../../contexts/AuthContext';
import { useMaterialIssue } from '../../../materials/contexts/MaterialIssueContext';
import {
  C, F, Tab5
} from './theme';
import { useCurrentWeaver } from './useCurrentWeaver';
import { Button, IconButton } from '../../../../shared/ui/primitives';
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
    { id: 'warp',      label: 'Warp',       icon: ArrowUpRight },
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
          <div style={{ position: 'relative' as const }}>
            <Button onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }} className="w-[30px] h-[30px] p-0 rounded-[9px] border border-white/30 bg-white/12 flex-shrink-0">
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 12, color: '#FFF' }}>{initials}</span>
            </Button>
            {showProfile && (
              <div style={{ position: 'absolute' as const, top: 'calc(100% + 8px)', right: 0, zIndex: 300, background: '#FFFDF9', borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: '0 8px 32px rgba(44,24,16,0.18)', minWidth: 200, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: 'rgba(110,15,45,0.04)', borderBottom: `1px solid ${C.bdr}` }}>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{user?.empId ? `${user.empId} · Handloom Weaver` : "Handloom Weaver"}</div>
                </div>
                <div style={{ padding: '6px 0' }}>
                  <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-4 py-2.5 border-none bg-transparent justify-start text-[13px] text-[#3B2314]">
                    <UserRound size={14} color={C.muted} /> View Profile
                  </Button>
                  {localStorage.getItem('bk_original_admin_role') ? (
                    <Button onClick={() => {
                      setShowProfile(false);
                      const origAdminRole = localStorage.getItem('bk_original_admin_role');
                      if (origAdminRole) {
                        localStorage.removeItem('bk_original_admin_role');
                        selectRole(origAdminRole as any);
                        navigate(origAdminRole === 'superadmin' ? '/superadmin' : '/admin');
                      }
                    }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-4 py-2.5 border-none bg-transparent justify-start text-[13px] text-[#3B2314]">
                      <ChevronLeft size={14} color={C.muted} /> My Portal
                    </Button>
                  ) : (
                    <Button onClick={() => { setShowProfile(false); selectRole(null); navigate('/select-role'); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-4 py-2.5 border-none bg-transparent justify-start text-[13px] text-[#3B2314]">
                      <ChevronLeft size={14} color={C.muted} /> Switch Portal
                    </Button>
                  )}
                  <Button onClick={() => { setShowProfile(false); logout(); navigate('/login'); }} variant="ghost" className="flex items-center gap-2.5 w-full h-auto px-4 py-2.5 border-none bg-transparent justify-start text-[13px] text-[#C0392B]">
                    <LogOut size={14} color="#C0392B" /> Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
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
