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
 *   - RECENT, ACTIONS and the async entity search (Weavers/Sarees/Batches/
 *     Invoices/Customers) are deliberately deferred — they need app-wide
 *     state (a recently-viewed record tracker, a per-feature quick-action
 *     registry, and backend search endpoints) that doesn't exist yet.
 *     TODO(command-palette): add RECENT (recently-viewed records), ACTIONS
 *     (quick-action registry) and async entity search groups once that
 *     infrastructure lands.
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
} from "lucide-react";
import { cn } from "../utils";

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

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

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

        {/* TODO(command-palette): RECENT group — recently-viewed records,
            needs a global recently-viewed tracker. */}
        {/* TODO(command-palette): ACTIONS group — per-feature quick actions,
            needs a quick-action registry. */}

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
