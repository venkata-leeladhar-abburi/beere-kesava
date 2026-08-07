
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../weavers/contexts/WeaverPaymentsContext";
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
import { imgBKLogo } from "../../../shared/constants/weaverImages";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";

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
      {isMobile
        ? <MobileWeaverPortal onBack={onBack} active={active} setActive={setActive} onProfile={() => setShowProfileModal(true)} />
        : <DesktopWeaverPortal onBack={onBack} bp={bp} active={active} setActive={setActive} onProfile={() => setShowProfileModal(true)} />}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

