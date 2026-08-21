/**
 * MobileFormActionBar — Phase R5 (design-system/09-RESPONSIVE.md).
 * ═══════════════════════════════════════════════════════════════════════════
 * For full-page (non-modal) forms whose Save/Cancel buttons sit in-flow at
 * the end of the form and are only reachable by scrolling a long page.
 * Modals don't need this — Modal.Footer is already flex-shrink:0 inside a
 * flex-column dialog, so its action buttons are inherently pinned.
 *
 * Mobile-only (<768px): renders a fixed bottom bar with the same actions.
 * At md and above, renders nothing — desktop/tablet keep the original
 * in-flow buttons unchanged, per §0's "desktop stays pixel-identical" rule.
 *
 * Usage: render the page's real action buttons as normal (unchanged), and
 * additionally mount this bar once near the end of the same component:
 *
 *   <MobileFormActionBar
 *     primary={{ label: "Create User Account", onClick: handleSubmit, disabled: !canSubmit }}
 *     secondary={{ label: "Cancel", onClick: handleCancel }}
 *   />
 *
 * The caller is responsible for adding bottom padding to its own scroll
 * container (e.g. `paddingBottom: 84` on mobile) so this bar doesn't cover
 * the last field — see IS_MOBILE_BOTTOM_PAD below for the value to use.
 */
import type { LucideIcon } from "lucide-react";
import { useIsMobile } from "../../hooks/useResponsive";
import { Button } from "./primitives";

/** Reserve this much bottom padding on mobile when this bar is mounted. */
export const MOBILE_FORM_ACTION_BAR_HEIGHT = 76;

export interface MobileFormActionBarAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
}

export function MobileFormActionBar({
  primary,
  secondary,
}: {
  primary: MobileFormActionBarAction;
  secondary?: MobileFormActionBarAction;
}) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-sticky)",
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "var(--surface-overlay, #FFFFFF)",
        borderTop: "1px solid var(--border-default, rgba(0,0,0,0.08))",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {secondary && (
        <Button variant="secondary" size="md" onClick={secondary.onClick} disabled={secondary.disabled} iconLeft={secondary.icon} className="w-full justify-center">
          {secondary.label}
        </Button>
      )}
      <Button variant="primary" size="md" onClick={primary.onClick} disabled={primary.disabled} iconLeft={primary.icon} className="w-full justify-center">
        {primary.label}
      </Button>
    </div>
  );
}
