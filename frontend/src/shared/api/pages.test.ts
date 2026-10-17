import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./pages";

describe("fetchAllPages", () => {
  it("reads every page and drops rows repeated across a page boundary", async () => {
    const data = Array.from({ length: 7 }, (_, i) => ({ id: `r${i}` }));
    const fetchPage = vi.fn(async (page: number) => {
      const start = (page - 1) * 3;
      // Page 2 starts one row early, as if a record was inserted mid-walk.
      const items = data.slice(page === 2 ? start - 1 : start, start + 3);
      return { items, total: data.length };
    });
    const rows = await fetchAllPages(fetchPage, 3, { key: (r) => r.id });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(rows.map((r) => r.id)).toEqual(["r0", "r1", "r2", "r3", "r4", "r5", "r6"]);
  });

  it("stops after one request when everything fits on the first page", async () => {
    const fetchPage = vi.fn(async () => ({ items: [1, 2], total: 2 }));
    expect(await fetchAllPages(fetchPage, 100)).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
