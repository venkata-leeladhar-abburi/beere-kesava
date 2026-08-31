
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useResponsive } from "../../../hooks/useResponsive";
import { AnimatePresence } from "motion/react";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";

// ─── Design Tokens ─────────────────────────────────────────────────────────

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

