import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { Button, IconButton } from "./primitives";
import { fonts } from "@/design-system/tokens";

const EASE = [0.22, 1, 0.36, 1] as const;
const F = { display: fonts.display, ui: fonts.ui };

/**
 * Generic themed replacement for window.confirm — used wherever a
 * destructive action (delete, irreversible status change, etc.) needs an
 * explicit confirm step. Render inside an AnimatePresence block at the call
 * site so it animates in/out; this component only renders its contents,
 * mount/unmount is the parent's responsibility.
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
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "absolute", inset: 0, background: "rgba(61,14,26,0.45)", backdropFilter: "blur(4px)" }}
        onClick={loading ? undefined : onCancel}
      />
      <motion.div
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

          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 19, color: "#3D0E1A", marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: "#8B7060", lineHeight: 1.55, marginBottom: error ? 14 : 24 }}>
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
