import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button", () => {
  it("renders children and responds to click", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add customer</Button>);
    const btn = screen.getByRole("button", { name: "Add customer" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("defaults to the secondary variant so it never silently becomes a primary CTA", () => {
    render(<Button>Cancel</Button>);
    const btn = screen.getByRole("button", { name: "Cancel" });
    // secondary variant is outlined on --surface-raised, not filled --surface-brand
    expect(btn.className).toContain("--surface-raised");
  });

  it("keeps the visible label and sets aria-busy while loading, and disables interaction", () => {
    render(<Button loading loadingLabel="Saving">Save</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Saving")).toBeInTheDocument();
  });

  it("disabled prevents the click handler from firing", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Add</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("sets aria-label from the required label prop", () => {
    render(<IconButton icon="delete" label="Delete invoice" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Delete invoice" })).toBeInTheDocument();
  });

  // The real enforcement is at compile time — `label` is a required prop, so
  // <IconButton icon="delete" /> with no label is a TypeScript error, not a
  // runtime accessibility bug. This test documents that contract; the
  // compile-time check is exercised by every other call site in this file.
  it("would fail to typecheck without `label` (documented, not runtime-testable)", () => {
    // @ts-expect-error — label is required
    const missingLabel = () => <IconButton icon="delete" onClick={() => {}} />;
    expect(typeof missingLabel).toBe("function");
  });
});
