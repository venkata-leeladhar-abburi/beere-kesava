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
    name: string;
    email: string;
    mobile: string;
    role: string;
  };
}

export const authApi = {
  requestOtp: (phone: string) =>
    apiClient.post<RequestOtpResponse>("/auth/request-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    apiClient.post<VerifyOtpResponse>("/auth/verify-otp", { phone, code }),
};
