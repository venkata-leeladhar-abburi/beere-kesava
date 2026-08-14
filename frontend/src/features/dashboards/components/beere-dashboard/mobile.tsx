
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChevronRight, ArrowRight,
  Facebook, Instagram, Youtube, Linkedin,
  CheckCircle2,
  Package, IndianRupee, Users,
  Layers
, Flower2 as Lotus } from 'lucide-react';
import { useInView } from 'motion/react';
import { imgBKLogo, imgSareeFooter, imgShowroom } from '../../../../shared/constants/weaverImages';
import { T, F, G, NUM, DARK_MAROON, EASE } from './theme';
import { FadeUp, AnimatedNumber, AnimatedBar, Donut } from './ui';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useDashboardAnalytics } from './hooks/useDashboardAnalytics';

import { SareesProduced, FeaturedProduct } from './components/ThreeCol';

/** Icon set in the same order as the metrics array from useDashboardMetrics. */
const METRIC_ICONS = [
  <Users key="users" size={22} color={T.warmCream} />,
  <Layers key="layers" size={22} color={T.warmCream} />,
  <IndianRupee key="indian-rupee" size={22} color={T.warmCream} />,
  <CheckCircle2 key="check-circle" size={22} color={T.warmCream} />,
  <Package key="package" size={22} color={T.warmCream} />,
];

