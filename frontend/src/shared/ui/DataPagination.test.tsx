import { describe, it, expect } from "vitest";
import { render, renderHook, screen, act } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { Pagination, usePagination } from "./DataPagination";

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

// ─── The rendered control ─────────────────────────────────────────────────
// The hook was covered above; the component it feeds was not, despite backing
// every tabular view in the app. These are behaviour tests and deliberately
// not a regression net for the hook-order lint error fixed alongside them:
// React tolerates that particular early-return shape, so no test can assert
// it crashes. The ordering rule still matters — add a second hook below the
// ref and the empty/populated renders stop agreeing — but that is what the
// linter guards, not this file.

function Harness({ initial = [] as string[] }) {
  const [items, setItems] = useState<string[]>(initial);
  const pag = usePagination(items, 10);
  return (
    <div>
      <button onClick={() => setItems(Array.from({ length: 25 }, (_, i) => `row-${i}`))}>load</button>
      <button onClick={() => setItems([])}>clear</button>
      <span data-testid="shown">{pag.pageItems.join(",")}</span>
      <Pagination
        page={pag.page}
        pageCount={pag.pageCount}
        total={pag.total}
        pageSize={pag.pageSize}
        start={pag.start}
        onPageChange={pag.setPage}
        scrollToTop={false}
        itemLabel="sarees"
      />
    </div>
  );
}

describe("Pagination", () => {
  it("renders nothing while the list is empty", () => {
    render(<Harness />);
    expect(screen.queryByText(/sarees/i)).not.toBeInTheDocument();
  });

  it("appears once the list populates and moves between pages", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "load" }));
    expect(screen.getByText(/sarees/i)).toBeInTheDocument();
    expect(screen.getByTestId("shown").textContent).toContain("row-0");

    await user.click(screen.getByRole("button", { name: "Last page" }));
    const shown = screen.getByTestId("shown").textContent ?? "";
    expect(shown).toContain("row-20");
    expect(shown).not.toContain("row-0,");

    await user.click(screen.getByRole("button", { name: "First page" }));
    expect(screen.getByTestId("shown").textContent).toContain("row-0,");
  });

  it("disappears again when the list empties", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["a", "b"]} />);
    expect(screen.getByText(/sarees/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.queryByText(/sarees/i)).not.toBeInTheDocument();
  });
});
