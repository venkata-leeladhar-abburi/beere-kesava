import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageShell } from "./PageShell";

describe("PageShell", () => {
  it("renders header title, subtitle and actions", () => {
    render(
      <PageShell>
        <PageShell.Header title="Customers" subtitle="Wholesale and retail" actions={<button>Add</button>} />
      </PageShell>
    );
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Wholesale and retail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("renders Stats, Toolbar and Content children", () => {
    render(
      <PageShell>
        <PageShell.Header title="Inventory" />
        <PageShell.Stats>
          <div>Metric A</div>
        </PageShell.Stats>
        <PageShell.Toolbar>
          <input placeholder="Search" />
        </PageShell.Toolbar>
        <PageShell.Content>
          <PageShell.Section id="stock" title="Stock">
            <div>Row 1</div>
          </PageShell.Section>
        </PageShell.Content>
      </PageShell>
    );
    expect(screen.getByText("Metric A")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.getByText("Row 1")).toBeInTheDocument();
  });

  it("Section sets data-section and the given id, for the global scroll-margin rule", () => {
    render(
      <PageShell>
        <PageShell.Content>
          <PageShell.Section id="wholesale" title="Wholesale">
            content
          </PageShell.Section>
        </PageShell.Content>
      </PageShell>
    );
    const section = document.getElementById("wholesale");
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("data-section");
  });

  it("applies the requested density as a data attribute", () => {
    const { container } = render(<PageShell density="compact" />);
    expect(container.firstElementChild).toHaveAttribute("data-density", "compact");
  });
});
