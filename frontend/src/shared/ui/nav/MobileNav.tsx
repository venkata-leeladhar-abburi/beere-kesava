/**
 * MobileNav — design-system/05-OVERLAYS.md Part O.6.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fixed bottom nav, 64px, icon+label items, with safe-area-inset-bottom
 * padding — absent everywhere per the design-system audit.
 */
import * as React from "react";
import { cn } from "../utils";

export interface MobileNavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  activeKey: string;
  className?: string;
}

export function MobileNav({ items, activeKey, className }: MobileNavProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn("bk-mobile-nav", className)}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: "var(--z-nav)",
        height: "calc(var(--shell-mobilenav-h) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface-raised)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeKey;
        const Tag = item.href ? "a" : "button";
        return (
          <Tag
            key={item.key}
            {...(item.href ? { href: item.href } : { type: "button" })}
            aria-current={active ? "page" : undefined}
            onClick={item.onClick}
            className="bk-mobile-nav-item"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              textDecoration: "none",
              color: active ? "var(--text-brand)" : "var(--text-tertiary)",
              cursor: "pointer",
            }}
          >
            <Icon size={20} aria-hidden />
            <span className="bk-label-sm" style={{ fontSize: 11 }}>{item.label}</span>
          </Tag>
        );
      })}
    </nav>
  );
}
