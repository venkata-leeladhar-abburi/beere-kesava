import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Shield, Settings, ClipboardList, ChevronRight,
  CheckCircle2, Building2,
} from "lucide-react";
import { imgHero } from "../../../../shared/constants/imageData";
import { T, F, G, NUM, EASE } from "./theme";
import { MATS } from "./data";
import { SectionHeader, AnimatedNumber } from "./atoms";
import { SAWeaverSection } from "./SAWeaverSection";
import { Button } from "../../../../shared/ui/primitives";
import { Alert } from "../../../../shared/ui/feedback";
import { useDashboardMetrics } from "../beere-dashboard/hooks/useDashboardMetrics";
import { useDashboardAnalytics } from "../beere-dashboard/hooks/useDashboardAnalytics";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import {
  Users, Layers, IndianRupee as IcoIndianRupee, Truck, Clock,
} from "lucide-react";

function SAHero() {
  return (
    <section style={{ position: "relative", height: "calc(100dvh - 90px - 160px)", minHeight: 380, overflow: "hidden", background: "#0D0207" }}>
      <motion.img src={imgHero} alt="Beere Kesava Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />

      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.6, ease: EASE }}
        style={{ position: "absolute", top: 28, right: 28, zIndex: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(196,146,58,0.18)", border: "1px solid rgba(196,146,58,0.42)", backdropFilter: "blur(12px)" }}
      >
        <Shield size={13} color="#845E04" />
        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: "#845E04", letterSpacing: "1.5px", textTransform: "uppercase" }}>Superadmin Access</span>
      </motion.div>

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Superadmin Overview
          </span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Superadmin", italic: false, color: T.warmCream, delay: 0.5 },
            { text: "Dashboard", italic: true, color: T.antiqueGold, delay: 0.68 },
            { text: "& Command Center", italic: false, color: T.warmCream, delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.15" }}>
              <motion.div initial={{ y: "110%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(42px, 4.5vw, 68px)", letterSpacing: "-0.01em", color }}
              >{text}</motion.div>
            </div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 440, letterSpacing: "0.05px" }}
        >
          Full visibility and control over all operations — rates, approvals, audit logs, and more.
        </motion.p>
      </div>

      {[180, 280, 380].map((sz, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 + i * 0.18, ease: EASE }}
          style={{ position: "absolute", right: "25%", top: "50%", transform: "translate(50%, -50%)", width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(196,146,58,${0.07 - i * 0.015})`, pointerEvents: "none", zIndex: 3 }}
        />
      ))}
    </section>
  );
}

/** Icon set in the same order as the metrics array from useDashboardMetrics, plus a superadmin-only "Pending Approvals" tile. */
const SA_ICONS = [
  <Users size={22} color={T.warmCream} />,
  <Layers size={22} color={T.warmCream} />,
  <IcoIndianRupee size={22} color={T.warmCream} />,
  <CheckCircle2 size={22} color={T.warmCream} />,
  <Truck size={22} color={T.warmCream} />,
];

function SAMetricsBar() {
  const { metrics, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics();
  const { pendingApprovalsCount, isLoading: analyticsLoading, isError: analyticsError } = useDashboardAnalytics();

  const saMetrics = [
    ...metrics.map((m, i) => ({
      ...m,
      ico: SA_ICONS[i],
      val: metricsError ? "Error" : metricsLoading ? "—" : m.val,
      sub: metricsError ? "Failed to load" : m.sub,
    })),
    {
      ico: <Clock size={22} color={T.warmCream} />,
      label: "Pending Approvals",
      val: analyticsError ? "Error" : analyticsLoading ? "—" : String(pendingApprovalsCount),
      sub: analyticsError ? "Failed to load" : "Require review",
      hi: false,
      crimsonHi: !analyticsError && pendingApprovalsCount > 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <div className="grid grid-cols-2 xl:flex" style={{ background: G.card, borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {saMetrics.map((m: any, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : m.crimsonHi ? "rgba(192,57,43,0.12)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 18px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : m.crimsonHi ? "linear-gradient(135deg, rgba(192,57,43,0.16) 0%, rgba(192,57,43,0.05) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < saMetrics.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "pointer",
            }}
          >
            <motion.div whileHover={{ scale: 1.08, rotate: 3 }} transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : m.crimsonHi ? "rgba(192,57,43,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : m.crimsonHi ? "rgba(192,57,43,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >{m.ico}</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : m.crimsonHi ? "rgba(232,120,110,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : m.crimsonHi ? "#F08080" : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : m.crimsonHi ? "rgba(240,128,128,0.90)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SAAlertStrip() {
  return (
    <div style={{ margin: "36px 48px 0" }}>
      <Alert tone="warning" title="You are in Superadmin mode">
        All data is visible and editable. Actions here affect the entire system.
      </Alert>
    </div>
  );
}

function SAQuickActions({ setNav }: { setNav: (v: string) => void }) {
  const { pendingApprovalsCount } = useDashboardAnalytics();
  const actions = [
    { icon: <Settings size={22} color={T.antiqueGold} />, label: "Edit Rates & Pricing", sub: "Update making charge rates", nav: "Rates", color: T.antiqueGold, bg: "rgba(200,155,71,0.08)", border: "rgba(200,155,71,0.22)" },
    { icon: <CheckCircle2 size={22} color={T.royalBurgundy} />, label: "Review Approvals", sub: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending require action` : "All caught up", nav: "Approvals", color: T.royalBurgundy, bg: "rgba(110,15,45,0.06)", border: T.borderDef, badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined },
    { icon: <ClipboardList size={22} color={T.luxuryBrown} />, label: "View Audit Log", sub: "Full system activity trail", nav: "AuditLog", color: T.luxuryBrown, bg: "rgba(59,35,20,0.06)", border: "rgba(59,35,20,0.12)" },
    { icon: <Building2 size={22} color={T.green} />, label: "Manage Firms", sub: "Payments & vendor records", nav: "Payments", color: T.green, bg: "rgba(30,102,64,0.06)", border: "rgba(30,102,64,0.14)" },
  ];
  return (
    <section style={{ padding: "36px 48px 0" }}>
      <SectionHeader title="Quick Actions" actionText="" small />
      <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: 16 }}>
        {actions.map((a, i) => (
          <motion.div key={a.nav}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.09 }}
            whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(74,6,27,0.12)" }}
            whileTap={{ scale: 0.97 }}
            style={{ borderRadius: 20, border: `1px solid ${a.border}`, background: a.bg, position: "relative" }}
          >
            <Button
              onClick={() => setNav(a.nav)}
              variant="tertiary"
              fullWidth
              className="!h-auto !py-[22px] !px-5 !rounded-[20px] !border-none !bg-transparent !justify-start !text-left !flex-col !items-start !gap-2.5"
            >
              {a.badge && (
                <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: "#fff" }}>{a.badge}</span>
                </div>
              )}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.60)", border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, letterSpacing: "-0.1px", marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>{a.sub}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: a.color, fontFamily: F.ui, fontWeight: 500, fontSize: 12 }}>
                Open <ChevronRight size={12} />
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// NOTE: raw-material stock (Warp/Resham/Jari kg-on-hand, %-capacity) has no
// backend module — same documented gap as the Materials feature elsewhere
// in this sweep. MATS below stays static mock data; do not invent numbers.
function SARawMaterial() {
  const { data: stockRes } = useQuery({
    queryKey: ["raw-material-stock-list"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const stockItems = stockRes?.items ?? [];

  const warpStock = stockItems.filter(i => i.materialType === "WARP").reduce((s, i) => s + Number(i.currentStock), 0);
  const reshamStock = stockItems.filter(i => i.materialType === "RESHAM").reduce((s, i) => s + Number(i.currentStock), 0);
  const jariStock = stockItems.filter(i => i.materialType === "JARI").reduce((s, i) => s + Number(i.currentStock), 0);

  const mats = MATS.map(m => {
    if (m.name === "Warp") return { ...m, stock: `${warpStock} kg` };
    if (m.name === "Resham") return { ...m, stock: `${reshamStock} kg` };
    if (m.name === "Jari") return { ...m, stock: `${jariStock} Buns` };
    return m;
  });

  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" />
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
        {mats.map((m, i) => (
          <motion.div key={m.name}
            initial={{ opacity: 0, scale: 0.88, y: 36, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.015, boxShadow: "0px 36px 88px rgba(74,6,27,0.17)" }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: i * 0.14, opacity: { duration: 0.45 }, filter: { duration: 0.55 } }}
            style={{ background: m.cardBg, borderRadius: 28, overflow: "hidden", border: `1px solid ${m.borderColor}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 170, overflow: "hidden", position: "relative" }}>
              <motion.img src={m.img} alt={m.name} whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.accent, opacity: 0.7 }} />
            </div>
            <div style={{ padding: "22px 24px 26px" }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 24, color: T.luxuryBrown, letterSpacing: "-0.2px", lineHeight: 1.1, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 20, letterSpacing: "0.1px" }}>{m.sub}</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: m.accent, lineHeight: 1.0, marginBottom: 4, ...NUM }}>
                <AnimatedNumber raw={m.stock.replace(" kg", "").replace(" Buns", "")} />{m.stock.includes("kg") ? " kg" : m.stock.includes("Buns") ? " Buns" : ""}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function SAOverviewPage({ setNav }: { setNav: (v: string) => void }) {
  return (
    <div style={{ background: T.silkCream }}>
      <SAHero />
      <SAMetricsBar />
      <SAAlertStrip />
      <div style={{ background: T.silkCream, paddingTop: 36 }}>
        <SAQuickActions setNav={setNav} />
      </div>
      <SAWeaverSection onNavigate={setNav} />
      <SARawMaterial />
    </div>
  );
}
