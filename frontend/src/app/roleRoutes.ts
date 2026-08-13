import type { Role } from "../contexts/AuthContext";

// The one and only portal each role is ever allowed to land on — there is no
// picker, no "view as", no crossing over. A phone number's OTP-verified role
// decides this at login time and nothing else.
export const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  superadmin: "/superadmin",
  worker: "/worker",
  weaver: "/weaver",
  shop: "/shop",
  accountant: "/accountant",
};
