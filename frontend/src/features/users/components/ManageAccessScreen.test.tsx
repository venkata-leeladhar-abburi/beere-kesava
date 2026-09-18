import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManageAccessScreen } from "./ManageAccessScreen";
import { TableRow } from "./utils";

const worker: TableRow = {
  empId: "EMP-004", firstName: "Ravi", lastName: "Kumar", role: "Worker Staff",
  mobile: "9876543210", portal: "Worker Staff Portal", dateAdded: "01 Jan 2026",
  status: "Active", additionalRoles: [], backendId: "u1",
};

/** The label carries both the role name and its portal, so match on the start. */
const portalBox = (label: string) =>
  screen.getByRole("checkbox", { name: new RegExp(`^${label}`) });
const noPortalBox = (label: string) =>
  screen.queryByRole("checkbox", { name: new RegExp(`^${label}`) });
/** The access-level control for one portal — labelled by that portal's name. */
const levelPicker = (portal: string) =>
  screen.getByRole("button", { name: new RegExp(`^${portal}`) });

function setup(row: TableRow = worker) {
  const onSave = vi.fn();
  const onBack = vi.fn();
  render(<ManageAccessScreen row={row} onBack={onBack} onSave={onSave} />);
  return { onSave, onBack, user: userEvent.setup() };
}

describe("ManageAccessScreen", () => {
  it("grants several portals at once and saves them together", async () => {
    const { onSave, user } = setup();

    await user.click(portalBox("Shop Staff"));
    await user.click(portalBox("Accountant"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await user.click(screen.getByText("Save Access"));
    expect(onSave).toHaveBeenCalledWith({
      additionalRoles: ["Shop Staff", "Accountant"],
      accessLevels: {
        "Worker Staff": "Full Access",
        "Shop Staff": "Full Access",
        Accountant: "Full Access",
      },
    });
  });

  it("never offers the person's own primary role as an extra", () => {
    setup();
    expect(noPortalBox("Worker Staff")).not.toBeInTheDocument();
    expect(portalBox("Admin")).toBeInTheDocument();
  });

  it("keeps Save disabled until something actually changes", async () => {
    const { user } = setup({ ...worker, additionalRoles: ["Shop Staff"] });
    const save = screen.getByText("Save Access");

    expect(save).toBeDisabled();
    await user.click(portalBox("Shop Staff")); // turn it back off
    expect(save).toBeEnabled();
  });

  it("says a single-portal account skips the login picker", () => {
    setup();
    expect(screen.getByText(/goes straight to the Worker Staff Portal at login/)).toBeInTheDocument();
  });

  it("offers no extra portals to a weaver", () => {
    setup({ ...worker, role: "Weaver", portal: "Weaver Portal" });
    expect(noPortalBox("Shop Staff")).not.toBeInTheDocument();
    expect(screen.getByText("Not available for weavers.")).toBeInTheDocument();
  });

  it("keeps each portal's access level separate and sends the whole map", async () => {
    const { onSave, user } = setup({
      ...worker,
      additionalRoles: ["Accountant"],
      accessLevels: { "Worker Staff": "Money Hidden", Accountant: "Full Access" },
    });

    // One level control per portal, each showing its own current level.
    expect(levelPicker("Worker Staff")).toHaveTextContent("Money Hidden");
    expect(levelPicker("Accountant")).toHaveTextContent("Full Access");

    await user.click(portalBox("Shop Staff"));
    await user.click(screen.getByText("Save Access"));
    expect(onSave).toHaveBeenCalledWith({
      additionalRoles: ["Accountant", "Shop Staff"],
      accessLevels: {
        // The primary keeps its restriction, and a portal granted just now
        // starts unrestricted rather than inheriting it.
        "Worker Staff": "Money Hidden",
        Accountant: "Full Access",
        "Shop Staff": "Full Access",
      },
    });
  });

  it("treats a level change on its own as a change worth saving", async () => {
    const { onSave, user } = setup({ ...worker, accessLevels: { "Worker Staff": "Full Access" } });
    const save = screen.getByText("Save Access");
    expect(save).toBeDisabled();

    await user.click(levelPicker("Worker Staff"));
    await user.click(screen.getByRole("menuitem", { name: "Money Hidden" }));

    expect(save).toBeEnabled();
    await user.click(save);
    expect(onSave).toHaveBeenCalledWith({
      additionalRoles: [],
      accessLevels: { "Worker Staff": "Money Hidden" },
    });
  });
});
