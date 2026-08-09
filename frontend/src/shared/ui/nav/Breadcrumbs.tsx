/**
 * Breadcrumbs — design-system/05-OVERLAYS.md Part O.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * <nav aria-label="Breadcrumb"><ol>, body-sm links, current page gets
 * aria-current="page". Beyond 4 levels, collapses to
 * `Home › … › Parent › Current` with the "…" opening a Popover of the
 * skipped levels. On mobile, only "‹ Parent" is shown.
 */
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../overlay";

export interface BreadcrumbItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

function Crumb({ item, current }: { item: BreadcrumbItem; current: boolean }) {
  const content = item.label;
  if (current) {
    return (
      <span aria-current="page" className="bk-body-sm" style={{ color: "var(--text-primary)" }}>
        {content}
      </span>
    );
  }
  const shared = "bk-body-sm";
  const style: React.CSSProperties = { color: "var(--text-secondary)", textDecoration: "none", cursor: "pointer" };
  if (item.href) {
    return (
      <a href={item.href} onClick={item.onClick} className={shared} style={style}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={item.onClick} className={shared} style={{ ...style, background: "none", border: "none", padding: 0 }}>
      {content}
    </button>
  );
}

const Separator = () => <ChevronRight size={14} aria-hidden style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />;

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const last = items[items.length - 1];
  const parent = items.length > 1 ? items[items.length - 2] : undefined;

  // Mobile: only "‹ Parent" (falls back to nothing if there's no parent level).
  const mobile = parent ? (
    <nav aria-label="Breadcrumb" className={cn("bk-breadcrumbs-mobile", className)} style={{ display: "none" }}>
      <a
        href={parent.href}
        onClick={parent.onClick}
        className="bk-body-sm"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", textDecoration: "none" }}
      >
        <ChevronRight size={14} aria-hidden style={{ transform: "rotate(180deg)" }} />
        {parent.label}
      </a>
    </nav>
  ) : null;

  const collapse = items.length > 4;
  const visible = collapse ? [items[0], ...items.slice(-2)] : items;
  const hidden = collapse ? items.slice(1, -2) : [];

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("bk-breadcrumbs-desktop", className)}>
        <ol style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", listStyle: "none", margin: 0, padding: 0, flexWrap: "wrap" }}>
          {visible.map((item, i) => {
            const isFirst = i === 0;
            const isLast = item.key === last.key;
            return (
              <React.Fragment key={item.key}>
                {!isFirst && <li style={{ display: "flex" }}><Separator /></li>}
                {collapse && isFirst && hidden.length > 0 && (
                  <>
                    <li style={{ display: "flex" }}>
                      <Crumb item={item} current={false} />
                    </li>
                    <li style={{ display: "flex" }}><Separator /></li>
                    <li style={{ display: "flex" }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Show ${hidden.length} more breadcrumb levels`}
                            className="bk-body-sm"
                            style={{ background: "none", border: "none", padding: 0, color: "var(--text-secondary)", cursor: "pointer" }}
                          >
                            …
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {hidden.map((h) => (
                            <DropdownMenuItem key={h.key} onClick={h.onClick}>
                              {h.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  </>
                )}
                {!(collapse && isFirst && hidden.length > 0) && (
                  <li style={{ display: "flex" }}>
                    <Crumb item={item} current={isLast} />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
      {mobile}
      <style>{`
        @media (max-width: 767px) {
          .bk-breadcrumbs-desktop { display: none; }
          .bk-breadcrumbs-mobile { display: block !important; }
        }
      `}</style>
    </>
  );
}
