import React from "react";
import { motion } from "motion/react";
import { Save as FloppyDisk, CheckCircle2 as CheckCircle, CircleDot } from "lucide-react";
import { T, F } from "./constants";
import { Button } from "../../../../shared/ui/primitives";

interface BatchActionBarProps {
  onSaveDraft: () => void;
  onFinalize: () => void;
  isSaving: boolean;
  isFinalizing: boolean;
  canFinalize: boolean;
  /** Unsaved edits exist — drives the "Unsaved changes" chip and the accent border. */
  isDirty: boolean;
  savedMsg: string | null;
  saveError: string | null;
  /** `sticky` renders the compact bar pinned above the table; `footer` is the full-size one below it. */
  variant: "sticky" | "footer";
}

/**
 * Save / Finalize controls. Rendered twice — once pinned above the saree table
 * (so a long batch never has to be scrolled to the bottom just to save) and
 * once at the end of the page, where the old single copy lived.
 */
export function BatchActionBar({
  onSaveDraft, onFinalize, isSaving, isFinalizing, canFinalize,
  isDirty, savedMsg, saveError, variant,
}: BatchActionBarProps) {
  const sticky = variant === "sticky";

  return (
    <div
      style={sticky ? {
        position: "sticky",
        // Clears the app's fixed top navigation so the bar parks just beneath it.
        top: 8,
        zIndex: 30,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        background: "rgba(255,253,249,0.94)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${isDirty ? "rgba(183,121,31,0.42)" : T.borderDef}`,
        boxShadow: "0 6px 18px rgba(61,14,26,0.08)",
        borderRadius: 12,
        padding: "10px 14px",
        marginBottom: 16,
      } : {
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}
    >
      {sticky && (
        <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown, marginRight: 2 }}>
          {isDirty ? "You have unsaved changes" : "All changes saved"}
        </span>
      )}
      {sticky && isDirty && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: T.amber, background: "rgba(183,121,31,0.10)", border: "1px solid rgba(183,121,31,0.28)", borderRadius: 999, padding: "3px 9px" }}>
          <CircleDot size={11} /> Unsaved
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginLeft: sticky ? "auto" : undefined }}>
        <Button onClick={onSaveDraft} disabled={isSaving || isFinalizing} variant="secondary" size={sticky ? "sm" : "lg"}>
          <FloppyDisk size={sticky ? 15 : 17} /> {isSaving ? "Saving…" : "Save Changes"}
        </Button>
        <Button onClick={onFinalize} disabled={!canFinalize || isSaving || isFinalizing} variant="primary" size={sticky ? "sm" : "lg"}>
          <CheckCircle size={sticky ? 15 : 17} /> {isFinalizing || isSaving ? "Finalizing…" : "Finalize Batch"}
        </Button>
      </div>

      {savedMsg && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>
          ✓ {savedMsg}
        </motion.div>
      )}
      {saveError && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          style={{ fontFamily: F.ui, fontSize: 13, color: T.red, fontWeight: 600 }}>
          {saveError}
        </motion.div>
      )}
    </div>
  );
}
