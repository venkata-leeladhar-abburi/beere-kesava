/**
 * CommandPalette — design-system/05-OVERLAYS.md Part H (Command Palette).
 * ═══════════════════════════════════════════════════════════════════════════
 * Global ⌘K / Ctrl+K launcher built on `cmdk` (Command.Dialog), styled to
 * match Modal's tokens/motion (surface-overlay, --radius-lg, --shadow-lg,
 * --z-modal). `Command.Dialog` renders its own Radix-less, but
 * accessible, `role="dialog"` + internal `role="combobox"` / `aria-activedescendant`
 * / `aria-live="polite"` wiring — that's the whole reason to build on cmdk's
 * primitives rather than hand rolling it.
 *
 * SCOPE (see design-system/05-OVERLAYS.md Part H groups: RECENT → ACTIONS →
 * NAVIGATE → entity results):
 *   - NAVIGATE is built for real below, from the app's actual router config
 *     (src/app/App.tsx + the admin tab routing in BeereDashboard.tsx).
 *   - RECENT is built for real below too, off `useRecentlyViewed`
 *     (./useRecentlyViewed.ts) — a `localStorage`-backed tracker that a
 *     handful of detail pages call `recordView()` into on mount. There's no
 *     per-entity route yet, so a RECENT item navigates to the record's list
 *     page, not a deep link to the record itself.
 *   - ACTIONS is built for real below too: a small static "quick actions"
 *     registry (ACTION_ITEMS) covering the handful of "create X" flows whose
 *     target page keeps its create-modal/expand state as a simple boolean
 *     unentangled with other data loading, so a `?new=1` query param read in
 *     that state's `useState` initializer can safely open it on mount. Other
 *     "New X" flows (e.g. nested behind selection state, or requiring data
 *     loaded first) were deliberately left off rather than forced.
 *   - The async entity search (Weavers/Sarees/Batches/Invoices/Customers) is
 *     still deliberately deferred — it needs backend search endpoints that
 *     don't exist yet. TODO(command-palette): add the async entity search
 *     group once that infrastructure lands.
 */
