/**
 * SkipLink — design-system/02-LAYOUT.md Part N (WCAG 2.4.1 Bypass Blocks).
 * Hidden until focused via keyboard Tab; jumps past the nav chrome straight
 * to `#main-content`. Each portal's root content wrapper carries that id.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-[var(--space-2)] focus:left-[var(--space-2)] focus:z-[var(--z-toast)] focus:rounded-[var(--radius-md)] focus:bg-[var(--surface-brand)] focus:px-[var(--space-4)] focus:py-[var(--space-2)] focus:text-[var(--text-on-brand)] focus:shadow-[var(--shadow-lg)]"
    >
      Skip to main content
    </a>
  );
}
