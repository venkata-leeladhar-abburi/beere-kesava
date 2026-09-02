import React from "react";
import { C, F, type TabId } from "./theme";
import { MobileNav, type MobileNavItem } from "../../../../shared/ui/nav/MobileNav";
import { usePendingShopDispatchCount } from "./IncomingDispatchSection";
import { Home, ShoppingBag, Package, Users, RotateCcw } from "lucide-react";

// "return" is a tab visually but not a TabId — it toggles showReturn instead of
// changing the active tab, so it is kept out of the union setActive accepts.
type MobileTabId = TabId | "return";

export function MobileTabBar({
  active, showReturn, setActive, setShowReturn,
}: {
  active: string;
  showReturn: boolean;
  setActive: (tab: TabId) => void;
  setShowReturn: (v: boolean) => void;
}) {
  // Consignments waiting to be received live under Inventory, and nothing
  // else in the portal shows them — the badge is the prompt to go and receive.
  const pendingReceipts = usePendingShopDispatchCount();

  const MOBILE_TABS: Array<{ id: MobileTabId; label: string; icon: React.ReactElement }> = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "sale", label: "New Sale", icon: <ShoppingBag size={20} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    { id: "return", label: "Return", icon: <RotateCcw size={20} /> },
  ];

  const activeKey = showReturn ? "return" : active;

  const items: MobileNavItem[] = MOBILE_TABS.map(tab => ({
    key: tab.id,
    label: tab.label,
    icon: (props: React.ComponentProps<"svg">) => React.cloneElement(tab.icon as React.ReactElement<React.ComponentProps<"svg">>, props),
    onClick: () => {
      if (tab.id === "return") {
        setShowReturn(true);
      } else {
        setShowReturn(false);
        setActive(tab.id);
      }
    },
    badge: tab.id === "sale" ? true : tab.id === "inventory" ? pendingReceipts > 0 : undefined,
    style: { fontWeight: tab.id === activeKey ? 600 : 500 },
  }));

  return (
    <MobileNav
      items={items}
      activeKey={activeKey}
      activeColor={C.burg}
      inactiveColor={C.muted}
      indicatorColor={C.burg}
      badgeColor={C.crim}
      labelStyle={{ fontFamily: F.u, fontSize: 11 }}
      baseHeight="66px"
      style={{
        background: C.white,
        borderTop: `1px solid ${C.bdr}`,
        boxShadow: "0 -4px 20px rgba(110,15,45,0.08)",
        zIndex: 100,
      }}
    />
  );
}
