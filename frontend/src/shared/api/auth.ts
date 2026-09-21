import { apiClient, isApiError } from "./client";
import { getCurrentFix, type LocationFix } from "../lib/geolocation";

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

/**
 * Runs `send` without a position first, and only asks the browser for one if
 * the server says this caller is geofenced.
 *
 * Deliberately lazy. Requesting the position up front would put a location
 * permission prompt in front of admins and superadmins, who are never
 * geofenced and whose whereabouts this app has no business collecting. It
 * also puts the prompt at a moment that explains itself — just after the
 * person tried to sign in — rather than on page load with no context.
 *
 * Retrying is safe on both endpoints: the backend runs its location check
 * before it reads the OTP row, so a refused attempt has not consumed the
 * code or spent one of the three allowed guesses.
 */
async function withLocationIfRequired<T>(send: (fix: LocationFix | null) => Promise<T>): Promise<T> {
  try {
    return await send(null);
  } catch (error) {
    if (!isApiError(error) || error.code !== "GEOFENCE_BLOCKED") throw error;

    const fix = await getCurrentFix();
    // Nothing to add to the retry — rethrow the server's own explanation of
    // why a position was needed rather than inventing a second message.
    if (!fix) throw error;

    return await send(fix);
  }
}

export const authApi = {
  requestOtp: (phone: string) =>
    withLocationIfRequired((fix) =>
      apiClient.post<RequestOtpResponse>("/auth/request-otp", { phone, ...fix }),
    ),
  verifyOtp: (phone: string, code: string) =>
    withLocationIfRequired((fix) =>
      apiClient.post<VerifyOtpResponse>("/auth/verify-otp", { phone, code, ...fix }),
    ),
  /** Re-issues the token for another portal assigned to the same person. */
  switchRole: (role: string) =>
    // accessLevel comes back because it is per-portal: the same person can be
    // MONEY_HIDDEN in one and unrestricted in another.
    //
    // Location-checked too: the target portal may be geofenced even when the
    // one the current token was issued for is not.
    withLocationIfRequired((fix) =>
      apiClient.post<{ token: string; role: string; roles: string[]; accessLevel: string }>(
        "/auth/switch-role",
        { role, ...fix },
      ),
    ),
  /** Closes the session in the login history. Needs the token, so it must be
   *  called before local credentials are cleared. */
  logout: () => apiClient.post<{ ok: boolean }>("/auth/logout", {}),
};
