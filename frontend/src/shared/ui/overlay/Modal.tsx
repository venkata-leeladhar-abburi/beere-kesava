/**
 * Modal — design-system/05-OVERLAYS.md Part D.
 * ═══════════════════════════════════════════════════════════════════════════
 * Radix Dialog underneath, so focus trap, Escape, scroll lock (with
 * scrollbar-width compensation), portal and ARIA all come free and correct —
 * this is the fix for the audit's worst finding: 63 hand-rolled modals, 0
 * with `role="dialog"`, 0 Escape handlers, 0 focus traps.
 */
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils";
import { IconButton } from "../primitives/IconButton";

const SIZE_WIDTH: Record<ModalSize, string> = {
  xs: "400px",
  sm: "480px",
  md: "640px",
  lg: "800px",
  xl: "1000px",
  full: "calc(100vw - 64px)",
};

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: ModalSize;
  children: React.ReactNode;
  /** Guards click-outside / Escape on a dirty form (Part D.4) — return true
   *  to allow the close, false to block it (e.g. to show a "Discard
   *  changes?" confirmation instead). */
  onBeforeClose?: () => boolean;
}

export function Modal({ open, onOpenChange, size = "md", children, onBeforeClose }: ModalProps) {
  const guardedChange = (next: boolean) => {
    if (!next && onBeforeClose && !onBeforeClose()) return;
    onOpenChange(next);
  };

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
            // and hides the dialog (Part C.3).
            if (window.innerWidth < 768) e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "flex flex-col w-[calc(100vw-32px)]",
            "bg-[var(--surface-overlay)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden",
            "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-98",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-98",
            // Mobile: every size becomes a bottom sheet (Part D.1).
            "max-md:left-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:translate-y-0",
            "max-md:w-full max-md:rounded-b-none max-md:max-h-[92dvh]"
          )}
          style={{ maxWidth: SIZE_WIDTH[size], maxHeight: "calc(100dvh - 96px)", zIndex: "var(--z-modal)" }}
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
        {subtitle ? (
          <Dialog.Description className="mt-1 bk-body-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </Dialog.Description>
        ) : (
          // Radix requires a Dialog.Description to wire aria-describedby;
          // without one it logs a console warning on every modal that has
          // no subtitle. Falling back to the title itself (screen-reader-only,
          // no visual change) satisfies that without inventing filler copy.
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
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

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;
