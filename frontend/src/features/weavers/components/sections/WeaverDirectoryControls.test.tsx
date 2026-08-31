/**
 * This file was committed with an unclosed <div> and did not parse, which took
 * down the production build, the type-check, the linter and two unrelated test
 * suites. Type-checking proves it parses again; only rendering proves the
 * markup it produces is actually well-formed and the controls work.
 */
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../../../../test/render";
import { AllWeaversControls } from "./WeaverDirectoryControls";

vi.mock("../../../../shared/api/weavers", () => ({
  weaversApi: { list: vi.fn().mockResolvedValue({ items: [] }) },
}));
vi.mock("../../../../shared/api/weaverPayments", () => ({
  weaverPaymentsApi: { listAll: vi.fn().mockResolvedValue([]) },
}));

function renderControls(over: Partial<Parameters<typeof AllWeaversControls>[0]> = {}) {
  const props = {
    view: "card",
    setView: vi.fn(),
    filter: "All",
    setFilter: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    onAddWeaver: vi.fn(),
    onViewAll: vi.fn(),
    onImport: vi.fn(),
    ...over,
  };
  renderWithQueryClient(<AllWeaversControls {...props}><div>child content</div></AllWeaversControls>);
  return props;
}

describe("AllWeaversControls", () => {
  it("renders its heading, search box and children", () => {
    renderControls();
    // "All Weavers" is both the section heading and a filter pill.
    expect(screen.getAllByText("All Weavers").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add New Weaver" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search by weaver name, weaver code, or village/i),
    ).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
    // The view toggle and the filter pills sit either side of the wrapper that
    // was left unclosed; both rendering means the region closed correctly.
    for (const name of ["Cards", "List", "Table", "View All Weavers"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("reports typing back through setSearch", async () => {
    const user = userEvent.setup();
    const props = renderControls();
    await user.type(screen.getByPlaceholderText(/Search by weaver name/i), "Pa");
    expect(props.setSearch).toHaveBeenCalled();
  });

  it("marks the village and sort controls disabled rather than inert-but-clickable", () => {
    renderControls();
    const village = screen.getByTitle(/Filter by village on the View All Weavers page/i);
    const sort = screen.getByTitle(/Sort weavers on the View All Weavers page/i);
    expect(village).toBeDisabled();
    expect(sort).toBeDisabled();
  });
});
