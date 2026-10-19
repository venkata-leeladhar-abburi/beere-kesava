import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./authMode", () => ({ COOKIE_AUTH: false }));

import { apiClient } from "./client";

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, statusCode: 200, data }), { status: 200 });
const authRequired = () =>
  new Response(
    JSON.stringify({ success: false, statusCode: 401, code: "AUTH_REQUIRED", message: "x" }),
    { status: 401 }
  );
const authHeader = (call: unknown[]) =>
  ((call[1] as RequestInit).headers as Record<string, string>).Authorization;

/**
 * Signing in stores the token a moment after the first queries start. A
 * request that left in that gap must not stay failed with "Please sign in".
 */
describe("apiClient — a request that raced sign-in", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    assign = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/superadmin/reports",
      search: "",
      assign,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sends again with the token that was stored while it was in flight", async () => {
    fetchMock.mockImplementationOnce(async () => {
      localStorage.setItem("token", "fresh-token"); // sign-in finishes meanwhile
      return authRequired();
    });
    fetchMock.mockResolvedValueOnce(ok([{ sareeId: "S-1" }]));

    await expect(apiClient.get("/inventory/woven")).resolves.toEqual([{ sareeId: "S-1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authHeader(fetchMock.mock.calls[0]!)).toBeUndefined();
    expect(authHeader(fetchMock.mock.calls[1]!)).toBe("Bearer fresh-token");
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not resend a request that already carried a token", async () => {
    localStorage.setItem("token", "revoked-token");
    fetchMock.mockResolvedValue(authRequired());

    await expect(apiClient.get("/sales")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still sends a signed-out visitor to /login when no token ever appears", async () => {
    fetchMock.mockResolvedValue(authRequired());

    await expect(apiClient.get("/sales")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("/login");
  });
});
