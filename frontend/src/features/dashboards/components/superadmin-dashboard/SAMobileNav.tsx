import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Menu, UserRound, ShoppingCart, Package, ChevronLeft, LogOut, X } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";
import { T, F, G, EASE } from "./theme";
import { NAV_GROUPS, findNavGroup } from "./data";
import { Button, IconButton } from "../../../../shared/ui/primitives";

// ═══════════════════════════════════════════════════════════════════════════════
// SA MOBILE — MENU DRAWER + TOP NAV
// ═══════════════════════════════════════════════════════════════════════════════
export function SAMobileMenuDrawer({ open, onClose, activeTab, setTab }: {
  open: boolean; onClose: () => void; activeTab: string; setTab: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sa-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(58,18,28,0.55)", backdropFilter: "blur(3px)" }}
          />
          <motion.div
            key="sa-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
              width: "78vw", maxWidth: 320,
              background: T.warmIvory,
              boxShadow: "8px 0 48px rgba(74,6,27,0.22)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid ${T.antiqueGold}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: G.button, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)" }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>Superadmin</div>
                </div>
              </div>
              <IconButton
                icon={X}
                label="Close menu"
                onClick={onClose}
                variant="ghost"
                className="!size-8 !rounded-[9px] border border-[rgba(245,232,208,0.20)] bg-[rgba(245,232,208,0.10)] text-[rgba(245,232,208,0.85)] hover:bg-[rgba(245,232,208,0.16)] hover:text-[rgba(245,232,208,0.85)]"
              />
            </div>

            <div style={{ flex: 1, padding: "10px 12px" }}>
              {NAV_GROUPS.map((group, gi) => {
                const GroupIcon = group.icon;
                const isGroupActive = findNavGroup(activeTab).key === group.key;
                return (
                  <div key={group.key} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 8px" }}>
                      <GroupIcon size={16} color={isGroupActive ? T.royalBurgundy : T.taupe} />
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: isGroupActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.3px", textTransform: "uppercase" as const }}>
                        {group.label}
                      </span>
                    </div>
                    {group.pages.map((page, i) => {
                      const isActive = activeTab === page.key;
                      return (
                        <motion.div
                          key={page.key}
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.32, delay: 0.04 + (gi * 3 + i) * 0.03, ease: EASE }}
                          style={{
                            borderRadius: 12, marginBottom: 3,
                            border: isActive ? `1px solid ${T.borderMed}` : "1px solid transparent",
                            background: isActive ? `linear-gradient(135deg, rgba(110,15,45,0.08) 0%, rgba(200,155,71,0.06) 100%)` : "transparent",
                          }}
                        >
                          <Button
                            variant="tertiary"
                            fullWidth
                            onClick={() => { setTab(page.key); onClose(); }}
                            className="!justify-between !gap-3 !py-[11px] !pl-[30px] !pr-3.5 !bg-transparent !border-none"
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 14, color: isActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.05px" }}>
                              {page.label}
                              {page.sa && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />}
                            </span>
                            {isActive && <ChevronRight size={13} color={T.royalBurgundy} />}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "16px 20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown }}>Superadmin</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>Full Access · All Portals</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SAMobileTopNav({ onMenuOpen, onBack, onProfile }: { onMenuOpen: () => void; onBack?: () => void; onProfile?: () => void }) {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,253,249,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" as any, borderBottom: `2px solid ${T.antiqueGold}`, boxShadow: "0 2px 20px rgba(74,6,27,0.05)" }}
    >
      <IconButton
        icon={Menu}
        label="Open menu"
        onClick={onMenuOpen}
        variant="ghost"
        className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.10)] bg-transparent hover:bg-[rgba(0,0,0,0.04)]"
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.25)` }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "0.1px" }}>Beere Kesava</div>
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, letterSpacing: "0.2px" }}>Superadmin · Est. 1999</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ borderRadius: 10, border: `1px solid ${showProfile ? T.antiqueGold : T.borderDef}`, boxShadow: "0 3px 10px rgba(196,146,58,0.35)", display: "inline-block" }}>
          <Button
            onClick={() => setShowProfile(p => !p)}
            variant="tertiary"
            className="!size-9 !rounded-[10px] !p-0 !border-none !bg-[#C4923A] hover:!bg-[#C4923A]"
          >
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
          </Button>
        </div>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Superadmin</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>Full Access · All Portals</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                <UserRound size={14} color={T.taupe} /> View Profile
              </Button>
              <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />

              <div style={{ padding: "4px 16px 2px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Staff Portals</div>
              <Button onClick={() => {
                setShowProfile(false);
                localStorage.setItem("bk_original_admin_role", "superadmin");
                selectRole("shop");
                navigate("/shop");
              }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2 !px-4 !text-xs !font-normal !text-[#3B2314]">
                <ShoppingCart size={13} color={T.taupe} /> Shop Staff Portal
              </Button>
              <Button onClick={() => {
                setShowProfile(false);
                localStorage.setItem("bk_original_admin_role", "superadmin");
                selectRole("worker");
                navigate("/worker");
              }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2 !px-4 !text-xs !font-normal !text-[#3B2314]">
                <Package size={13} color={T.taupe} /> Worker Staff Portal
              </Button>

              <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
              <Button onClick={() => { setShowProfile(false); onBack?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                <ChevronLeft size={14} color={T.taupe} /> Switch Portal
              </Button>
              <Button onClick={() => { setShowProfile(false); onBack?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#C0392B] hover:!text-[#C0392B]">
                <LogOut size={14} color="#C0392B" /> Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
