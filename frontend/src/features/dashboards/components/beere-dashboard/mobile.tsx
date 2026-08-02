
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  Bell, Search, TrendingUp, SlidersHorizontal, Moon,
  Facebook, Instagram, Youtube, Linkedin, Menu,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, LayoutDashboard, Factory, IndianRupee, Users, Settings2,
  Activity, MapPin, Phone, Eye, Edit3, Layers3, ShoppingCart, Layers, X
, Flower2 as Lotus } from 'lucide-react';
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import { ImageWithFallback } from "../../../../shared/ui/ImageWithFallback";
import { useNavigate } from 'react-router';
import { useInView } from 'motion/react';
import { useAuth } from '../../../../contexts/AuthContext';
import { imgBKLogo, imgSareeFooter } from '../../../../shared/constants/weaverImages';
import { T, F, G, NUM, DARK_MAROON, EASE, findNavGroup, NAV_GROUPS, NAV_GROUP_FALLBACK } from './theme';
import { METRICS, WEAVERS, WEAVER_RATES, MATS, ACT } from './data';
import { FadeUp, FadeIn, AnimatedNumber, AnimatedBar, SectionHeader, Card, Label, Body, Donut, BarChart } from './ui';

function SareesProduced(props: any) { return null; }
function FeaturedProduct(props: any) { return null; }

