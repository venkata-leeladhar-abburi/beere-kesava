import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQueryClient } from "../../../test/render";
import { FinishingStaffProvider, useFinishingStaff } from "./FinishingStaffContext";
import { finishingStaffApi, type BackendFinishingStaff, BACKEND_ACTIVE_STATUS } from "../../../shared/api/finishing";
import { PERSON_STATUS } from "@/lib/domain/status";

vi.mock("../../../shared/api/finishing", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../../shared/api/finishing")>();
  return {
    ...mod,
    finishingStaffApi: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

const MOCK_STAFF: BackendFinishingStaff[] = [
  {
    id: "fs-seed-001",
    empId: "EMP-001",
    firstName: "Anand",
    lastName: "Kumar",
    mobile: "+91 98450 12345",
    email: "anand@example.com",
    specialisation: "Ironing",
    notes: "",
    status: BACKEND_ACTIVE_STATUS.Active,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fs-seed-002",
    empId: "EMP-002",
    firstName: "Bala",
    lastName: "Raji",
    mobile: "+91 98450 12346",
    email: "",
    specialisation: "Polishing",
    notes: "",
    status: BACKEND_ACTIVE_STATUS.Active,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fs-seed-003",
    empId: "EMP-003",
    firstName: "Chitra",
    lastName: "Devi",
    mobile: "+91 98450 12347",
    email: "",
    specialisation: "Packing",
    notes: "",
    status: BACKEND_ACTIVE_STATUS.Active,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fs-seed-004",
    empId: "EMP-004",
    firstName: "Dinesh",
    lastName: "Rao",
    mobile: "+91 98450 12348",
    email: "",
    specialisation: "Fold",
    notes: "",
    status: BACKEND_ACTIVE_STATUS.Inactive,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];


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
            status: PERSON_STATUS.active.label,
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(finishingStaffApi.list).mockResolvedValue({
      items: MOCK_STAFF,
      total: 4,
      page: 1,
      pageSize: 100,
    });
    vi.mocked(finishingStaffApi.create).mockResolvedValue(MOCK_STAFF[0]);
    vi.mocked(finishingStaffApi.update).mockResolvedValue(MOCK_STAFF[0]);
  });

  it("seeds 4 members, 3 of them active", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("4"));
    expect(screen.getByTestId("active-count")).toHaveTextContent("3");
  });

  it("addMember prepends a new member and it shows up in the list", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("4"));
    fireEvent.click(screen.getByText("Add"));
    await waitFor(() => expect(finishingStaffApi.create).toHaveBeenCalled());
  });

  it("toggleStatus flips Active to Inactive and updates activeMembers", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("member-fs-seed-001")).toHaveTextContent("Anand — Active"));
    fireEvent.click(screen.getByText("Toggle first"));
    await waitFor(() => expect(finishingStaffApi.update).toHaveBeenCalledWith("fs-seed-001", { status: BACKEND_ACTIVE_STATUS.Inactive }));
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

