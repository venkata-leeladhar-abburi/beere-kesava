/**
 * Avatar — design-system/03-PRIMITIVES.md Part M.
 * Fallback colours are the verified 8-colour set (Phase 1 ramps at -800,
 * all >=7:1 against white initials), deterministic from a hash of the
 * name — replacing the arbitrary hand-picked set in the current app
 * (bg: "#9B6B8A", "#5A3E6B", "#2D6B6B", "#4A6B4A", …).
 */
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../utils";

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, "2xl": 96 } as const;
export type AvatarSize = keyof typeof SIZE_PX;

const FALLBACK_COLORS = [
  "var(--bk-burgundy-800)",
  "var(--bk-blue-800)",
  "var(--bk-neutral-800)", // stands in for teal-800 until that ramp token exists
  "var(--bk-amber-800)",
  "var(--bk-green-800)",
  "var(--bk-red-800)",
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return Math.abs(hash);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  src?: string;
  name: string;
  size?: AvatarSize;
  /** Bottom-right presence indicator. */
  status?: "online" | "offline" | "busy";
}

const STATUS_COLOR: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "var(--text-success)",
  offline: "var(--bk-neutral-400)",
  busy: "var(--text-danger)",
};

export function Avatar({ src, name, size = "md", status, className, ...props }: AvatarProps) {
  const px = SIZE_PX[size];
  const color = FALLBACK_COLORS[hashName(name) % FALLBACK_COLORS.length];

  return (
    <AvatarPrimitive.Root
      className={cn("relative inline-flex shrink-0 rounded-[var(--radius-full)] overflow-hidden", className)}
      style={{ width: px, height: px }}
      {...props}
    >
      <AvatarPrimitive.Image src={src} alt="" className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-semibold text-white select-none"
        style={{ background: color, fontSize: px * 0.4 }}
      >
        {initialsOf(name)}
      </AvatarPrimitive.Fallback>
      {status && (
        <span
          aria-hidden="true"
          className="absolute rounded-full border-2"
          style={{
            width: px * 0.28,
            height: px * 0.28,
            right: 0,
            bottom: 0,
            background: STATUS_COLOR[status],
            borderColor: "var(--surface-raised)",
          }}
        />
      )}
    </AvatarPrimitive.Root>
  );
}

export interface AvatarGroupProps {
  avatars: { name: string; src?: string }[];
  size?: AvatarSize;
  max?: number;
}

export function AvatarGroup({ avatars, size = "md", max = 4 }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;
  const px = SIZE_PX[size];

  return (
    <div className="flex items-center" role="group" aria-label={`${avatars.length} people`}>
      {visible.map((a, i) => (
        <div key={a.name + i} style={{ marginLeft: i === 0 ? 0 : -px * 0.2 }}>
          <Avatar name={a.name} src={a.src} size={size} className="ring-2 ring-[var(--surface-raised)]" />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{ marginLeft: -px * 0.2, width: px, height: px }}
          className="flex items-center justify-center rounded-[var(--radius-full)] ring-2 ring-[var(--surface-raised)] bg-[var(--bk-neutral-200)] text-[var(--text-secondary)] text-[12px] font-semibold"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