const imgSaree       = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom    = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function MobileMenuDrawer({ open, onClose, activeTab, setTab }: {
  open: boolean; onClose: () => void; activeTab: string; setTab: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(58,18,28,0.55)", backdropFilter: "blur(3px)" }}
          />
          {/* Drawer panel */}
          <motion.div
            key="drawer"
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
            {/* Drawer header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: G.button, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)" }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(245,232,208,0.20)", background: "rgba(245,232,208,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="rgba(245,232,208,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            {/* Gold accent bar */}
            <div className="gold-bar-shimmer" style={{ height: 2, flexShrink: 0 }} />

            {/* Nav items — grouped */}
            <div style={{ flex: 1, padding: "10px 12px" }}>
              {NAV_GROUPS.map((group, gi) => {
                const GroupIcon = group.icon;
                const isGroupActive = findNavGroup(activeTab).key === group.key;
                return (
                  <div key={group.key} style={{ marginBottom: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 10px 8px",
                    }}>
                      <GroupIcon size={16} color={isGroupActive ? T.royalBurgundy : T.taupe} />
                      <span style={{
                        fontFamily: F.ui, fontWeight: 700, fontSize: 13,
                        color: isGroupActive ? T.royalBurgundy : T.luxuryBrown,
                        letterSpacing: "0.3px", textTransform: "uppercase" as const,
                      }}>
                        {group.label}
                      </span>
                    </div>
                    {group.pages.map((page, i) => {
                      const isActive = activeTab === page.key;
                      return (
                        <motion.button
                          key={page.key}
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.32, delay: 0.04 + (gi * 3 + i) * 0.03, ease: EASE }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { setTab(page.key); onClose(); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 14px 11px 30px", borderRadius: 12, marginBottom: 3,
                            border: isActive ? `1px solid ${T.borderMed}` : "1px solid transparent",
                            background: isActive ? `linear-gradient(135deg, rgba(110,15,45,0.08) 0%, rgba(200,155,71,0.06) 100%)` : "transparent",
                            cursor: "pointer", textAlign: "left",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 14, color: isActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.05px" }}>
                              {page.label}
                            </div>
                          </div>
                          {isActive && <ChevronRight size={13} color={T.royalBurgundy} />}
                        </motion.button>
                      );
                    })}
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
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.luxuryBrown }}>Admin</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 10.5, color: T.taupe }}>Administrator</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — TOP NAV
// ═══════════════════════════════════════════════════════════════════════════════
function MobileTopNav({ onMenuOpen, onBack, onLogout, onProfile }: { onMenuOpen: () => void; onBack?: () => void; onLogout?: () => void; onProfile?: () => void }) {
  const navigate = useNavigate();
  const { selectRole } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,253,249,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" as any, borderBottom: `1px solid rgba(110,15,45,0.08)`, boxShadow: "0 2px 20px rgba(74,6,27,0.05)" }}
    >
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onMenuOpen}
        style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Menu size={17} color={T.luxuryBrown} />
      </motion.button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.25)` }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "0.1px" }}>Beere Kesava</div>
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 9, color: T.taupe, letterSpacing: "0.2px" }}>&amp; Brothers Silks · Est. 1999</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <motion.button
          onClick={() => setShowProfile(p => !p)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${showProfile ? T.royalBurgundy : T.borderDef}`, background: G.button, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(110,15,45,0.28)` }}
        >
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 12, color: T.warmCream }}>BK</span>
        </motion.button>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Admin User</div>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <button onClick={() => { setShowProfile(false); onProfile?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "left" as const }}>
                <UserRound size={14} color={T.taupe} /> View Profile
              </button>
              <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
              
              <div style={{ padding: "4px 16px 2px", fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Staff Portals</div>
              <button onClick={() => { 
                setShowProfile(false); 
                localStorage.setItem("bk_original_admin_role", "admin");
                selectRole("shop");
                navigate("/shop"); 
              }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, textAlign: "left" as const }}>
                <ShoppingCart size={13} color={T.taupe} /> Shop Staff Portal
              </button>
              <button onClick={() => { 
                setShowProfile(false); 
                localStorage.setItem("bk_original_admin_role", "admin");
                selectRole("worker");
                navigate("/worker"); 
              }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, textAlign: "left" as const }}>
                <Package size={13} color={T.taupe} /> Worker Staff Portal
              </button>


              <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
              <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "left" as const }}>
                <ChevronLeft size={14} color={T.taupe} /> Switch Portal
              </button>
              <button onClick={() => { setShowProfile(false); onLogout?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
                <LogOut size={14} color="#C0392B" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function MobileHero() {
  return (
    <section style={{ position: "relative", height: 320, overflow: "hidden", background: "#0D0207" }}>
      <motion.img
        src={imgShowroom}
        alt="Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* ── Gold sweep reveal ── */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200vw" }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.08) 45%, rgba(200,155,71,0.14) 50%, rgba(200,155,71,0.08) 55%, transparent 100%)",
          pointerEvents: "none", zIndex: 8,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 38%, rgba(13,2,7,0.92) 50%, rgba(13,2,7,0.5) 65%, rgba(13,2,7,0.1) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(200,155,71,0.022) 50px, rgba(200,155,71,0.022) 51px)`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "relative", zIndex: 5, height: "100%", padding: "28px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <div style={{ width: 18, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: "rgba(200,155,71,0.78)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Tradition. Trust. Timeless Quality.</span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving",           italic: false, color: T.warmCream   },
            { text: "Heritage",          italic: true,  color: T.antiqueGold },
            { text: "Into Every Thread", italic: false, color: T.warmCream   },
          ].map(({ text, italic, color }, i) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.85, delay: 0.45 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: F.display, fontWeight: 400,
                  fontStyle: italic ? "italic" : "normal",
                  fontSize: "clamp(28px, 7vw, 38px)", letterSpacing: "-0.2px", color,
                }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.95 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: "rgba(245,232,208,0.90)", lineHeight: 1.8, margin: 0, maxWidth: 240, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship — four generations of excellence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 14, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.warmCream, letterSpacing: "0.1px", boxShadow: `0 6px 20px rgba(110,15,45,0.38)` }}
          >
            Explore Production <ChevronRight size={12} color={T.warmCream} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "inline-flex", alignItems: "center", padding: "10px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(245,232,208,0.12)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(245,232,208,0.92)", letterSpacing: "0.1px" }}
          >
            View Reports
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — METRICS
// ═══════════════════════════════════════════════════════════════════════════════
function MobileMetrics() {
  const normal = METRICS.filter(m => !m.hi);
  const highlighted = METRICS.find(m => m.hi)!;
  const top2 = normal.slice(0, 2);
  const bot2 = normal.slice(2, 4);

  const SmallCard = ({ m, delay = 0 }: { m: typeof METRICS[0]; delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, delay, ease: EASE }}
        style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {m.ico}
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 36, color: T.warmCream, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw={m.val} />
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, color: "rgba(245,232,208,0.92)", letterSpacing: "1.6px", textTransform: "uppercase" }}>{m.label}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: "rgba(245,232,208,0.85)", letterSpacing: "0.05px" }}>{m.sub}</div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
      style={{ padding: "0 16px 16px", marginTop: -20, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.13)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(245,232,208,0.12)" }}>
          <SmallCard m={top2[0]} delay={0.5} />
          <div style={{ width: 1, background: "rgba(245,232,208,0.12)" }} />
          <SmallCard m={top2[1]} delay={0.6} />
        </div>
        {/* Highlighted Payments */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{ padding: "20px 18px 18px", background: "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.08) 100%)", borderBottom: "1px solid rgba(245,232,208,0.10)", position: "relative" }}
        >
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {highlighted.ico}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 10, color: "rgba(200,155,71,1)", letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 4 }}>{highlighted.label}</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: T.goldLight, lineHeight: 1.0, ...NUM }}>
                <AnimatedNumber raw={highlighted.val} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "rgba(231,201,131,0.95)", marginBottom: 8, letterSpacing: "0.05px" }}>{highlighted.sub}</div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginLeft: "auto" }}
              >
                <ChevronRight size={13} color={T.goldLight} />
              </motion.div>
            </div>
          </div>
        </motion.div>
        <div style={{ display: "flex", borderTop: "1px solid rgba(245,232,208,0.12)" }}>
          <SmallCard m={bot2[0]} delay={0.8} />
          <div style={{ width: 1, background: "rgba(245,232,208,0.12)" }} />
          <SmallCard m={bot2[1]} delay={0.9} />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
