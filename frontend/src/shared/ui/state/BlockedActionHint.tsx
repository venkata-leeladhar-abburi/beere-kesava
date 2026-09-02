import { AlertCircle } from "lucide-react";

import { brand, fonts, semantic } from "@/design-system/tokens";

// ─── Why the primary button is disabled ──────────────────────────────────────
// Multi-step modals gate Continue / Dispatch / Save behind a composite
// condition, and a disabled button explains nothing. Worse, the fields that
// satisfy it often sit below the fold, so the admin sees a button that simply
// does not respond and reports it as broken rather than as an unfinished form.
//
// Render this next to the action with the list of what's still outstanding,
// phrased as things to do ("select the billing firm"), not as errors.
export interface BlockedActionHintProps {
  /** Outstanding requirements, lower-case imperative. Renders nothing when empty. */
  blockers: string[];
  /**
   * Appended when the blocking fields are scrolled out of view — say where
   * they are ("scroll down to the invoice details").
   */
  hint?: string;
  className?: string;
}

export function BlockedActionHint({ blockers, hint, className }: BlockedActionHintProps) {
  if (blockers.length === 0) return null;

  return (
    <div
      // Announced when it changes, so the reason reaches a screen reader too —
      // `disabled` alone tells them nothing about what to fix.
      role="status"
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 7,
        marginBottom: 12,
        fontFamily: fonts.ui,
        fontSize: 12.5,
        lineHeight: 1.5,
        color: semantic.text.tertiary,
      }}
    >
      <AlertCircle size={14} color={brand.gold[500]} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        To continue, {blockers.join(", ")}{hint ? ` — ${hint}` : "."}
      </span>
    </div>
  );
}
