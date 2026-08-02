
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../app/components/useResponsive";
import { useBatches, SareeRow } from "../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../app/components/DesignLibraryContext";
import { DesignCodeCard } from "../../../app/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../app/components/WeaverPaymentsContext";
import { useAuth } from "../../../contexts/AuthContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../app/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────

import { MyBatchesPage } from './weaver-portal/MyBatchesPage';
import { ConfirmMaterialPage } from './weaver-portal/ConfirmMaterialPage';
import { WarpRequestPage } from './weaver-portal/WarpRequestPage';
import { PaymentLedgerPage } from './weaver-portal/PaymentLedgerPage';
import { NotificationsPage } from './weaver-portal/NotificationsPage';
import { BatchHistoryPage } from './weaver-portal/BatchHistoryPage';
import { DesktopWeaverPortal } from './weaver-portal/DesktopWeaverPortal';
import { MobileWeaverPortal } from './weaver-portal/MobileWeaverPortal';
type Tab5 = "batches" | "confirm" | "warp" | "payments";

export function WeaverPortal({ onBack }: { onBack?: () => void }) {
  const { isMobile, w } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1024 ? "desktop" : "tablet";

  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);

  let active: Tab5 = "batches";
  if (pathname.includes("/confirm")) active = "confirm";
  else if (pathname.includes("/warp")) active = "warp";
  else if (pathname.includes("/payments")) active = "payments";

  const setActive = (tab: Tab5) => {
    const routeMap: Record<Tab5, string> = {
      batches: "/weaver/batches",
      confirm: "/weaver/confirm",
      warp: "/weaver/warp",
      payments: "/weaver/payments",
    };
    const path = routeMap[tab] || "/weaver/batches";
    routerNavigate(path);
  };

  return (
    <>
      <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
      {isMobile
        ? <MobileWeaverPortal onBack={onBack} active={active} setActive={setActive} onProfile={() => setShowProfileModal(true)} />
        : <DesktopWeaverPortal onBack={onBack} bp={bp} active={active} setActive={setActive} onProfile={() => setShowProfileModal(true)} />}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} role="weaver" />
        )}
      </AnimatePresence>
    </>
  );
}

export function UserProfileModal({ onClose, role }: { onClose: () => void; role: "admin" | "superadmin" | "shop" | "weaver" }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: "100%", maxWidth: 440, background: "#FFFDF9", borderRadius: 24, overflow: "hidden", border: `1px solid rgba(139,26,46,0.12)`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #4A061B 0%, #6B1A2A 100%)", padding: "32px 24px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.12)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#FFF" />
          </button>
          
          <div style={{ width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFF" }}>
              {role === "admin" ? "AD" : role === "superadmin" ? "SA" : role === "shop" ? "PS" : "RK"}
            </span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>
            {role === "admin" ? "Ravi Shankar" : role === "superadmin" ? "Venkata Leeladhar Abburi" : role === "shop" ? "Priya Sharma" : "Ravi Kumar"}
          </div>
          
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {role === "admin" ? "ADM-001" : role === "superadmin" ? "SADM-001" : role === "shop" ? "SS-001" : "WV-001 / WVR-014"}
          </div>

          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(196,146,58,0.22)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "4px 14px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#C4923A" }}>
              {role === "admin" ? "Store Administrator" : role === "superadmin" ? "Super Administrator" : role === "shop" ? "Showroom Sales Staff" : "Master Handloom Weaver"}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ padding: "24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: "#8B7060", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Contact & Work Details</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Email Address", value: role === "admin" ? "admin@beerekesava.com" : role === "superadmin" ? "leeladhar@beerekesava.com" : role === "shop" ? "priya.sharma@beerekesava.com" : "ravikumar.wvr@gmail.com" },
              { label: "Phone Number", value: role === "admin" ? "+91 94405 88991" : role === "superadmin" ? "+91 98480 22338" : role === "shop" ? "+91 99088 12345" : "+91 99088 77665" },
              { label: "Factory/Office", value: role === "shop" ? "Dharmavaram Main Showroom, AP" : "Dharmavaram Factory Outlet, AP" },
              { label: "Joined Date", value: role === "admin" ? "January 2019" : role === "superadmin" ? "June 2012" : role === "shop" ? "October 2022" : "March 2018" },
              ...(role === "weaver" ? [{ label: "Loom Assignment", value: "Loom 2 & Loom 5 (Active)" }] : [])
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(139,26,46,0.06)", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8B7060" }}>{item.label}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A0A0F", textAlign: "right" as const }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" as const }}>
            <button onClick={onClose} style={{ background: "#6B1A2A", color: "#FFF", border: "none", borderRadius: 999, padding: "10px 24px", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(107,26,42,0.2)" }}>
              Close Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

