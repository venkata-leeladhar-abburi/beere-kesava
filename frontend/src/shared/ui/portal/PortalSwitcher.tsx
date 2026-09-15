import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeftRight, Check } from "lucide-react";
import { useAuth, type Role } from "@/contexts/AuthContext";
import { ApiError } from "@/shared/api/client";
import { ROLE_ROUTES } from "@/app/roleRoutes";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/shared/ui/overlay";
import { roleLabel } from "./AdminStaffView";

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

/**
 * Floating "Switch Portal" control, shown in every portal (mounted by
 * RequireRole) only for someone with more than one assigned portal.
 */
export function PortalSwitcher() {
  const { availableRoles, role } = useAuth();
  const { go, switching } = useSwitchPortal();
  if (availableRoles.length < 2) return null;

  return (
    <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 60 }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Switch portal"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold"
            style={{
              background: "#6E0F2D", color: "#FFFFFF", borderRadius: 999, border: "none",
              boxShadow: "0 8px 24px rgba(110,15,45,0.28)", cursor: "pointer",
            }}
          >
            <ArrowLeftRight size={15} />
            {switching ? "Switching…" : "Switch Portal"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="!min-w-[220px]">
          <DropdownMenuLabel>Your portals</DropdownMenuLabel>
          {availableRoles.map(r => (
            <DropdownMenuItem
              key={r}
              disabled={r === role || switching !== null}
              onClick={() => { if (r !== role) void go(r); }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                {roleLabel(r)} Portal
                {r === role && <Check size={14} />}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
