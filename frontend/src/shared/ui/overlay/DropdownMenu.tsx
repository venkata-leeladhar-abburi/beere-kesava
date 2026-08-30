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

/**
 * Root — defaults to `modal={false}`.
 *
 * Radix's default (`modal`) mounts react-remove-scroll, which locks the page
 * by setting `body[data-scroll-locked] { overflow: hidden !important;
 * position: relative !important }`. In this app the body is the element that
 * carries the page scroll (`html, body { overflow-x: clip }` in
 * styles/tokens.css), so that lock collapses the scroll offset the moment a
 * menu opens: every sticky bar and the menu itself jump upward by scrollY and
 * the menu lands off-screen above the viewport — which reads as "the dropdown
 * disappeared / went behind the page" when opened from a scrolled page.
 * Non-modal menus keep outside-click-to-close, Escape, roving focus and
 * type-ahead, and never touch the body. Pass `modal` explicitly to override.
 */
export function DropdownMenu({ modal = false, ...props }: React.ComponentProps<typeof RadixDropdown.Root>) {
  return <RadixDropdown.Root modal={modal} {...props} />;
}
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
          "min-w-[200px] max-h-[320px] overflow-y-auto overflow-x-hidden",
          "rounded-[10px] p-0 overflow-hidden",
          "bg-white border border-[rgba(110,15,45,0.14)] shadow-[0_10px_30px_rgba(74,6,27,0.12)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out",
          className
        )}
        style={{ zIndex: 99999, ...props.style }}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className, destructive, inset, active, ...props
}: React.ComponentProps<typeof RadixDropdown.Item> & { destructive?: boolean; inset?: boolean; active?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex h-11 items-center gap-2 px-4 text-[14px] font-medium cursor-pointer outline-none focus-visible:!outline-none select-none transition-colors",
        "text-[#3B2314]",
        active
          ? "bg-[#F8EFE0] font-semibold text-[#2C0913]"
          : "bg-white data-[highlighted]:bg-[#F9F0E1]/70 data-[highlighted]:text-[#2C0913]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        destructive
          ? "text-[var(--text-danger)] data-[highlighted]:bg-[var(--surface-danger-subtle)]"
          : "",
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
        "relative flex h-11 items-center gap-2 pl-9 pr-4 text-[14px] font-medium cursor-pointer outline-none focus-visible:!outline-none select-none transition-colors",
        "text-[#3B2314] data-[state=checked]:bg-[#F8EFE0] data-[state=checked]:font-semibold data-[state=checked]:text-[#2C0913]",
        "data-[highlighted]:bg-[#F9F0E1]/70 data-[highlighted]:text-[#2C0913]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
        <RadixDropdown.ItemIndicator><Check className="h-4 w-4 text-[#6E0F2D]" /></RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof RadixDropdown.RadioItem>) {
  return (
    <RadixDropdown.RadioItem
      className={cn(
        "relative flex h-11 items-center gap-2 pl-9 pr-4 text-[14px] font-medium cursor-pointer outline-none focus-visible:!outline-none select-none transition-colors",
        "text-[#3B2314] data-[state=checked]:bg-[#F8EFE0] data-[state=checked]:font-semibold data-[state=checked]:text-[#2C0913]",
        "data-[highlighted]:bg-[#F9F0E1]/70 data-[highlighted]:text-[#2C0913]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
        <RadixDropdown.ItemIndicator><Circle className="h-2 w-2 fill-current text-[#6E0F2D]" /></RadixDropdown.ItemIndicator>
      </span>
      {children}
    </RadixDropdown.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Label>) {
  return (
    <RadixDropdown.Label
      className={cn("px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Separator>) {
  return (
    <RadixDropdown.Separator
      className={cn("my-0.5 h-px bg-[rgba(110,15,45,0.08)]", className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto text-xs text-[var(--text-tertiary)]", className)}
      {...props}
    />
  );
}

export const DropdownMenuSub = RadixDropdown.Sub;

export function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof RadixDropdown.SubTrigger>) {
  return (
    <RadixDropdown.SubTrigger
      className={cn(
        "flex h-11 items-center gap-2 px-4 text-[14px] font-medium cursor-pointer outline-none focus-visible:!outline-none select-none transition-colors",
        "text-[#3B2314] data-[highlighted]:bg-[#F9F0E1]/70 data-[state=open]:bg-[#F8EFE0]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
    </RadixDropdown.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof RadixDropdown.SubContent>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.SubContent
        className={cn(
          "min-w-[200px] rounded-[18px] p-0 overflow-hidden",
          "bg-white border border-[rgba(110,15,45,0.14)] shadow-[0_10px_30px_rgba(74,6,27,0.12)]",
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
