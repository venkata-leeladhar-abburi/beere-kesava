import { apiClient } from "./client";

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  exists: boolean;
}

export interface VerifyOtpResponse {
  token: string;
  user: {
    id: string;
    /** Real Weaver.id for WEAVER-role sessions — distinct from `id` (the User.id), since batches/payments/etc are FK'd to Weaver.id. Null for every other role. */
    weaverId: string | null;
    /** Human-facing ID (e.g. "ADMIN-001", "WEA-003") — null only in unreachable fallback paths. */
    empId: string | null;
    name: string;
    email: string;
    mobile: string;
    role: string;
    /** Every portal assigned to this person, primary role first. */
    roles?: string[];
    accessLevel: string;
    /** ISO date string — when this User/Weaver record was created. */
    dateAdded: string | null;
  };
}

export const authApi = {
  requestOtp: (phone: string) =>
    apiClient.post<RequestOtpResponse>("/auth/request-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    apiClient.post<VerifyOtpResponse>("/auth/verify-otp", { phone, code }),
  /** Re-issues the token for another portal assigned to the same person. */
  switchRole: (role: string) =>
    // accessLevel comes back because it is per-portal: the same person can be
    // MONEY_HIDDEN in one and unrestricted in another.
    apiClient.post<{ token: string; role: string; roles: string[]; accessLevel: string }>(
      "/auth/switch-role",
      { role },
    ),
  /** Closes the session in the login history. Needs the token, so it must be
   *  called before local credentials are cleared. */
  logout: () => apiClient.post<{ ok: boolean }>("/auth/logout", {}),
};
