import React from "react";
import { C, F } from "./theme";
import { MobileNav, type MobileNavItem } from "../../../../shared/ui/nav/MobileNav";
import { Home, ShoppingBag, Package, Users, RotateCcw } from "lucide-react";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports" | "return";

export function MobileTabBar({
  active, showReturn, setActive, setShowReturn,
}: {
  active: string;
  showReturn: boolean;
  setActive: (tab: any) => void;
  setShowReturn: (v: boolean) => void;
}) {
  const MOBILE_TABS = [
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
    badge: tab.id === "sale" ? true : undefined,
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
