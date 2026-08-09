/**
 * Drawer — design-system/05-OVERLAYS.md Part D.
 * ═══════════════════════════════════════════════════════════════════════════
 * Radix Dialog underneath (same foundation as Modal), styled to slide in
 * from a screen edge instead of appearing centered. Fills the documented
 * gap: a slide-in-from-edge overlay for side panels / mobile bottom sheets,
 * as opposed to Modal's centered dialog.
 */
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils";
import { IconButton } from "../primitives/IconButton";

export type DrawerSide = "left" | "right" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "full";

// Width (left/right) or height (bottom), as a fraction-of-viewport step —
// mirrors Modal's xs–full size bucketing but expressed for an edge panel.
const SIDE_SIZE: Record<Exclude<DrawerSide, "bottom">, Record<DrawerSize, string>> = {
  left: { sm: "320px", md: "420px", lg: "560px", full: "100vw" },
  right: { sm: "320px", md: "420px", lg: "560px", full: "100vw" },
};

const BOTTOM_SIZE: Record<DrawerSize, string> = {
  sm: "40vh",
  md: "60vh",
  lg: "80vh",
  full: "100dvh",
};

const SIDE_POSITION_CLASS: Record<DrawerSide, string> = {
  left: "left-0 top-0 bottom-0",
  right: "right-0 top-0 bottom-0",
  bottom: "left-0 right-0 bottom-0",
};

const SIDE_ANIMATE_CLASS: Record<DrawerSide, string> = {
  left: cn(
    "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
  ),
  right: cn(
    "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
  ),
  bottom: cn(
    "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
  ),
};

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: DrawerSide;
  size?: DrawerSize;
  children: React.ReactNode;
  /** Guards click-outside / Escape on a dirty form (Part D.4) — return true
   *  to allow the close, false to block it. */
  onBeforeClose?: () => boolean;
}

export function Drawer({ open, onOpenChange, side = "right", size = "md", children, onBeforeClose }: DrawerProps) {
  const guardedChange = (next: boolean) => {
    if (!next && onBeforeClose && !onBeforeClose()) return;
    onOpenChange(next);
  };

  const dimensionStyle: React.CSSProperties =
    side === "bottom"
      ? { height: BOTTOM_SIZE[size], maxHeight: "calc(100dvh - 48px)", width: "100%" }
      : { width: SIDE_SIZE[side][size], maxWidth: "92vw", height: "100%" };

  return (
    <Dialog.Root open={open} onOpenChange={guardedChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 bg-[var(--surface-scrim)] backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=open]:fade-in",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out"
          )}
          style={{ zIndex: "var(--z-overlay)" }}
        />
        <Dialog.Content
          onOpenAutoFocus={e => {
            // Never autofocus a text input on mobile — it opens the keyboard
            // and hides the drawer (Part C.3).
            if (window.innerWidth < 768) e.preventDefault();
          }}
          className={cn(
            "fixed flex flex-col",
            "bg-[var(--surface-overlay)] shadow-[var(--shadow-xl)]",
            side === "left" && "rounded-r-[var(--radius-xl)]",
            side === "right" && "rounded-l-[var(--radius-xl)]",
            side === "bottom" && "rounded-t-[var(--radius-xl)] max-md:rounded-b-none",
            "data-[state=open]:animate-in data-[state=open]:duration-300",
            "data-[state=closed]:animate-out data-[state=closed]:duration-200",
            SIDE_POSITION_CLASS[side],
            SIDE_ANIMATE_CLASS[side]
          )}
          style={{ ...dimensionStyle, zIndex: "var(--z-modal)" }}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Header({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 flex-shrink-0">
      <div className="min-w-0">
        <Dialog.Title className="bk-title-md" style={{ color: "var(--text-primary)" }}>{title}</Dialog.Title>
        {subtitle && (
          <Dialog.Description className="mt-1 bk-body-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </Dialog.Description>
        )}
      </div>
      <Dialog.Close asChild>
        <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />
      </Dialog.Close>
    </div>
  );
}

function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = React.useState({ top: false, bottom: false });

  const onScroll = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setScrolled({
      top: el.scrollTop > 0,
      bottom: el.scrollHeight - el.scrollTop > el.clientHeight + 1,
    });
  }, []);

  React.useEffect(() => { onScroll(); }, [onScroll, children]);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn("flex-1 overflow-y-auto px-6 [overscroll-behavior:contain]", className)}
      style={{
        boxShadow: [
          scrolled.top ? "inset 0 8px 8px -8px rgba(0,0,0,0.12)" : "",
          scrolled.bottom ? "inset 0 -8px 8px -8px rgba(0,0,0,0.12)" : "",
        ].filter(Boolean).join(", ") || "none",
      }}
    >
      {children}
    </div>
  );
}

function Footer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 px-6 pt-4 pb-6 flex-shrink-0 border-t", className)}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {children}
    </div>
  );
}

Drawer.Header = Header;
Drawer.Body = Body;
Drawer.Footer = Footer;
