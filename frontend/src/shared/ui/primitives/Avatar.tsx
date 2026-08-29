/**
 * Avatar — design-system/03-PRIMITIVES.md Part M.
 * Fallback colours are the verified 8-colour set (design-system/06-DOMAIN.md
 * Part G.3 — Phase 1 ramps at -800, all >=7:1 against white initials),
 * deterministic from a hash of the name — replacing the arbitrary
 * hand-picked set in the current app (bg: "#9B6B8A", "#5A3E6B", "#2D6B6B",
 * "#4A6B4A", …). Previously only 6 colours with neutral-800 standing in for
 * teal-800; now the full 8, sourced from `shared/ui/domain/avatarColor`.
 */
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../utils";
import { avatarColorFor } from "../domain/avatarColor";
import { toInitials } from "@/shared/lib/initials";

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, "2xl": 96 } as const;
export type AvatarSize = keyof typeof SIZE_PX;

const initialsOf = (name: string) => toInitials(name);

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
  const color = avatarColorFor(name);

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
      {/* AvatarGroupProps only carries name/src, and duplicate names are
          possible (e.g. two people with the same display name), so the
          index is combined with the name to keep the key stable per-slot. */}
      {visible.map((a, i) => (
        // eslint-disable-next-line react/no-array-index-key -- AvatarGroupProps only carries name/src, and duplicate names are possible, so index is combined with name to keep the key stable per-slot.
        <div key={`${a.name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -px * 0.2 }}>
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
