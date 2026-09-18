import type { Role } from "../contexts/AuthContext";

// Where each portal lives. A person assigned exactly one portal lands on it
// straight after OTP; one assigned several (User.additionalRoles) is asked
// which every time they log in (/select-role) and can move between them from
// their profile menu — each move is re-verified server-side by
// POST /auth/switch-role, so the list here grants nothing on its own.
//
// Separate from both: AuthContext.enterStaffView lets an admin/superadmin open
// a staff portal as themselves, with a banner saying so and a one-click way
// back. That is not impersonation — the session and identity are unchanged, so
// everything done in there is recorded against the admin.
export const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  superadmin: "/superadmin",
  worker: "/worker",
  weaver: "/weaver",
  shop: "/shop",
  accountant: "/accountant",
};
