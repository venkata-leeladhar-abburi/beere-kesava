/**
 * MobileNav — design-system/05-OVERLAYS.md Part O.6.
 * ═══════════════════════════════════════════════════════════════════════════
 * Fixed bottom nav, 64px, icon+label items, with safe-area-inset-bottom
 * padding — absent everywhere per the design-system audit.
 *
 * Style-override escape hatch (same pattern as Modal/Drawer's className
 * merging): `style` is spread on top of the primitive's own container style,
 * and `activeColor` / `inactiveColor` / `indicatorColor` / `badgeColor` let a
 * migrated call site reproduce its exact prior look without losing the
 * safe-area padding this primitive guarantees.
 */
import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../utils";

export interface MobileNavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  /** Optional badge on the icon — a number renders a small count pill,
   *  `true` renders a plain dot (e.g. "new activity" markers). */
  badge?: number | boolean;
  /** Per-item className override, merged onto the item button/link. */
  className?: string;
  /** Per-item style override, merged onto the item button/link. */
  style?: React.CSSProperties;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  activeKey: string;
  className?: string;
  /** Merged on top of the container's own style — lets a migrated hand-rolled
   *  bar reproduce its exact border/shadow/background. */
  style?: React.CSSProperties;
  /** Active icon/label color. Defaults to var(--text-brand). */
  activeColor?: string;
  /** Inactive icon/label color. Defaults to var(--text-tertiary). */
  inactiveColor?: string;
  /** When set, renders a small animated pill above the active tab's icon
   *  (reproduces hand-rolled "active indicator bar" styling). */
  indicatorColor?: string;
  /** Badge/dot color. Defaults to var(--text-danger) with a hardcoded fallback. */
  badgeColor?: string;
  /** Merged onto every label span's style (e.g. to reproduce a hand-rolled
   *  bar's exact font-family/size). Per-item weight/color still comes from
   *  the item button, since label inherits from it when not set here. */
  labelStyle?: React.CSSProperties;
  /** Base bar height before the safe-area addition. Defaults to the design
   *  system's var(--shell-mobilenav-h) (64px) — override to match a
   *  migrated hand-rolled bar's exact prior height while still keeping
   *  `env(safe-area-inset-bottom)` added on top. */
  baseHeight?: string;
}

export function MobileNav({
  items,
  activeKey,
  className,
  style,
  activeColor = "var(--text-brand)",
  inactiveColor = "var(--text-tertiary)",
  indicatorColor,
  badgeColor = "var(--text-danger, #C0392B)",
  labelStyle,
  baseHeight = "var(--shell-mobilenav-h)",
}: MobileNavProps) {
  const indicatorLayoutId = React.useId();

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
        height: `calc(${baseHeight} + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface-raised)",
        borderTop: "1px solid var(--border-default)",
        ...style,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeKey;
        const Tag = item.href ? "a" : "button";
        const color = active ? activeColor : inactiveColor;
        return (
          <Tag
            key={item.key}
            {...(item.href ? { href: item.href } : { type: "button" })}
            aria-current={active ? "page" : undefined}
            onClick={item.onClick}
            className={cn("bk-mobile-nav-item", item.className)}
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
              color,
              cursor: "pointer",
              position: "relative",
              ...item.style,
            }}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              {active && indicatorColor && (
                <motion.div
                  layoutId={indicatorLayoutId}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  style={{
                    position: "absolute",
                    top: -9,
                    left: "50%",
                    marginLeft: -13,
                    width: 26,
                    height: 3,
                    borderRadius: 4,
                    background: indicatorColor,
                  }}
                />
              )}
              <Icon size={20} color={color} aria-hidden />
              {item.badge === true && (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -7,
                    width: 7,
                    height: 7,
                    background: badgeColor,
                    borderRadius: "50%",
                  }}
                />
              )}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -7,
                    minWidth: 16,
                    height: 16,
                    background: badgeColor,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#FFF",
                    padding: "0 3px",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
            <span className="bk-label-sm" style={{ fontSize: 11, color, ...labelStyle }}>{item.label}</span>
          </Tag>
        );
      })}
    </nav>
  );
}
