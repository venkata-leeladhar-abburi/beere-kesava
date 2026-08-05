/**
 * Icon — design-system/03-PRIMITIVES.md Part E.
 * ═══════════════════════════════════════════════════════════════════════════
 * Thin wrapper around a Lucide icon component enforcing the 5-size scale,
 * stroke-width rule, and default aria-hidden. Prefer <Icon name="add" /> so
 * every icon in the app resolves through the semantic registry in icons.ts;
 * <Icon icon={SomeLucideIcon} /> is the escape hatch for the rare
 * icon that doesn't have (and doesn't deserve) a semantic name yet.
 */
import React from "react";
import { Icons, ICON_SIZE, type IconName, type IconSize, type LucideIcon } from "./icons";

interface IconPropsBase {
  size?: IconSize;
  className?: string;
  /** Decorative (default): aria-hidden, no accessible name. Set false only
   *  when this icon is NOT paired with visible text and needs its own name
   *  — pass `aria-label` in that case. Prefer <IconButton> instead. */
  decorative?: boolean;
  "aria-label"?: string;
}

type IconProps =
  | (IconPropsBase & { name: IconName; icon?: never })
  | (IconPropsBase & { icon: LucideIcon; name?: never });

export function Icon({ name, icon, size = "md", className, decorative = true, ...rest }: IconProps) {
  const Component = name ? Icons[name] : icon!;
  const px = ICON_SIZE[size];
  const strokeWidth = size === "xs" || size === "sm" ? 1.5 : 2;

  return (
    <Component
      size={px}
      strokeWidth={strokeWidth}
      color="currentColor"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      {...rest}
    />
  );
}
