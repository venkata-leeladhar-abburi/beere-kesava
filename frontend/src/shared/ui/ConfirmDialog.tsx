import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { Button, IconButton } from "./primitives";
import { fonts } from "@/design-system/tokens";

const EASE = [0.22, 1, 0.36, 1] as const;
const F = { display: fonts.display, ui: fonts.ui };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Generic themed replacement for window.confirm — used wherever a
 * destructive action (delete, irreversible status change, etc.) needs an
 * explicit confirm step. Render inside an AnimatePresence block at the call
 * site so it animates in/out; this component only renders its contents,
 * mount/unmount is the parent's responsibility.
 *
 * Not built on the shared Radix-backed <Modal> (its open/onOpenChange +
 * forceMount lifecycle doesn't line up cleanly with AnimatePresence-driven
 * mount/unmount at call sites), so Escape-to-close and focus trapping are
 * handled directly here instead.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // Read through refs inside the listener instead of depending on `loading`/
  // `onCancel` directly — those are a fresh boolean/inline-arrow on nearly
  // every call site, so depending on them would tear the listener down and
  // rebuild it (and re-run the "capture + set initial focus" logic) on every
  // parent re-render, snapping focus back to the first item mid-interaction.
  const loadingRef = React.useRef(loading);
  loadingRef.current = loading;
  const onCancelRef = React.useRef(onCancel);
  onCancelRef.current = onCancel;

  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialogRef.current)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!loadingRef.current) onCancelRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        // Every control is disabled (e.g. mid-delete) — hold focus inside
        // the dialog instead of letting Tab escape to the page behind it.
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Only return focus if the trigger is still attached to the document —
      // on genuine unmount the dialog itself may have held focus, in which
      // case `previouslyFocused` still points at a live element outside it.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.45)", backdropFilter: "blur(4px)" }}
        onClick={loading ? undefined : onCancel}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease: EASE }}
        style={{ position: "relative", width: 440, background: "#fff", borderRadius: 20, boxShadow: "0 24px 80px rgba(61,14,26,0.25)", overflow: "hidden" }}
      >
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "flex-end" }}>
          <IconButton label="Close" icon={X} size="sm" variant="ghost" onClick={onCancel} disabled={loading} />
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <AlertTriangle size={26} color="#C0392B" />
          </div>

          <div id={titleId} style={{ fontFamily: F.display, fontWeight: 700, fontSize: 19, color: "#3D0E1A", marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: "#69635E", lineHeight: 1.55, marginBottom: error ? 14 : 24 }}>
            {message}
          </div>

          {error && (
            <div style={{ width: "100%", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.22)", borderRadius: 10, padding: "10px 14px", fontFamily: F.ui, fontSize: 13, color: "#C0392B", marginBottom: 24, textAlign: "left" as const }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant="danger" fullWidth onClick={onConfirm} disabled={loading}>
              {loading ? "Deleting…" : confirmLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
