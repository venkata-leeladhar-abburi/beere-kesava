/**
 * Sectionbar — design-system/05-OVERLAYS.md Part O.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Spec says: keep `SectionNavigator`'s scroll-spy logic (IntersectionObserver,
 * the RAF-driven smooth scroll, the mobile/desktop sticky-offset math), just
 * restyle to spec geometry. Rather than re-implement that logic — which is
 * exactly the kind of DOM-walking, timing-sensitive code that's unsafe to
 * duplicate without visual verification — this is a thin restyle wrapper
 * around the existing `shared/ui/SectionNavigator`, which already lives at
 * the Phase 2 geometry (48px / --shell-sectionbar-h, see
 * shared/ui/section-navigator-data.ts). It does not modify SectionNavigator
 * itself.
 */
import * as React from "react";
import { SectionNavigator, type SectionNavItem } from "../SectionNavigator";

export interface SectionbarProps {
  sections: SectionNavItem[];
  /** Sticky offset from the top, in px (defaults to 0 — pass the chrome height in px if not inline). */
  stickyTop?: number;
  /** Render inline (no own sticky bar / background) inside a parent bar, e.g. a Groupbar. */
  inline?: boolean;
}

export function Sectionbar({ sections, stickyTop, inline }: SectionbarProps) {
  return (
    <SectionNavigator
      sections={sections}
      inline={inline}
      stickyTop={stickyTop}
      activeColor="var(--surface-brand)"
      mutedColor="var(--text-tertiary)"
      borderColor="var(--border-default)"
      layoutId="bk-sectionbar-active-pill"
    />
  );
}