function MobilePerformance() {
  return (
    <FadeUp style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Performance Overview</span>
        </div>
        <ChevronRight size={16} color={T.taupe} />
      </div>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", padding: "20px", marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 18, color: T.luxuryBrown, marginBottom: 16, letterSpacing: "-0.1px" }}>Production Progress</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Donut size={140} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[{ label: "Production", pct: 72, color: T.antiqueGold }, { label: "Inventory", pct: 84, color: T.royalBurgundy }, { label: "Payments", pct: 46, color: DARK_MAROON }].map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: T.taupe, letterSpacing: "0.05px" }}>{b.label}</span>
                <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, ...NUM }}>{b.pct}%</span>
              </div>
              <AnimatedBar pct={b.pct} color={b.color} height={4} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", marginBottom: 14, overflow: "hidden" }}>
        <SareesProduced compact />
      </div>
    </FadeUp>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — FEATURED PRODUCT
// ═══════════════════════════════════════════════════════════════════════════════
function MobileFeaturedProduct() {
  return (
    <FadeUp style={{ padding: "14px 16px 0" }}>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", overflow: "hidden" }}>
        <FeaturedProduct compact />
      </div>
    </FadeUp>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════
function MobileActivity({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.65, ease: EASE }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Recent Activity</span>
        </div>
        <button onClick={() => onNavigate("Notifications")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </motion.div>
      <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 32px rgba(74,6,27,0.16)", border: "1px solid rgba(200,155,71,0.12)" }}>
        {ACT.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 18px", backgroundColor: "rgba(0,0,0,0)", borderBottom: i < ACT.length - 1 ? "1px solid rgba(245,232,208,0.10)" : "none" }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: a.bg, boxShadow: `0 4px 14px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {a.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14.5, color: "rgba(245,232,208,0.97)", lineHeight: 1.6, marginBottom: 6, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.bg, boxShadow: `0 0 6px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 11.5, color: "rgba(245,232,208,0.78)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — WEAVERS
// ═══════════════════════════════════════════════════════════════════════════════
function MobileWeavers({ onNavigate }: { onNavigate: (tab: string, ctx?: any) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Active Weavers</span>
        </div>
        <button onClick={() => onNavigate("AllWeavers")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.12)" }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
            style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            {/* Header Banner - Full Image Height 170px */}
            <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
              {w.img ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                </div>
              )}

              {/* Dark gradient overlay for modern look */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

              {/* Floating ID badge in top left */}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                {w.id}
              </div>

              {/* Floating status pill */}
              <div style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px"
              }}>
                {w.status === "active" ? (
                  <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                ) : w.status === "qc" ? (
                  <PhClock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontFamily: F.ui,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                }}>
                  {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
              {/* Name and Batch */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                  {w.name}
                </div>
                {w.batch && (
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                    {w.batch}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.village}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.mobile}</span>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

              {/* Looms stat */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Rows size={14} color={T.royalBurgundy} weight="fill" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Eye size={14} /> Details
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "edit" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Edit3 size={13} /> Edit
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Layers3 size={14} /> Batches
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — RAW MATERIAL
// ═══════════════════════════════════════════════════════════════════════════════
function MobileRawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Raw Material Overview</span>
        </div>
        <button onClick={() => onNavigate("Materials")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MATS.map((m, i) => (
          <motion.div
            key={m.name}
            onClick={() => onNavigate("Materials")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.10)" }}
            transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
            style={{ background: T.warmIvory, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.borderDef}`, boxShadow: "0px 6px 24px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 150, overflow: "hidden" }}>
              <motion.img
                src={m.img}
                alt={m.name}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.45 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, lineHeight: 1.5, marginBottom: 4 }}>{m.desc}</div>
              {m.extra && <div style={{ marginBottom: 4 }}>{m.extra}</div>}
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: m.stockColor, lineHeight: 1, margin: "12px 0 6px" }}>{m.stock}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: m.green ? T.taupe : T.crimson, lineHeight: 1.5, marginBottom: 12 }}>{m.note}</div>
              <AnimatedBar pct={m.pct} color={m.barColor} height={5} />
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, margin: "8px 0 12px" }}>{m.pct}% of storage capacity</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: m.green ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", border: `1px solid ${m.green ? "rgba(30,102,64,0.20)" : "rgba(192,57,43,0.20)"}`, borderRadius: 8, padding: "5px 12px" }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: m.green ? T.green : T.crimson }}>{m.badge}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function MobileFooter() {
  return (
    <footer style={{ padding: "24px 16px 0" }}>
      <FadeUp>
        <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", position: "relative", boxShadow: "0 12px 40px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}>
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ position: "relative", height: 140 }}>
            <motion.img
              src={imgSareeFooter}
              alt="Saree"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.5 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(44,9,19,0.94) 0%, rgba(44,9,19,0.60) 50%, rgba(44,9,19,0.20) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(200,155,71,0.32)", flexShrink: 0 }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "sepia(1) saturate(3) hue-rotate(340deg) brightness(1.2)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: T.warmCream, lineHeight: 1.2 }}>Crafted with Pride.</div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: T.antiqueGold, lineHeight: 1.2 }}>Delivered with Trust.</div>
                </div>
              </div>
              <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: "rgba(245,232,208,0.88)", lineHeight: 1.75, margin: "8px 0 10px", letterSpacing: "0.05px" }}>
                Four generations of passion, woven into every creation.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.28)", background: "rgba(200,155,71,0.09)", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 11.5, color: T.goldLight, letterSpacing: "0.1px" }}
              >
                Know Our Story <ArrowRight size={11} color={T.goldLight} />
              </motion.button>
            </div>
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.1} style={{ padding: "24px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderGold}` }}>
            <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, letterSpacing: "0.1px" }}>Beere Kesava &amp; Brothers Silks</div>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${T.borderDef}` }}>
          {["About Us","Our Legacy","Sustainability","Careers","Contact Us"].map((l, i, arr) => (
            <motion.div
              key={l}
              whileHover={{ x: 4 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderDef}` : "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13.5, color: T.luxuryBrown, letterSpacing: "0.1px" }}>{l}</span>
              <ChevronRight size={13} color={T.taupe} />
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, paddingTop: 20, paddingBottom: 16 }}>
          {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.14, y: -3 }}
              whileTap={{ scale: 0.92 }}
              style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.borderDef}`, background: T.warmIvory, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon size={15} color={T.luxuryBrown} />
            </motion.div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, paddingBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lotus size={13} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: T.antiqueGold, letterSpacing: "1.8px", textTransform: "uppercase", opacity: 0.80 }}>
              Tradition · Trust · Timeless Quality
            </span>
          </div>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, opacity: 0.70, letterSpacing: "0.05px" }}>
            © 1999 Beere Kesava &amp; Brothers Silks. All rights reserved.
          </span>
        </div>
      </FadeUp>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export { MobileMenuDrawer, MobileTopNav, MobileHero, MobileMetrics, MobilePerformance, MobileFeaturedProduct, MobileActivity, MobileWeavers, MobileRawMaterial, MobileFooter };
