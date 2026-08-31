import { useNavigate } from "react-router";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { useAuth, type Role } from "@/contexts/AuthContext";

/**
 * Support for an admin/superadmin working inside a staff portal
 * (AuthContext.enterStaffView).
 *
 * This is deliberately not impersonation: the session, token and user
 * identity are untouched, so every action recorded while in here is
 * attributed to the admin — which is exactly what the staff directories'
 * history pages surface. These helpers make that state visible rather than
 * letting an admin quietly look like a member of staff.
 */
export function useAdminStaffView() {
  const { adminViewingAs, selectRole, clearAdminView, user, role } = useAuth();
  const navigate = useNavigate();

  const returnToAdmin = () => {
    const target: Role = adminViewingAs ?? "admin";
    clearAdminView();
    selectRole(target);
    navigate(target === "superadmin" ? "/superadmin" : "/admin");
  };

  return {
    /** The admin role this session came from, or null for real staff. */
    adminViewingAs,
    isAdminViewing: adminViewingAs !== null,
    returnToAdmin,
    user,
    role,
  };
}

/** Role label as staff-portal chrome should show it. */
export function roleLabel(role: Role | null | undefined): string {
  switch (role) {
    case "superadmin": return "Superadmin";
    case "admin": return "Admin";
    case "worker": return "Worker Staff";
    case "shop": return "Shop Staff";
    case "weaver": return "Weaver";
    case "accountant": return "Accountant";
    default: return "—";
  }
}

/**
 * The subtitle a staff portal shows under the signed-in name. For real staff
 * it's their own role; for an admin it names who they actually are and which
 * portal they're looking at, so an action is never mistaken for a worker's.
 */
export function staffIdentitySubtitle({
  adminViewingAs,
  portalLabel,
  fallback,
}: {
  adminViewingAs: Role | null;
  portalLabel: string;
  fallback: string;
}): string {
  return adminViewingAs ? `${roleLabel(adminViewingAs)} · viewing ${portalLabel}` : fallback;
}

import { semantic, radius } from "@/design-system/tokens";

/**
 * Full-width notice pinned under a staff portal's nav while an admin is
 * viewing it. Renders nothing for a real staff session.
 */
export function AdminViewingBanner({ portalLabel }: { portalLabel: string }) {
  const { adminViewingAs, isAdminViewing, returnToAdmin, user } = useAdminStaffView();
  if (!isAdminViewing) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 md:px-7 xl:px-12"
      style={{ background: semantic.surface.accentSubtle, borderBottom: `1px solid ${semantic.border.accent}` }}
    >
      <ShieldCheck size={15} color={semantic.text.accent} className="shrink-0" />
      <span className="text-[12px] font-semibold" style={{ color: semantic.text.accent }}>
        You are viewing {portalLabel} as {user?.name ?? roleLabel(adminViewingAs)}
        {user?.name ? ` (${roleLabel(adminViewingAs)})` : ""}.
      </span>
      <span className="text-[12px]" style={{ color: semantic.text.accent, opacity: 0.85 }}>
        Anything you record here is saved under your name, not a staff member's.
      </span>
      <button
        type="button"
        onClick={returnToAdmin}
        className="ml-auto inline-flex items-center gap-1 px-3 py-1 text-[12px] font-bold"
        style={{ color: semantic.text.onInverse, background: semantic.text.accent, borderRadius: radius.md }}
      >
        <ChevronLeft size={13} /> Return to Admin
      </button>
    </div>
  );
}

