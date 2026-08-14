import React from "react";
import { C, F } from "./theme";
import { MobileNav, type MobileNavItem } from "../../../../shared/ui/nav/MobileNav";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function MobileTabBar({
  TABS, active, setActive,
}: {
  TABS: { id: TabId; label: string; icon: React.ReactNode }[];
  active: TabId;
  setActive: (tab: TabId) => void;
}) {
  const items: MobileNavItem[] = TABS.map(tab => ({
    key: tab.id,
    label: tab.label,
    // MobileNav wants an icon *component*; TABS carries an already-built
    // element (shared with DesktopTopNav), so wrap it in a component that
    // clones it with whatever size/color props MobileNav passes down —
    // preserves the exact same lucide icon TABS was built with.
    icon: (props: React.ComponentProps<"svg">) => React.cloneElement(tab.icon as React.ReactElement<React.ComponentProps<"svg">>, props),
    onClick: () => setActive(tab.id),
    badge: tab.id === "sale" ? true : undefined,
    style: { fontWeight: tab.id === active ? 600 : 500 },
  }));

  return (
    <MobileNav
      items={items}
      activeKey={active}
      activeColor={C.burg}
      inactiveColor={C.muted}
      indicatorColor={C.burg}
      badgeColor={C.crim}
      labelStyle={{ fontFamily: F.u, fontSize: 12 }}
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
