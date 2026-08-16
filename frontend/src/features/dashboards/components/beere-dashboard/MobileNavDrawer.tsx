import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Menu, LogOut, UserRound, X } from 'lucide-react';
import { imgBKLogo } from '../../../../shared/constants/weaverImages';
import { T, F, G, EASE, findNavGroup, NAV_GROUPS } from './theme';
import { Button, IconButton } from '../../../../shared/ui/primitives';
import { Drawer } from '../../../../shared/ui/overlay';

export function MobileMenuDrawer({ open, onClose, activeTab, setTab }: {
  open: boolean; onClose: () => void; activeTab: string; setTab: (v: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={next => { if (!next) onClose(); }} side="left" size="sm">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        {/* Drawer header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: G.button, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)" }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
              </Dialog.Title>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close menu"
              onClick={onClose}
              variant="ghost"
              className="!size-8 !rounded-[9px] border border-[rgba(245,232,208,0.20)] bg-[rgba(245,232,208,0.10)] text-[rgba(245,232,208,0.85)] hover:bg-[rgba(245,232,208,0.16)] hover:text-[rgba(245,232,208,0.85)]"
            />
          </Dialog.Close>
        </div>

        {/* Gold accent bar */}
        <div className="gold-bar-shimmer" style={{ height: 2, flexShrink: 0 }} />

        {/* Nav items — grouped */}
        <div style={{ flex: 1, padding: "10px 12px" }}>
              {NAV_GROUPS.map((group, gi) => {
                const GroupIcon = group.icon;
                const isGroupActive = findNavGroup(activeTab).key === group.key;
                return (
                  <div key={group.key} style={{ marginBottom: 14 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 10px 6px",
                    }}>
                      <GroupIcon size={16} color={isGroupActive ? T.royalBurgundy : T.taupe} />
                      <span style={{
                        fontFamily: F.ui, fontWeight: 700, fontSize: 13,
                        color: isGroupActive ? T.royalBurgundy : T.luxuryBrown,
                        letterSpacing: "0.4px", textTransform: "uppercase" as const,
                      }}>
                        {group.label}
                      </span>
                    </div>

                    {/* Sub-items tree container with left indentation & guide line */}
                    <div style={{
                      marginLeft: 18,
                      paddingLeft: 14,
                      borderLeft: `2px solid ${isGroupActive ? "rgba(110,15,45,0.18)" : "rgba(110,15,45,0.08)"}`,
                      marginTop: 3,
                    }}>
                      {group.pages.map((page, i) => {
                        const isActive = activeTab === page.key;
                        return (
                          <motion.div
                            key={page.key}
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.32, delay: 0.04 + (gi * 3 + i) * 0.03, ease: EASE }}
                            style={{
                              borderRadius: 10, marginBottom: 3,
                              border: isActive ? `1px solid ${T.borderMed}` : "1px solid transparent",
                              background: isActive ? `linear-gradient(135deg, rgba(110,15,45,0.08) 0%, rgba(200,155,71,0.06) 100%)` : "transparent",
                            }}
                          >
                            <Button
                              variant="tertiary"
                              fullWidth
                              onClick={() => { setTab(page.key); onClose(); }}
                              className="!justify-start !gap-2.5 !py-[9px] !px-3 !bg-transparent !border-none"
                            >
                              <div style={{ flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: isActive ? T.royalBurgundy : "rgba(105,99,94,0.40)",
                                  flexShrink: 0,
                                }} />
                                <div style={{ fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13.5, color: isActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.05px" }}>
                                  {page.label}
                                </div>
                              </div>
                              {isActive && <ChevronRight size={13} color={T.royalBurgundy} />}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "16px 20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: G.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(110,15,45,0.28)` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 12, color: T.warmCream }}>BK</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown }}>Admin</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>Administrator</div>
                </div>
              </div>
            </div>
          </div>
    </Drawer>
  );
}

export function MobileTopNav({ onMenuOpen, onBack, onLogout, onProfile }: { onMenuOpen: () => void; onBack?: () => void; onLogout?: () => void; onProfile?: () => void }) {
  const [showProfile, setShowProfile] = React.useState(false);
  const [scrollDirection, setScrollDirection] = React.useState<"up" | "down">("up");
  const lastScrollYRef = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const diff = currentScrollY - lastScrollYRef.current;

      if (currentScrollY < 30) {
        setScrollDirection("up");
      } else if (diff > 8) {
        setScrollDirection("down");
      } else if (diff < -8) {
        setScrollDirection("up");
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHidden = scrollDirection === "down";

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        background: "rgba(255,253,249,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid rgba(110,15,45,0.08)`,
        boxShadow: "0 2px 20px rgba(74,6,27,0.05)",
        transform: isHidden ? "translateY(-100%)" : "translateY(0%)",
        transition: "transform 0.3s ease",
      }}
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
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, letterSpacing: "0.2px" }}>&amp; Brothers Silks · Est. 1999</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ borderRadius: 10, border: `1px solid ${showProfile ? T.royalBurgundy : T.borderDef}`, boxShadow: `0 3px 10px rgba(110,15,45,0.28)`, display: "inline-block" }}>
          <Button
            onClick={() => setShowProfile(p => !p)}
            variant="tertiary"
            className="!size-9 !rounded-[10px] !p-0 !border-none !bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:!bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)]"
          >
            <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 12, color: T.warmCream }}>BK</span>
          </Button>
        </div>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: "var(--z-tooltip)", background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Admin User</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                <UserRound size={14} color={T.taupe} /> View Profile
              </Button>
              <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
              <Button onClick={() => { setShowProfile(false); onBack?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                <ChevronLeft size={14} color={T.taupe} /> Switch Portal
              </Button>
              <Button onClick={() => { setShowProfile(false); onLogout?.(); }} variant="tertiary" fullWidth
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
