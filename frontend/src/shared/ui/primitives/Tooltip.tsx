/**
 * Tooltip — design-system/03-PRIMITIVES.md Part N.
 * Never the only source of information (not available on touch), never
 * contains interactive content (use a Popover for that — Phase 5).
 * Dismissible with Escape (WCAG 1.4.13).
 */
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../utils";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/** The 95% case: one trigger, one text tooltip. */
export function Tooltip({ content, children, side = "top", delayDuration = 500 }: SimpleTooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[var(--z-tooltip)] max-w-[240px] rounded-[var(--radius-sm)] px-2.5 py-1.5",
            "bg-[var(--surface-inverse)] text-[var(--text-on-inverse)] text-[12px] shadow-[var(--shadow-lg)]",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:slide-in-from-bottom-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--surface-inverse)]" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
