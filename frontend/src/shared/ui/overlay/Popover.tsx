/**
 * Popover — design-system/05-OVERLAYS.md Part F.
 * ═══════════════════════════════════════════════════════════════════════════
 * Non-modal, anchored, may contain interactive content (unlike a Tooltip).
 * Radix Popover underneath: opens on click (never hover — hover popovers are
 * unreachable on touch), gives `aria-expanded`/`aria-controls` on the trigger,
 * Escape-to-close with focus return, click-outside-close, and auto-flip/shift
 * collision handling for free.
 *
 * Usage:
 *   <Popover>
 *     <Popover.Trigger asChild>...</Popover.Trigger>
 *     <Popover.Content align="start" side="bottom">...</Popover.Content>
 *   </Popover>
 */
import * as React from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { cn } from "../utils";

export type PopoverProps = React.ComponentProps<typeof RadixPopover.Root>;

function Root({ children, modal = false, ...props }: PopoverProps) {
  return <RadixPopover.Root modal={modal} {...props}>{children}</RadixPopover.Root>;
}

const Trigger = RadixPopover.Trigger;
const Anchor = RadixPopover.Anchor;
const Close = RadixPopover.Close;

export interface PopoverContentProps extends React.ComponentProps<typeof RadixPopover.Content> {
  /** Show the 8px anchor arrow (Part F). */
  withArrow?: boolean;
  /** Use --z-popover (600) instead of the default --z-dropdown (300) — for
   *  popovers opened from inside a Modal, so they stack above it (Part F). */
  elevated?: boolean;
}

function Content({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 8,
  collisionPadding = 8,
  withArrow = false,
  elevated = false,
  children,
  style,
  ...props
}: PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        onOpenAutoFocus={e => {
          // Never autofocus into the popover on mobile (Part C.3 parity with Modal).
          if (window.innerWidth < 768) e.preventDefault();
        }}
        className={cn(
          "max-w-[320px] p-[var(--space-4)] outline-none",
          "rounded-[var(--radius-lg)]",
          "bg-[var(--surface-overlay)] border border-[var(--border-default)] shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          className
        )}
        style={{ zIndex: elevated ? "var(--z-popover)" : "var(--z-dropdown)", ...style }}
        {...props}
      >
        {children}
        {withArrow && (
          <RadixPopover.Arrow width={12} height={6} className="fill-[var(--surface-overlay)]" />
        )}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}

export const Popover = Object.assign(Root, { Trigger, Anchor, Close, Content });
