import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQueryClient } from "../../../test/render";
import { FinishingStaffProvider, useFinishingStaff } from "./FinishingStaffContext";

/** Exercises the public hook exactly as a real consumer would. */
function Harness() {
  const { members, activeMembers, addMember, toggleStatus } = useFinishingStaff();
  return (
    <div>
      <div data-testid="count">{members.length}</div>
      <div data-testid="active-count">{activeMembers.length}</div>
      <button
        onClick={() =>
          addMember({
            empId: "EMP-099",
            firstName: "Test",
            lastName: "Worker",
            mobile: "+91 00000 00000",
            email: "",
            specialisation: "",
            notes: "",
            status: "Active",
          })
        }
      >
        Add
      </button>
      <button onClick={() => toggleStatus("fs-seed-001")}>Toggle first</button>
      {members.map(m => (
        <div key={m.id} data-testid={`member-${m.id}`}>{m.firstName} — {m.status}</div>
      ))}
    </div>
  );
}

function renderHarness() {
  return renderWithQueryClient(
    <FinishingStaffProvider>
      <Harness />
    </FinishingStaffProvider>,
  );
}

describe("FinishingStaffContext", () => {
  it("seeds 4 members, 3 of them active", () => {
    renderHarness();
    expect(screen.getByTestId("count")).toHaveTextContent("4");
    expect(screen.getByTestId("active-count")).toHaveTextContent("3");
  });

  it("addMember prepends a new member and it shows up in the list", async () => {
    renderHarness();
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("5"));
    expect(screen.getByText(/Test — Active/)).toBeInTheDocument();
  });

  it("toggleStatus flips Active to Inactive and updates activeMembers", async () => {
    renderHarness();
    expect(screen.getByTestId("member-fs-seed-001")).toHaveTextContent("Anand — Active");

    fireEvent.click(screen.getByText("Toggle first"));

    await waitFor(() =>
      expect(screen.getByTestId("member-fs-seed-001")).toHaveTextContent("Anand — Inactive"),
    );
    expect(screen.getByTestId("active-count")).toHaveTextContent("2");
  });

  it("throws when used outside a FinishingStaffProvider", () => {
    // React logs an error to console for the thrown-during-render case; suppress it.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Orphan() {
      useFinishingStaff();
      return null;
    }
    expect(() => renderWithQueryClient(<Orphan />)).toThrow(
      "useFinishingStaff must be used inside FinishingStaffProvider",
    );
    spy.mockRestore();
  });
});
