/**
 * Topbar — design-system/05-OVERLAYS.md Part O.1.
 * ═══════════════════════════════════════════════════════════════════════════
 * Sticky top chrome: 72px (56px mobile), z-nav, brand surface. Composed from
 * slots (brand / search / actions) so a consumer can drop in its own logo,
 * "+ New" DropdownMenu, notification bell, and avatar menu without this
 * component knowing anything about them.
 *
 * `background`/`className`/`style` are intentionally overridable: some
 * existing dashboards carry a bespoke brand color that predates the token
 * system (not equal to --surface-brand). Passing an override here lets a
 * consumer adopt the sticky/geometry/landmark behavior of Topbar without a
 * visible color regression. Omit them to get the spec default.
 */
import * as React from "react";
import { cn } from "../utils";

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Logo + wordmark (or any leading brand slot). */
  brand?: React.ReactNode;
  /** Static "Search ⌘K" trigger — do not wire to a real command palette here. */
  search?: React.ReactNode;
  /** "+ New" dropdown, notification bell, avatar menu, etc. Rendered right-aligned. */
  actions?: React.ReactNode;
  /** Optional leading control, e.g. a mobile hamburger / back button. */
  leading?: React.ReactNode;
  /** Override the spec's --surface-brand background (see file header). */
  background?: string;
}

export const Topbar = React.forwardRef<HTMLElement, TopbarProps>(function Topbar(
  { brand, search, actions, leading, background, className, style, children, ...props },
  ref
) {
  return (
    <header
      ref={ref}
      className={cn("bk-topbar", className)}
      style={{
        position: "sticky",
        top: 0,
        zIndex: "var(--z-nav)",
        height: "var(--shell-topbar-h)",
        background: background ?? "var(--surface-brand)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        padding: "0 var(--space-6)",
        ...style,
      }}
      {...props}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0, flexShrink: 0 }}>
        {leading}
        {brand}
      </div>

      {search && (
        <div style={{ flex: "0 1 320px", minWidth: 0, display: "flex", justifyContent: "center" }}>
          {search}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
        {actions}
      </div>

      {children}
    </header>
  );
});

/**
 * Static "Search ⌘K" button matching O.1's visual spec. Not wired to the
 * CommandPalette — a separate effort owns that integration.
 */
export interface TopbarSearchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const TopbarSearchButton = React.forwardRef<HTMLButtonElement, TopbarSearchButtonProps>(
  function TopbarSearchButton({ label = "Search", className, style, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn("bk-topbar-search bk-body-sm", className)}
        style={{
          width: "100%",
          maxWidth: 320,
          height: 36,
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          padding: "0 var(--space-3)",
          borderRadius: "var(--radius-md)",
          border: "1px solid color-mix(in srgb, var(--text-on-brand) 20%, transparent)",
          background: "color-mix(in srgb, var(--text-on-brand) 12%, transparent)",
          color: "color-mix(in srgb, var(--text-on-brand) 70%, transparent)",
          cursor: "pointer",
          ...style,
        }}
        {...props}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
        <span style={{ opacity: 0.8, fontSize: 12 }}>⌘K</span>
      </button>
    );
  }
);