import * as React from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router";
import {
  Search,
  LayoutDashboard,
  Factory,
  Layers,
  Package,
  IndianRupee,
  BarChart3,
  Users,
  UserCircle,
  Truck,
  Warehouse,
  Building2,
  Bell,
  Clock,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { cn } from "../utils";
import { useRecentlyViewed } from "./useRecentlyViewed";

interface NavigateItem {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
  keywords?: string[];
}

// Real, working, static routes — mirrors the admin portal's route map in
// features/dashboards/components/BeereDashboard.tsx (routeMap) and the
// top-level portal routes declared in app/App.tsx. Kept hardcoded per the
// scoping note; not derived from a route registry because one doesn't exist.
const NAVIGATE_ITEMS: NavigateItem[] = [
  { key: "overview",   label: "Overview",   path: "/admin/overview",   icon: LayoutDashboard },
  { key: "production", label: "Production", path: "/admin/production", icon: Factory },
  { key: "batches",    label: "Batches",     path: "/admin/batches",    icon: Layers },
  { key: "inventory",  label: "Inventory",  path: "/admin/inventory",  icon: Package, keywords: ["materials", "stock"] },
  { key: "payments",   label: "Payments",   path: "/admin/payments",   icon: IndianRupee, keywords: ["finance"] },
  { key: "reports",    label: "Reports",    path: "/admin/reports",    icon: BarChart3 },
  { key: "weavers",    label: "Weavers",    path: "/admin/weavers",    icon: Users, keywords: ["partners"] },
  { key: "customers",  label: "Customers",  path: "/admin/customers",  icon: UserCircle, keywords: ["partners"] },
  { key: "vendors",    label: "Vendors",    path: "/admin/vendors",    icon: Truck, keywords: ["partners"] },
  { key: "suppliers",  label: "Suppliers",  path: "/admin/suppliers",  icon: Warehouse, keywords: ["partners"] },
  { key: "firms",      label: "Firms",      path: "/admin/firms",      icon: Building2 },
  { key: "notifications", label: "Notifications", path: "/admin/notifications", icon: Bell },
];

interface ActionItem {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
  keywords?: string[];
}

// Quick "create" actions. Each target page reads the `?new=1` query param on
// mount to open its create form immediately (an additive `useState` initializer
// next to the page's existing modal/expand state — see VendorsPage,
// SuppliersPage, FirmsPage, WeaversPage, CustomersPage). Kept to the handful
// of pages where that state is a simple boolean/flag unentangled with other
// data loading, per the scoping note above — not every "New X" flow in the
// app qualifies (e.g. batch creation already opens on its "new" tab by
// default, and several add-forms are nested behind selection state that
// isn't safe to force open from a cold deep link).
const ACTION_ITEMS: ActionItem[] = [
  { key: "new-vendor",   label: "New Vendor",   path: "/admin/vendors?new=1",   icon: PlusCircle, keywords: ["add", "create"] },
  { key: "new-supplier", label: "New Supplier", path: "/admin/suppliers?new=1", icon: PlusCircle, keywords: ["add", "create"] },
  { key: "new-weaver",   label: "New Weaver",   path: "/admin/weavers?new=1",   icon: UserPlus,   keywords: ["add", "create", "register"] },
  { key: "new-firm",     label: "New Firm",     path: "/admin/firms?new=1",     icon: PlusCircle, keywords: ["add", "create"] },
  { key: "new-customer", label: "New Customer", path: "/admin/customers?new=1", icon: UserPlus,   keywords: ["add", "create", "wholesale"] },
];

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const recentItems = useRecentlyViewed();

  const runNavigate = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter
      loop
      className="flex flex-col h-full max-h-[60vh]"
      overlayClassName={cn(
        "fixed inset-0 bg-[var(--surface-scrim)] backdrop-blur-[2px] z-[var(--z-overlay)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out"
      )}
      contentClassName={cn(
        "fixed left-1/2 top-[20vh] -translate-x-1/2 flex flex-col z-[var(--z-modal)]",
        "w-[min(640px,calc(100vw-32px))] max-h-[60vh]",
        "bg-[var(--surface-overlay)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]",
        "border border-[var(--border-default)] overflow-hidden",
        "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-98",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-98"
      )}
    >
      <div
        className="flex items-center gap-2 border-b px-4"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}
        data-slot="command-input-wrapper"
      >
        <Search size={16} className="shrink-0" />
        <Command.Input
          // eslint-disable-next-line jsx-a11y/no-autofocus -- command palette opens as a modal search overlay; the input must be focused immediately for keyboard-driven search
          autoFocus
          placeholder="Search or jump to…"
          className="h-12 flex-1 bg-transparent outline-none border-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]"
        />
      </div>

      <Command.List
        className="flex-1 overflow-y-auto p-2"
        aria-live="polite"
      >
        <Command.Empty
          className="py-8 text-center bk-caption"
          style={{ color: "var(--text-tertiary)" }}
        >
          No results found.
        </Command.Empty>

        {recentItems.length > 0 && (
          <Command.Group
            heading="Recent"
            className={cn(
              "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:bk-caption",
              "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide",
              "[&_[cmdk-group-heading]]:text-[var(--text-tertiary)]"
            )}
          >
            {recentItems.map((item) => (
              <Command.Item
                key={item.key}
                value={[item.label, item.kind ?? ""].join(" ")}
                onSelect={() => runNavigate(item.path)}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-[14px] cursor-pointer select-none outline-none",
                  "text-[var(--text-primary)]",
                  "data-[selected=true]:bg-[var(--bk-neutral-50)]"
                )}
              >
                <Clock size={16} style={{ color: "var(--text-tertiary)" }} />
                {item.label}
                {item.kind && (
                  <span className="ml-auto bk-caption" style={{ color: "var(--text-tertiary)" }}>
                    {item.kind}
                  </span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group
          heading="Actions"
          className={cn(
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:bk-caption",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide",
            "[&_[cmdk-group-heading]]:text-[var(--text-tertiary)]"
          )}
        >
          {ACTION_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Command.Item
                key={item.key}
                value={[item.label, ...(item.keywords ?? [])].join(" ")}
                onSelect={() => runNavigate(item.path)}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-[14px] cursor-pointer select-none outline-none",
                  "text-[var(--text-primary)]",
                  "data-[selected=true]:bg-[var(--bk-neutral-50)]"
                )}
              >
                <ItemIcon size={16} style={{ color: "var(--text-tertiary)" }} />
                {item.label}
              </Command.Item>
            );
          })}
        </Command.Group>

        <Command.Group
          heading="Navigate"
          className={cn(
            "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:bk-caption",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide",
            "[&_[cmdk-group-heading]]:text-[var(--text-tertiary)]"
          )}
        >
          {NAVIGATE_ITEMS.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Command.Item
                key={item.key}
                value={[item.label, ...(item.keywords ?? [])].join(" ")}
                onSelect={() => runNavigate(item.path)}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-[14px] cursor-pointer select-none outline-none",
                  "text-[var(--text-primary)]",
                  "data-[selected=true]:bg-[var(--bk-neutral-50)]"
                )}
              >
                <ItemIcon size={16} style={{ color: "var(--text-tertiary)" }} />
                {item.label}
              </Command.Item>
            );
          })}
        </Command.Group>

        {/* TODO(command-palette): entity results group (Weavers/Sarees/
            Batches/Invoices/Customers, resolved async) — needs backend
            search endpoints. */}
      </Command.List>
    </Command.Dialog>
  );
}
