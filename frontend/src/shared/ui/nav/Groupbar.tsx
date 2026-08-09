/**
 * Groupbar — design-system/05-OVERLAYS.md Part O.2.
 * ═══════════════════════════════════════════════════════════════════════════
 * Sticky primary nav row: horizontal group items with a 2px active
 * indicator and aria-current="page". Groups with more than one page open a
 * DropdownMenu **on click** — replacing any mouseenter + timer hover-menu
 * pattern (the audit's TopNav 140ms hover-timer is unusable on touch and
 * hostile to motor-impaired users; see shared/ui/overlay/DropdownMenu.tsx).
 *
 * Colors/height default to the Phase 2 tokens but can be overridden via
 * `className`/`style`/`itemColor`/`activeItemColor` so a consumer with a
 * bespoke pre-existing brand palette can adopt the click-vs-hover behavior
 * without a visible color regression.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../overlay";

export interface GroupbarPage {
  key: string;
  label: string;
}

export interface GroupbarGroup {
  key: string;
  label: string;
  icon?: React.ElementType;
  pages: GroupbarPage[];
}

export interface GroupbarProps extends React.HTMLAttributes<HTMLElement> {
  groups: GroupbarGroup[];
  /** Key of the currently active page (used to derive the active group + aria-current). */
  activePageKey: string;
  /** Called with a page key when a group (single-page) or a dropdown item is chosen. */
  onSelectPage: (pageKey: string) => void;
  /** Resolve which group key is active for a given page key. Defaults to a direct `pages` lookup. */
  isGroupActive?: (group: GroupbarGroup) => boolean;
  itemColor?: string;
  activeItemColor?: string;
  indicatorColor?: string;
  background?: string;
}

export const Groupbar = React.forwardRef<HTMLElement, GroupbarProps>(function Groupbar(
  {
    groups,
    activePageKey,
    onSelectPage,
    isGroupActive,
    itemColor,
    activeItemColor,
    indicatorColor,
    background,
    className,
    style,
    ...props
  },
  ref
) {
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  const defaultIsActive = (g: GroupbarGroup) => g.pages.some((p) => p.key === activePageKey);

  return (
    <nav
      ref={ref}
      aria-label="Primary"
      className={cn("bk-groupbar", className)}
      style={{
        position: "sticky",
        top: "var(--shell-topbar-h)",
        zIndex: "var(--z-sticky)",
        height: "var(--shell-groupbar-h)",
        background: background ?? "var(--surface-raised)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "stretch",
        gap: "var(--space-1)",
        padding: "0 var(--space-4)",
        overflowX: "auto",
        ...style,
      }}
      {...props}
    >
      {groups.map((g) => {
        const active = (isGroupActive ?? defaultIsActive)(g);
        const hasDropdown = g.pages.length > 1;
        const Icon = g.icon;
        const isOpen = openGroup === g.key;

        const itemButton = (
          <button
            type="button"
            aria-current={active ? "page" : undefined}
            aria-haspopup={hasDropdown ? "menu" : undefined}
            aria-expanded={hasDropdown ? isOpen : undefined}
            onClick={() => {
              if (hasDropdown) {
                setOpenGroup((prev) => (prev === g.key ? null : g.key));
              } else {
                onSelectPage(g.pages[0].key);
              }
            }}
            className="bk-groupbar-item bk-label-lg"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "0 var(--space-4)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: active ? activeItemColor ?? "var(--text-brand)" : itemColor ?? "var(--text-secondary)",
              fontWeight: active ? 600 : 500,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {Icon && <Icon size={15} aria-hidden />}
              {g.label}
              {hasDropdown && (
                <ChevronDown
                  size={12}
                  aria-hidden
                  style={{ transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform var(--duration-fast, 150ms)" }}
                />
              )}
            </span>
            <span
              style={{
                display: "block",
                height: 2,
                width: "100%",
                background: active ? indicatorColor ?? "var(--surface-brand)" : "transparent",
              }}
            />
          </button>
        );

        if (!hasDropdown) {
          return <React.Fragment key={g.key}>{itemButton}</React.Fragment>;
        }

        return (
          <DropdownMenu
            key={g.key}
            open={isOpen}
            onOpenChange={(o) => setOpenGroup(o ? g.key : null)}
          >
            <DropdownMenuTrigger asChild>{itemButton}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={2}>
              {g.pages.map((p) => (
                <DropdownMenuItem
                  key={p.key}
                  aria-current={activePageKey === p.key ? "page" : undefined}
                  onClick={() => {
                    onSelectPage(p.key);
                    setOpenGroup(null);
                  }}
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
});
