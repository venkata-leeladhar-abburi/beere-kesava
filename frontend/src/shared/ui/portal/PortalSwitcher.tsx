import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeftRight, LayoutDashboard, Crown, Hammer, Scissors, Store, Calculator, type LucideIcon } from "lucide-react";
import { useAuth, type Role } from "@/contexts/AuthContext";
import { ApiError } from "@/shared/api/client";
import { ROLE_ROUTES } from "@/app/roleRoutes";
import { Button } from "@/shared/ui/primitives";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/shared/ui/overlay";
import { roleLabel } from "./AdminStaffView";

/** One icon per portal, shared by the login picker and every profile menu. */
export const PORTAL_ICONS: Record<Role, LucideIcon> = {
  superadmin: Crown,
  admin: LayoutDashboard,
  worker: Hammer,
  weaver: Scissors,
  shop: Store,
  accountant: Calculator,
};

/**
 * Hook behind every "switch portal" control: moves the session onto another
 * portal assigned to the same person and routes there.
 */
export function useSwitchPortal() {
  const { switchPortal } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<Role | null>(null);

  const go = async (target: Role) => {
    setSwitching(target);
    try {
      await switchPortal(target);
      navigate(ROLE_ROUTES[target], { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not switch portal. Please try again.");
    } finally {
      setSwitching(null);
    }
  };

  return { go, switching };
}

/** The portals this person can move to right now — empty unless they have 2+. */
function useOtherPortals() {
  const { availableRoles, role } = useAuth();
  return availableRoles.length < 2 ? [] : availableRoles.filter(r => r !== role);
}

/**
 * "Switch Portal" rows for a Radix profile menu — a separator, a heading, and
 * one row per other assigned portal. Renders nothing for someone with a single
 * portal, so call sites can mount it unconditionally.
 */
export function PortalSwitchMenuItems({ onBeforeSwitch, itemClassName }: {
  /** Closes the host menu/panel before the route changes under it. */
  onBeforeSwitch?: () => void;
  /** The host menu's own row styling — these rows must not look grafted on. */
  itemClassName?: string;
}) {
  const others = useOtherPortals();
  const { go, switching } = useSwitchPortal();
  if (others.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>
        <span className="inline-flex items-center gap-1.5">
          <ArrowLeftRight size={12} /> Switch Portal
        </span>
      </DropdownMenuLabel>
      {others.map(r => {
        const Icon = PORTAL_ICONS[r];
        const busy = switching === r;
        return (
          <DropdownMenuItem
            key={r}
            disabled={switching !== null}
            onClick={() => { onBeforeSwitch?.(); void go(r); }}
            className={itemClassName}
          >
            <Icon size={15} /> {roleLabel(r)} Portal
            {busy && <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>Opening…</span>}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

/**
 * The same rows for the hand-rolled dropdowns that aren't built on Radix
 * (the worker mobile header, the admin mobile drawer).
 */
export function PortalSwitchButtonRows({ onBeforeSwitch, className }: {
  onBeforeSwitch?: () => void;
  className?: string;
}) {
  const others = useOtherPortals();
  const { go, switching } = useSwitchPortal();
  if (others.length === 0) return null;

  return (
    <>
      <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "4px 0" }} />
      <div style={{ padding: "6px 16px 2px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.6, display: "flex", alignItems: "center", gap: 6 }}>
        <ArrowLeftRight size={11} /> Switch Portal
      </div>
      {others.map(r => {
        const Icon = PORTAL_ICONS[r];
        return (
          <Button
            key={r}
            variant="tertiary"
            fullWidth
            disabled={switching !== null}
            onClick={() => { onBeforeSwitch?.(); void go(r); }}
            className={className ?? "!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]"}
          >
            <Icon size={14} /> {roleLabel(r)} Portal
            {switching === r && <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>Opening…</span>}
          </Button>
        );
      })}
    </>
  );
}
