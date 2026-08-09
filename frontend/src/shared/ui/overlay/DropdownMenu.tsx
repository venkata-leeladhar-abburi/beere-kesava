/**
 * DropdownMenu — design-system/05-OVERLAYS.md Part G.
 * ═══════════════════════════════════════════════════════════════════════════
 * Replaces the 129 hand-managed `showProfile`/`openGroup`/`setOpenSaree`-style
 * `useState` + click-outside patterns the audit found — none of which have
 * `aria-expanded`, `aria-controls`, roving focus, type-ahead, or `Escape`.
 * Radix DropdownMenu gives all of that for free, plus opens on click (never
 * hover — the audit's `TopNav` 140ms-hover-timer pattern is unusable on
 * touch and hostile to motor-impaired users).
 */
import * as React from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { ChevronRight, Check, Circle } from "lucide-react";
import { cn } from "../utils";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;
export const DropdownMenuGroup = RadixDropdown.Group;
export const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;

export function DropdownMenuContent({
  className, sideOffset = 8, align = "start", ...props
}: React.ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "min-w-[200px] max-h-[320px] overflow-y-auto",
          "rounded-[var(--radius-lg)] p-1",
          "bg-[var(--surface-overlay)] border border-[var(--border-default)] shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          className
        )}
        style={{ zIndex: "var(--z-dropdown)", ...props.style }}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className, destructive, inset, ...props
}: React.ComponentProps<typeof RadixDropdown.Item> & { destructive?: boolean; inset?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm cursor-pointer outline-none select-none",
        "data-[highlighted]:bg-[var(--bk-neutral-50)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        destructive
          ? "text-[var(--text-danger)] data-[highlighted]:bg-[var(--surface-danger-subtle)]"
          : "text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof RadixDropdown.CheckboxItem>) {
  return (
    <RadixDropdown.CheckboxItem
      className={cn(
        "relative flex h-10 items-center gap-2 rounded-[var(--radius-sm)] pl-8 pr-3 text-sm cursor-pointer outline-none select-none",
        "text-[var(--text-primary)] data-[highlighted]:bg-[var(--bk-neutral-50)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixDropdown.ItemIndicator><Check className="h-4 w-4" /></RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof RadixDropdown.RadioItem>) {
  return (
    <RadixDropdown.RadioItem
      className={cn(
        "relative flex h-10 items-center gap-2 rounded-[var(--radius-sm)] pl-8 pr-3 text-sm cursor-pointer outline-none select-none",
        "text-[var(--text-primary)] data-[highlighted]:bg-[var(--bk-neutral-50)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixDropdown.ItemIndicator><Circle className="h-2 w-2 fill-current" /></RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Label>) {
  return (
    <RadixDropdown.Label
      className={cn("px-3 py-1.5 bk-overline", className)}
      style={{ color: "var(--text-tertiary)" }}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Separator>) {
  return (
    <RadixDropdown.Separator
      className={cn("my-1 h-px", className)}
      style={{ background: "var(--border-subtle)" }}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs", className)}
      style={{ color: "var(--text-tertiary)" }}
      {...props}
    />
  );
}

export const DropdownMenuSub = RadixDropdown.Sub;

export function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof RadixDropdown.SubTrigger>) {
  return (
    <RadixDropdown.SubTrigger
      className={cn(
        "flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm cursor-pointer outline-none select-none",
        "text-[var(--text-primary)] data-[highlighted]:bg-[var(--bk-neutral-50)] data-[state=open]:bg-[var(--bk-neutral-50)]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
    </RadixDropdown.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof RadixDropdown.SubContent>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.SubContent
        className={cn(
          "min-w-[200px] rounded-[var(--radius-lg)] p-1",
          "bg-[var(--surface-overlay)] border border-[var(--border-default)] shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          className
        )}
        style={{ zIndex: "var(--z-dropdown)" }}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}
