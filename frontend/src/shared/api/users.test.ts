import { describe, expect, it, vi, beforeEach } from "vitest";

const get = vi.fn();
vi.mock("./client", () => ({ apiClient: { get: (...a: unknown[]) => get(...a) } }));

const { usersApi } = await import("./users");

const user = (id: number) => ({ id: String(id) });

describe("usersApi.list", () => {
  beforeEach(() => get.mockReset());

  it("never asks for more than the DTO cap, even when told to", async () => {
    get.mockResolvedValue({ items: [user(1)], total: 1, page: 1, pageSize: 100 });
    await usersApi.list({ pageSize: 200 });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe("/users?page=1&pageSize=100");
  });

  it("walks every page and merges them", async () => {
    get.mockImplementation((url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page"));
      const all = Array.from({ length: 250 }, (_, i) => user(i));
      return Promise.resolve({ items: all.slice((page - 1) * 100, page * 100), total: 250, page, pageSize: 100 });
    });
    const res = await usersApi.list({ pageSize: 200 });
    expect(get).toHaveBeenCalledTimes(3);
    expect(res.items).toHaveLength(250);
    expect(res.total).toBe(250);
    expect(new Set(res.items.map(u => u.id)).size).toBe(250);
  });

  it("keeps role and search filters on every page", async () => {
    get.mockImplementation((url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page"));
      return Promise.resolve({ items: Array.from({ length: page === 1 ? 100 : 20 }, (_, i) => user(i)), total: 120, page, pageSize: 100 });
    });
    await usersApi.list({ role: "ADMIN", search: "ravi" });
    expect(get.mock.calls.map(c => c[0])).toEqual([
      "/users?page=1&pageSize=100&role=ADMIN&search=ravi",
      "/users?page=2&pageSize=100&role=ADMIN&search=ravi",
    ]);
  });

  it("stops instead of looping forever when a page comes back empty", async () => {
    get.mockImplementation((url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page"));
      return Promise.resolve({ items: page === 1 ? [user(1)] : [], total: 999, page, pageSize: 100 });
    });
    const res = await usersApi.list();
    expect(get).toHaveBeenCalledTimes(2);
    expect(res.items).toHaveLength(1);
  });

  it("still accepts the legacy bare-number argument", async () => {
    get.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });
    await usersApi.list(50);
    expect(get.mock.calls[0][0]).toBe("/users?page=1&pageSize=50");
  });
});
