import type { Role } from "../contexts/AuthContext";

// The one and only portal each role is ever allowed to LAND ON at login —
// there is no picker and no crossing over. A phone number's OTP-verified role
// decides this at login time and nothing else.
//
// The single exception is AuthContext.enterStaffView: an admin/superadmin can
// deliberately open a staff portal as themselves, with a banner saying so and
// a one-click way back. That is not a login-time choice and not
// impersonation — the session and identity are unchanged, so everything done
// in there is recorded against the admin.
export const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  superadmin: "/superadmin",
  worker: "/worker",
  weaver: "/weaver",
  shop: "/shop",
  accountant: "/accountant",
};