import { MobileMenuDrawer, MobileTopNav } from './MobileNavDrawer';
import { Button } from "../../../../shared/ui/primitives";

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function MobileHero() {
  return (
    <section style={{ position: "relative", minHeight: 464, overflow: "hidden", background: "#0D0207", display: "flex" }}>
      {/* Full-bleed showroom plate — a 55%-wide right panel left the image
          cropped through its focal point on a phone; full-bleed + a directional
          scrim keeps the showroom readable behind the copy at every width. */}
      <motion.img
        src={imgShowroom}
        alt="Showroom"
        initial={{ scale: 1.14, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 14, ease: "linear", opacity: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "68% center" }}
      />
      {/* Vertical scrim — anchors the copy block at the bottom */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "linear-gradient(to top, #0D0207 0%, rgba(13,2,7,0.95) 30%, rgba(13,2,7,0.74) 55%, rgba(13,2,7,0.38) 78%, rgba(13,2,7,0.22) 100%)" }} />
      {/* Horizontal scrim — protects the left text edge, lets the showroom breathe top-right */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, rgba(13,2,7,0.82) 0%, rgba(13,2,7,0.48) 46%, rgba(13,2,7,0.08) 82%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 3, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(200,155,71,0.022) 50px, rgba(200,155,71,0.022) 51px)`, pointerEvents: "none" }} />
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
      {/* Copy block — bottom-anchored on one shared left edge; the 56px bottom
          pad is what the stats card's negative overlap eats into. */}
      <div style={{ position: "relative", zIndex: 5, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 18, padding: "76px 20px 56px" }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{ width: 22, height: 1, background: T.antiqueGold, opacity: 0.65, flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: "rgba(200,155,71,0.82)", letterSpacing: "2.2px", textTransform: "uppercase", lineHeight: 1.4 }}>Tradition. Trust. Timeless Quality.</span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving",           italic: false, color: T.warmCream   },
            { text: "Heritage",          italic: true,  color: T.antiqueGold },
            { text: "Into Every Thread", italic: false, color: T.warmCream   },
          ].map(({ text, italic, color }, i) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.1" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.85, delay: 0.45 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: F.display, fontWeight: 400,
                  fontStyle: italic ? "italic" : "normal",
                  fontSize: "clamp(32px, 8.6vw, 44px)", letterSpacing: "-0.4px", color,
                  textShadow: "0 2px 18px rgba(13,2,7,0.55)",
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
          className="max-w-[320px]"
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.88)", lineHeight: 1.75, margin: 0, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship — four generations of excellence.
        </motion.p>
        {/* Both CTAs share one geometry (min-h 46 / px-5 / radius 14) so their
            caps and baselines line up exactly — they previously carried
            different py/px and rendered at different heights. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
          style={{ display: "flex", alignItems: "stretch", gap: 10, flexWrap: "wrap", marginTop: 2 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: "flex", borderRadius: 14, boxShadow: `0 8px 24px rgba(110,15,45,0.42)` }}>
            <Button
              variant="primary"
              className="!gap-2 !min-h-[46px] !py-0 !px-5 !rounded-[14px] !border-none !bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:!bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] !text-[#F5E8D0] !text-xs !font-semibold !tracking-[0.1px]"
            >
              Explore Production <ChevronRight size={13} color={T.warmCream} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", borderRadius: 14 }}>
            <Button
              variant="tertiary"
              className="!min-h-[46px] !py-0 !px-5 !rounded-[14px] !bg-white/[0.10] !border !border-white/25 !backdrop-blur-sm !text-[rgba(245,232,208,0.92)] !text-xs !font-semibold !tracking-[0.1px] hover:!bg-white/[0.16] hover:!text-[rgba(245,232,208,0.92)]"
            >
              View Reports
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — METRICS
// ═══════════════════════════════════════════════════════════════════════════════
function MobileMetrics() {
  const { metrics, isLoading, isError } = useDashboardMetrics();
  const displayMetrics = metrics.map((m, i) => ({ ...m, val: isError ? "Error" : isLoading ? "—" : m.val, sub: isError ? "Failed to load" : m.sub, ico: METRIC_ICONS[i] }));
  // Feature the flagged metric, else the last one. Selecting by INDEX and
  // excluding that same index is what keeps the featured band distinct — the
  // previous `find(hi) ?? [0]` fell back to tile #1 whenever nothing was
  // flagged, rendering "Active Weavers" twice and dropping "Dispatched"
  // entirely.
  const hiIdx = displayMetrics.findIndex(m => m.hi) >= 0
    ? displayMetrics.findIndex(m => m.hi)
    : displayMetrics.length - 1;
  const highlighted = displayMetrics[hiIdx];
  const normal = displayMetrics.filter((_, i) => i !== hiIdx);
  const top2 = normal.slice(0, 2);
  const bot2 = normal.slice(2, 4);

  const SmallCard = ({ m, delay = 0 }: { m: typeof displayMetrics[0]; delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, delay, ease: EASE }}
        style={{ flex: 1, minWidth: 0, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {m.ico}
        </div>
        {/* Numeral goes fluid so a 4-figure value can't push the tile wider
            than its half of the card at 320px. */}
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(30px, 9vw, 38px)", color: T.warmCream, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw={m.val} />
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color: "rgba(245,232,208,0.92)", letterSpacing: "1.2px", textTransform: "uppercase", lineHeight: 1.35 }}>{m.label}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(245,232,208,0.72)", letterSpacing: "0.05px", lineHeight: 1.4 }}>{m.sub}</div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
      style={{ padding: "0 16px 16px", marginTop: -28, position: "relative", zIndex: 20 }}
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
          {/* Two rows (icon+label / value+sub) rather than three cramped
              columns — the value and its sub-label now share a baseline and
              the chevron has a fixed home on the right. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {highlighted.ico}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontFamily: F.ui, fontWeight: 700, fontSize: 11, color: "rgba(200,155,71,1)", letterSpacing: "1.4px", textTransform: "uppercase", lineHeight: 1.35 }}>
                {highlighted.label}
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.94 }}
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <ChevronRight size={14} color={T.goldLight} />
              </motion.div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(34px, 11vw, 44px)", color: T.goldLight, lineHeight: 1.0, ...NUM }}>
                <AnimatedNumber raw={highlighted.val} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "rgba(231,201,131,0.95)", letterSpacing: "0.05px" }}>{highlighted.sub}</div>
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
  const { qcPassRate, paymentsCollectedPct, isLoading } = useDashboardAnalytics();
  // "Inventory" has no backend source — raw-material stock tracking is not
  // implemented (documented gap, same as desktop ThreeCol.tsx).
  const progBars = [
    { label: "Production (QC Pass)", pct: isLoading ? 0 : qcPassRate, color: T.antiqueGold },
    { label: "Inventory", pct: 0, color: T.royalBurgundy },
    { label: "Payments Collected", pct: isLoading ? 0 : paymentsCollectedPct, color: DARK_MAROON },
  ];
  return (
    <FadeUp style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Performance Overview</span>
        </div>
        <ChevronRight size={16} color={T.taupe} />
      </div>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", padding: "20px", marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 18, color: T.luxuryBrown, marginBottom: 16, letterSpacing: "-0.1px" }}>Production Progress</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Donut size={140} pct={isLoading ? 0 : qcPassRate} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {progBars.map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, letterSpacing: "0.05px" }}>{b.label}</span>
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

import { MobileActivity } from './MobileActivitySection';

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — WEAVERS
import { MobileWeavers, MobileRawMaterial } from './MobileWeaversSection';

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
              <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(245,232,208,0.88)", lineHeight: 1.75, margin: "8px 0 10px", letterSpacing: "0.05px" }}>
                Four generations of passion, woven into every creation.
              </p>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ alignSelf: "flex-start", borderRadius: 12 }}>
                <Button
                  variant="tertiary"
                  className="!gap-1.5 !py-[7px] !px-3.5 !rounded-xl !border !border-[rgba(200,155,71,0.28)] !bg-[rgba(200,155,71,0.09)] !text-xs !font-medium !text-[#E7C983] hover:!bg-[rgba(200,155,71,0.14)] hover:!text-[#E7C983]"
                >
                  Know Our Story <ArrowRight size={11} color={T.goldLight} />
                </Button>
              </motion.div>
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
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${T.borderDef}` }}>
          {["About Us","Our Legacy","Sustainability","Careers","Contact Us"].map((l, i, arr) => (
            <motion.div
              key={l}
              whileHover={{ x: 4 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderDef}` : "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.luxuryBrown, letterSpacing: "0.1px" }}>{l}</span>
              <ChevronRight size={13} color={T.taupe} />
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, paddingTop: 20, paddingBottom: 16 }}>
          {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon) => (
            <motion.div
              key={Icon.displayName}
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
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "1.8px", textTransform: "uppercase", opacity: 0.80 }}>
              Tradition · Trust · Timeless Quality
            </span>
          </div>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, opacity: 0.70, letterSpacing: "0.05px" }}>
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
