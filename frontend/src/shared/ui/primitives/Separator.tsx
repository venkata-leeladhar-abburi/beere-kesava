/**
 * Separator — design-system/03-PRIMITIVES.md Part O.
 * Prefer spacing over rules (Law of Proximity) — reach for this only when
 * space alone is ambiguous. Decorative by default (role="none"); a divider
 * is not a landmark.
 */
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../utils";

export interface SeparatorProps extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  label?: React.ReactNode;
}

export function Separator({ orientation = "horizontal", label, className, ...props }: SeparatorProps) {
  if (label && orientation === "horizontal") {
    return (
      <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
        <SeparatorPrimitive.Root className="h-px flex-1 bg-[var(--border-subtle)]" decorative />
        <span className="bk-caption shrink-0" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </span>
        <SeparatorPrimitive.Root className="h-px flex-1 bg-[var(--border-subtle)]" decorative />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        "bg-[var(--border-subtle)]",
        className
      )}
      {...props}
    />
  );
}
