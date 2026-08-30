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
  /** Closes the session in the login history. Needs the token, so it must be
   *  called before local credentials are cleared. */
  logout: () => apiClient.post<{ ok: boolean }>("/auth/logout", {}),
};
