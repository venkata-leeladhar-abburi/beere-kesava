import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "./DataPagination";

describe("usePagination", () => {
  const items = Array.from({ length: 47 }, (_, i) => i + 1);

  it("slices the first page at the default page size", () => {
    const { result } = renderHook(() => usePagination(items, 25));
    expect(result.current.pageItems).toEqual(items.slice(0, 25));
    expect(result.current.pageCount).toBe(2);
    expect(result.current.total).toBe(47);
    expect(result.current.start).toBe(0);
  });

  it("advances to the next page", () => {
    const { result } = renderHook(() => usePagination(items, 25));
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual(items.slice(25, 50));
    expect(result.current.start).toBe(25);
  });

  it("changing the page size resets back to page 1", () => {
    const { result } = renderHook(() => usePagination(items, 25));
    act(() => result.current.setPage(2));
    act(() => result.current.setPageSize(10));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.pageCount).toBe(5);
  });

  it("resets to page 1 when the filtered item count shrinks below the current page", () => {
    let source = items;
    const { result, rerender } = renderHook(({ src }) => usePagination(src, 25), {
      initialProps: { src: source },
    });
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);

    // Simulate a filter narrowing the list to fewer than 25 items (page 2 no longer exists).
    source = items.slice(0, 5);
    rerender({ src: source });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual(source);
  });

  it("never reports zero pages, even for an empty list", () => {
    const { result } = renderHook(() => usePagination([] as number[], 25));
    expect(result.current.pageCount).toBe(1);
    expect(result.current.pageItems).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});
