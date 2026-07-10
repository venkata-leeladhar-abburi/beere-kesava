import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Shield, Package,
  Layers, ShoppingCart, ArrowRight, ChevronRight,
} from "lucide-react";
import logo from "../imports/logo.png";
import { useResponsive } from "./components/useResponsive";
import { BeereDashboard } from "./components/BeereDashboard";
import { SuperadminDashboard } from "./components/SuperadminDashboard";
import { POProvider } from "./components/POContext";
import { BulkOrderProvider } from "./components/BulkOrderContext";
import { DesignLibraryProvider } from "./components/DesignLibraryContext";
import { BatchProvider } from "./components/BatchContext";
import { MaterialIssueProvider } from "./components/MaterialIssueContext";
import { FirmsProvider } from "./components/FirmsContext";
import { WeaverPaymentsProvider } from "./components/WeaverPaymentsContext";
import { FinishingStaffProvider } from "./components/FinishingStaffContext";
import { FinishingProvider } from "./components/FinishingContext";
import { Toaster } from "./components/ui/sonner";
import { LoginPage } from "./components/LoginPage";
import { MobileScanView } from "./components/MobileScanView";
import { WorkerPortal } from "./components/WorkerPortal";
import { WeaverPortal } from "./components/WeaverPortal";
import { ShopStaffPortal } from "./components/ShopStaffPortal";
import "../styles/mobile.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#1a0008", color: "#ff6b6b", minHeight: "100vh" }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: 16 }}>Render Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: 13 }}>
            {(this.state.error as Error).message}{"\n\n"}{(this.state.error as Error).stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const T = { silkCream: "#F7F2EA", royalBurgundy: "#6E0F2D", antiqueGold: "#C89B47", luxuryBrown: "#3B2314", taupe: "#8B7060", darkBg: "#3D0E1A" };
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

type Role = "admin" | "superadmin" | "worker" | "weaver" | "shop";

const PORTALS: {
  role: Role; label: string; sub: string; desc: string;
  icon: React.ReactNode; color: string; lightBg: string; border: string;
}[] = [
  {
    role: "admin",
    label: "Admin Portal",
    sub: "Day-to-day Operations",
    desc: "Manage production, materials, weavers, dispatch, and shop operations.",
    icon: <LayoutDashboard size={26} />,
    color: "#6E0F2D",
    lightBg: "rgba(110,15,45,0.07)",
    border: "rgba(110,15,45,0.18)",
  },
  {
    role: "superadmin",
    label: "Superadmin Portal",
    sub: "Full System Access",
    desc: "Rates, approvals, audit logs, pricing, and complete oversight.",
    icon: <Shield size={26} />,
    color: "#C89B47",
    lightBg: "rgba(200,155,71,0.10)",
    border: "rgba(200,155,71,0.30)",
  },
  {
    role: "worker",
    label: "Worker Staff Portal",
    sub: "Floor Operations",
    desc: "GRN, weaver management, quality check, and warp requests.",
    icon: <Package size={26} />,
    color: "#1E6640",
    lightBg: "rgba(30,102,64,0.08)",
    border: "rgba(30,102,64,0.22)",
  },
  {
    role: "weaver",
    label: "Weaver Portal",
    sub: "My Batches & Earnings",
    desc: "View batches, color slips, raise warp requests, and track payments.",
    icon: <Layers size={26} />,
    color: "#7B3F00",
    lightBg: "rgba(123,63,0,0.08)",
    border: "rgba(123,63,0,0.22)",
  },
  {
    role: "shop",
    label: "Shop Staff Portal",
    sub: "Sales & Inventory",
    desc: "Record sales, manage inventory, process returns, and view reports.",
    icon: <ShoppingCart size={26} />,
    color: "#008080",
    lightBg: "rgba(0,128,128,0.08)",
    border: "rgba(0,128,128,0.22)",
  },
];

function RoleSelect({ onRole }: { onRole: (role: Role) => void }) {
  const [hovered, setHovered] = useState<Role | null>(null);
  const { isMobile, isTablet } = useResponsive();
  const stacked = isMobile || isTablet;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", flexDirection: stacked ? "column" as const : "row" as const, fontFamily: F.ui }}>

      {/* Left dark brand panel */}
      <div style={{
        width: stacked ? "100%" : 340, minHeight: stacked ? undefined : "100vh",
        background: T.darkBg, position: "relative" as const, overflow: "hidden", flexShrink: 0,
        display: "flex", flexDirection: "column" as const,
        padding: isMobile ? "28px 22px" : isTablet ? "36px 40px" : "56px 48px",
      }}>
        {/* Texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, rgba(196,146,58,0.025) 0px, rgba(196,146,58,0.025) 1px, transparent 1px, transparent 28px)`, pointerEvents: "none" }} />
        {/* Rings */}
        <div style={{ position: "absolute", right: -80, bottom: -80, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -40, bottom: -40, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.04)", pointerEvents: "none" }} />

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isMobile ? 22 : 52 }}>
            <div style={{ width: isMobile ? 44 : 54, height: isMobile ? 44 : 54, borderRadius: 13, background: "#FFFFFF", border: "1px solid rgba(196,146,58,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
              <img src={logo} alt="Beere Kesava Logo" style={{ width: isMobile ? 30 : 38, height: isMobile ? 30 : 38, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 16 : 18, color: "#F5EDD0", lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: isMobile ? 12 : 14, color: "rgba(245,237,208,0.55)" }}>& Brothers Silks</div>
              {!isMobile && <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2.5px", color: T.antiqueGold, marginTop: 5, textTransform: "uppercase" as const }}>Since 1999</div>}
            </div>
          </div>

          {!isMobile && <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", color: "rgba(245,237,208,0.40)", textTransform: "uppercase" as const, marginBottom: 14 }}>Select Your</div>}
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 28 : 40, color: "#FFFDF9", lineHeight: 1.05, marginBottom: isMobile ? 4 : 6 }}>Access</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 28 : 40, fontStyle: "italic", color: T.antiqueGold, lineHeight: 1.05, marginBottom: isMobile ? 0 : 24 }}>Portal</div>
          {/* Supporting description — desktop/tablet only, per design, mobile stays compact */}
          {!isMobile && (
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,237,208,0.55)", lineHeight: 1.75, maxWidth: 240 }}>
              Choose the dashboard that matches your role. Each portal is tailored to your specific responsibilities.
            </div>
          )}
        </div>

        {/* Bottom badge — desktop only, keeps the mobile/tablet header compact */}
        {!stacked && (
          <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: 32 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: "rgba(245,237,208,0.35)", textTransform: "uppercase" as const, marginBottom: 10 }}>6 portals available</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "5px 7px" }}>
                {PORTALS.map(p => (
                  <span key={p.role} style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: T.antiqueGold, background: "rgba(196,146,58,0.12)", border: "1px solid rgba(196,146,58,0.22)", borderRadius: 999, padding: "4px 12px" }}>{p.sub}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: portal grid */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column" as const,
        padding: isMobile ? "24px 18px" : isTablet ? "32px 32px" : "52px 56px",
        overflowY: "auto" as const,
      }}>
        {/* Header — desktop/tablet only; mobile skips straight to the portal list */}
        {!isMobile && (
          <div style={{ marginBottom: isTablet ? 24 : 40 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", color: T.taupe, textTransform: "uppercase" as const, marginBottom: 12 }}>Beere Kesava & Brothers Silks ERP</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isTablet ? 30 : 42, color: T.luxuryBrown, lineHeight: 1.05, marginBottom: 8 }}>Select Your Portal</div>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: T.taupe }}>Choose the dashboard that matches your role to get started.</div>
          </div>
        )}

        {/* Portal grid — 1 column on mobile, 2 columns tablet/desktop */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20, flex: 1 }}>
          {PORTALS.map(p => (
            <motion.button
              key={p.role}
              onClick={() => onRole(p.role)}
              onHoverStart={() => setHovered(p.role)}
              onHoverEnd={() => setHovered(null)}
              whileTap={{ scale: 0.98 }}
              style={{
                background: "#FFFFFF",
                borderTop: `1.5px solid ${hovered === p.role ? p.color : "rgba(110,15,45,0.10)"}`,
                borderRight: `1.5px solid ${hovered === p.role ? p.color : "rgba(110,15,45,0.10)"}`,
                borderBottom: `1.5px solid ${hovered === p.role ? p.color : "rgba(110,15,45,0.10)"}`,
                borderLeft: `5px solid ${p.color}`,
                borderRadius: 18,
                padding: isMobile ? "18px 18px" : "26px 26px",
                cursor: "pointer",
                textAlign: "left" as const,
                display: "flex",
                flexDirection: isMobile ? "row" as const : "column" as const,
                alignItems: isMobile ? "center" as const : undefined,
                gap: isMobile ? 14 : 0,
                boxShadow: hovered === p.role
                  ? `0 12px 40px rgba(0,0,0,0.10)`
                  : "0 2px 14px rgba(44,24,16,0.06)",
                transition: "all 0.18s ease",
              }}
            >
              {/* Icon + label row */}
              <div style={{
                display: "flex", alignItems: isMobile ? "center" as const : "flex-start", justifyContent: isMobile ? undefined : "space-between",
                marginBottom: isMobile ? 0 : 18, flexShrink: 0,
              }}>
                <div style={{ width: isMobile ? 46 : 54, height: isMobile ? 46 : 54, borderRadius: 14, background: p.lightBg, border: `1px solid ${p.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {React.cloneElement(p.icon as React.ReactElement, { color: p.color, size: isMobile ? 22 : 26 })}
                </div>
                {!isMobile && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: hovered === p.role ? p.lightBg : "rgba(0,0,0,0.03)", border: `1px solid ${hovered === p.role ? p.border : "rgba(0,0,0,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s" }}>
                    <ArrowRight size={15} color={hovered === p.role ? p.color : T.taupe} />
                  </div>
                )}
              </div>

              {/* Text — mobile drops the description so each row stays compact */}
              <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0 }}>
                <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", color: p.color, textTransform: "uppercase" as const, marginBottom: 6 }}>{p.sub}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 17 : 22, color: T.luxuryBrown, lineHeight: 1.15, marginBottom: isMobile ? 0 : 10 }}>{p.label}</div>
                {!isMobile && <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.65 }}>{p.desc}</div>}
              </div>

              {isMobile && <ArrowRight size={18} color={T.taupe} style={{ flexShrink: 0 }} />}
            </motion.button>
          ))}
        </div>

        {/* Footer — desktop/tablet only */}
        {!isMobile && (
          <div style={{ marginTop: 36, textAlign: "center" as const }}>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 2 }}>
              © 2026 Beere Kesava & Brothers Silks. All rights reserved.
            </div>
            <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 10, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase" as const }}>
              Since 1999 · Tradition. Trust. Timeless Quality.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<"login" | "role" | "dashboard" | "scan">("login");
  const [role, setRole] = useState<"admin" | "superadmin" | "worker" | "weaver" | "shop">("admin");

  return (
    <FinishingStaffProvider>
    <FinishingProvider>
    <WeaverPaymentsProvider>
    <FirmsProvider>
    <POProvider>
    <BulkOrderProvider>
    <DesignLibraryProvider>
    <BatchProvider>
    <MaterialIssueProvider>
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {stage === "login" && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LoginPage onLogin={() => setStage("role")} />
          </motion.div>
        )}
        {stage === "role" && (
          <motion.div key="role" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <RoleSelect onRole={(r) => { setRole(r); setStage("dashboard"); }} />
          </motion.div>
        )}
        {stage === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {role === "superadmin" ? (
              <SuperadminDashboard onBack={() => setStage("role")} />
            ) : role === "worker" ? (
              <WorkerPortal onBack={() => setStage("role")} />
            ) : role === "weaver" ? (
              <WeaverPortal onBack={() => setStage("role")} />
            ) : role === "shop" ? (
              <ShopStaffPortal onBack={() => setStage("role")} />
            ) : (
              <BeereDashboard onBack={() => setStage("role")} />
            )}
          </motion.div>
        )}
        {stage === "scan" && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <MobileScanView />
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
    <Toaster position="top-right" richColors />
    </MaterialIssueProvider>
    </BatchProvider>
    </DesignLibraryProvider>
    </BulkOrderProvider>
    </POProvider>
    </FirmsProvider>
    </WeaverPaymentsProvider>
    </FinishingProvider>
    </FinishingStaffProvider>
  );
}
