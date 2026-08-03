import React from "react";
import { motion } from "motion/react";
import { C, F } from "./theme";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

export function MobileTabBar({
  TABS, active, setActive,
}: {
  TABS: { id: TabId; label: string; icon: React.ReactNode }[];
  active: TabId;
  setActive: (tab: TabId) => void;
}) {
  return (
    <div style={{
      position: "fixed" as const, bottom: 0, left: 0, width: "100%", height: 66,
      background: C.white, borderTop: `1px solid ${C.bdr}`,
      display: "flex", zIndex: 100, boxShadow: "0 -4px 20px rgba(107,26,42,0.08)",
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            position: "relative" as const,
          }}>
            <div style={{ position: "relative" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 4 }}>
              {isActive && (
                <motion.div layoutId="shop-tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  style={{ position: "absolute" as const, top: -9, left: "50%", marginLeft: -13, width: 26, height: 3, borderRadius: 4, background: C.burg }} />
              )}
              {tab.id === "sale" && (
                <span style={{ position: "absolute" as const, top: -3, right: -7, width: 7, height: 7, background: C.crim, borderRadius: "50%" }} />
              )}
              {React.cloneElement(tab.icon as React.ReactElement<any>, { color: isActive ? C.burg : C.muted })}
              <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.burg : C.muted, transition: "color 0.2s" }}>{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
