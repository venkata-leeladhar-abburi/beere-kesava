/**
 * PageShell — design-system/02-LAYOUT.md Part E.
 * ═══════════════════════════════════════════════════════════════════════════
 * The page-template contract. Every page is exactly this shape; features
 * fill slots, they never invent structure.
 *
 * Replaces the pattern where every page hand-rolls its own hardcoded
 * min-height calculation, its own `background: T.silkCream`,
 * its own gutter, and its own header — three separate PageHeaderAndStats
 * implementations existed before this (customers, materials, reports).
 *
 * Usage:
 *   <PageShell>
 *     <PageShell.Header title="Customers" subtitle="Wholesale and retail" actions={<Button>Add</Button>} />
 *     <PageShell.Stats>{metricCards}</PageShell.Stats>
 *     <PageShell.Toolbar>{search}{filters}</PageShell.Toolbar>
 *     <PageShell.Content>
 *       <PageShell.Section id="wholesale" title="Wholesale">…</PageShell.Section>
 *     </PageShell.Content>
 *   </PageShell>
 */
import React from "react";
import { cn } from "./utils";

// ─────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────

interface PageShellProps extends React.ComponentProps<"div"> {
  /** Density mode — spacing/row-height only, never colour or contrast. */
  density?: "comfortable" | "default" | "compact";
}

function PageShellRoot({ density = "default", className, children, ...props }: PageShellProps) {
  return (
    <div
      data-density={density}
      className={cn("min-h-[var(--shell-content-min-h)] bg-[var(--surface-canvas)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SectionBar — optional, in-page anchor pills. Thin wrapper; the real
// scroll-spy logic already lives in shared/ui/SectionNavigator and is not
// duplicated here.
// ─────────────────────────────────────────────────────────────────────────

function Sectionbar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky z-[var(--z-sticky)] bg-[var(--surface-raised)] border-b border-[var(--border-default)]",
        className
      )}
      style={{ top: "var(--shell-chrome-h)", height: "var(--shell-sectionbar-h)" }}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Header — required. breadcrumb / title+actions / subtitle.
// ─────────────────────────────────────────────────────────────────────────

interface HeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  breadcrumb?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

function Header({ breadcrumb, title, subtitle, actions, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-1 pb-[var(--space-6)] mb-[var(--space-6)]",
        "border-b border-[var(--border-subtle)]",
        className
      )}
      {...props}
    >
      {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <h1
          className="bk-title-lg m-0"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {actions && (
          <div className="flex items-center gap-[var(--space-2)] flex-wrap">{actions}</div>
        )}
      </div>
      {subtitle && (
        <p className="bk-body-md m-0" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Stats — optional, 2-6 metric cards. auto-fit/minmax means it reflows
// without a single media query — this is the pattern that replaces the
// 138 hardcoded "1fr 1fr" grids.
// ─────────────────────────────────────────────────────────────────────────

function Stats({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("bk-layout-stats mb-[var(--space-6)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Toolbar — optional. search / filters / view toggle / export.
// ─────────────────────────────────────────────────────────────────────────

interface ToolbarProps extends React.ComponentProps<"div"> {
  sticky?: boolean;
}

function Toolbar({ sticky, className, children, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-[var(--space-3)] mb-[var(--space-6)] min-h-[48px]",
        sticky && "sticky z-[var(--z-sticky)] bg-[var(--surface-canvas)]",
        className
      )}
      style={sticky ? { top: "var(--shell-chrome-h)" } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Content — required. Sections stack with --gap-section rhythm, capped at
// --container-max and centred above it.
// ─────────────────────────────────────────────────────────────────────────

function Content({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[var(--gap-section)] max-w-[var(--container-max)] mx-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section — a titled block inside Content. `id` is required: it drives
// SectionBar anchors and the global [data-section] scroll-margin rule.
// ─────────────────────────────────────────────────────────────────────────

interface SectionProps extends Omit<React.ComponentProps<"section">, "title"> {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

function Section({ id, title, description, action, className, children, ...props }: SectionProps) {
  return (
    <section id={id} data-section className={cn("flex flex-col gap-[var(--space-4)]", className)} {...props}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-[var(--space-3)]">
          <div>
            {title && (
              <h2 className="bk-title-md m-0" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
            )}
            {description && (
              <p className="bk-body-sm m-0 mt-1" style={{ color: "var(--text-tertiary)" }}>
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────

export const PageShell = Object.assign(PageShellRoot, {
  SectionBar: Sectionbar,
  Header,
  Stats,
  Toolbar,
  Content,
  Section,
});
