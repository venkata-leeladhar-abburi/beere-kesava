import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./client";

const post = vi.fn();
vi.mock("./client", async () => {
  const actual = await vi.importActual<typeof import("./client")>("./client");
  return { ...actual, apiClient: { post: (...a: unknown[]) => post(...a) } };
});

const getCurrentFix = vi.fn();
vi.mock("../lib/geolocation", () => ({ getCurrentFix: () => getCurrentFix() }));

const { authApi } = await import("./auth");

const FIX = { latitude: 14.422606, longitude: 77.726799, accuracyMeters: 18.4 };
const blocked = () =>
  new ApiError(403, "You appear to be about 1.1 km from Dharmavaram factory.", "GEOFENCE_BLOCKED");

describe("authApi location handling", () => {
  beforeEach(() => {
    post.mockReset();
    getCurrentFix.mockReset();
  });

  it("does not ask an unrestricted user for their location at all", async () => {
    // Admins and superadmins are not geofenced, so their sign-in succeeds on
    // the first call and no permission prompt is ever raised.
    post.mockResolvedValue({ success: true });

    await authApi.requestOtp("9999999999");

    expect(getCurrentFix).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/auth/request-otp", { phone: "9999999999" });
  });

  it("asks for a position only once the server says one is needed, then retries", async () => {
    post.mockRejectedValueOnce(blocked()).mockResolvedValueOnce({ success: true });
    getCurrentFix.mockResolvedValue(FIX);

    await expect(authApi.requestOtp("9999999999")).resolves.toEqual({ success: true });

    expect(post).toHaveBeenNthCalledWith(2, "/auth/request-otp", {
      phone: "9999999999",
      ...FIX,
    });
  });

  it("sends the code and the position together on the retried verify", async () => {
    post.mockRejectedValueOnce(blocked()).mockResolvedValueOnce({ token: "t" });
    getCurrentFix.mockResolvedValue(FIX);

    await authApi.verifyOtp("9999999999", "123456");

    expect(post).toHaveBeenNthCalledWith(2, "/auth/verify-otp", {
      phone: "9999999999",
      code: "123456",
      ...FIX,
    });
  });

  it("checks the location when switching into another portal", async () => {
    post.mockRejectedValueOnce(blocked()).mockResolvedValueOnce({ token: "t", role: "WORKER" });
    getCurrentFix.mockResolvedValue(FIX);

    await authApi.switchRole("WORKER");

    expect(post).toHaveBeenNthCalledWith(2, "/auth/switch-role", { role: "WORKER", ...FIX });
  });

  it("surfaces the server's explanation when no position can be obtained", async () => {
    // Permission denied. The server already worded why a location was needed,
    // so that message is what the user sees — not a second one invented here.
    post.mockRejectedValueOnce(blocked());
    getCurrentFix.mockResolvedValue(null);

    await expect(authApi.requestOtp("9999999999")).rejects.toThrow(
      "You appear to be about 1.1 km from Dharmavaram factory.",
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("lets a second refusal through instead of looping", async () => {
    // Sent a real position and was still refused: the person is genuinely off
    // site, and asking again would just spin.
    post.mockRejectedValue(blocked());
    getCurrentFix.mockResolvedValue(FIX);

    await expect(authApi.verifyOtp("9999999999", "123456")).rejects.toMatchObject({
      code: "GEOFENCE_BLOCKED",
    });
    expect(post).toHaveBeenCalledTimes(2);
    expect(getCurrentFix).toHaveBeenCalledTimes(1);
  });

  it("never retries an error that is not about location", async () => {
    post.mockRejectedValue(new ApiError(401, "Invalid OTP code.", "AUTH_INVALID_CREDENTIALS"));

    await expect(authApi.verifyOtp("9999999999", "000000")).rejects.toThrow("Invalid OTP code.");
    expect(getCurrentFix).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
  });
});
