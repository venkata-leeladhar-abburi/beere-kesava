import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marks a route (or an entire controller) as reachable without a valid JWT.
 * Used for pre-login endpoints like /auth/request-otp, /auth/verify-otp,
 * and the health check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
