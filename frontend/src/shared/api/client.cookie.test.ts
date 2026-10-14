import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Cookie mode is a build-time switch; force it on for this file only.
vi.mock("./authMode", () => ({ COOKIE_AUTH: true }));

import { apiClient } from "./client";

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, statusCode: 200, data }), { status: 200 });

describe("apiClient in cookie mode", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(ok({}));
    vi.stubGlobal("fetch", fetchMock);
    assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, pathname: "/admin", search: "", assign });
    // A token left over from bearer mode must never be sent.
    localStorage.setItem("token", "stale-bearer-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sends the cookie and the CSRF header, never a bearer token", async () => {
    await apiClient.post("/sales", { a: 1 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(init.credentials).toBe("include");
    expect(headers["X-BK-CSRF"]).toBe("1");
    expect(headers["X-Auth-Mode"]).toBe("cookie");
    expect(headers.Authorization).toBeUndefined();
  });

  it("treats AUTH_REQUIRED as a lost session and goes to /login", async () => {
    localStorage.setItem("bk_auth_state", JSON.stringify({ isAuthenticated: true }));
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, statusCode: 401, code: "AUTH_REQUIRED", message: "x" }),
        {
          status: 401,
        }
      )
    );

    await expect(apiClient.get("/sales")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(assign).toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("bk_auth_state")).toBeNull();
  });
});
