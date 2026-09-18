import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { PortalSwitchButtonRows } from "./PortalSwitcher";
import type { Role } from "@/contexts/AuthContext";

const switchPortal = vi.fn().mockResolvedValue(undefined);
const auth = { role: "worker" as Role, availableRoles: ["worker"] as Role[], switchPortal };

vi.mock("@/contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/AuthContext")>();
  return { ...actual, useAuth: () => auth };
});

function setup(role: Role, availableRoles: Role[]) {
  auth.role = role;
  auth.availableRoles = availableRoles;
  render(<MemoryRouter><PortalSwitchButtonRows /></MemoryRouter>);
}

describe("PortalSwitchButtonRows", () => {
  beforeEach(() => switchPortal.mockClear());

  it("renders nothing for someone with a single portal", () => {
    setup("worker", ["worker"]);
    expect(screen.queryByText("Switch Portal")).not.toBeInTheDocument();
  });

  it("offers every assigned portal except the one already open", () => {
    setup("worker", ["worker", "shop", "accountant"]);

    expect(screen.getByText("Switch Portal")).toBeInTheDocument();
    expect(screen.getByText("Shop Staff Portal")).toBeInTheDocument();
    expect(screen.getByText("Accountant Portal")).toBeInTheDocument();
    expect(screen.queryByText("Worker Staff Portal")).not.toBeInTheDocument();
  });

  it("switches the session rather than logging out", async () => {
    setup("worker", ["worker", "shop"]);
    await userEvent.click(screen.getByText("Shop Staff Portal"));
    expect(switchPortal).toHaveBeenCalledWith("shop");
  });
});
