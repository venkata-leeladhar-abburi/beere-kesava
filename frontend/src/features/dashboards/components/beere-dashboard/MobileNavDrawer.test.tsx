import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MobileTopNav } from "./MobileNavDrawer";

/**
 * The admin profile menu has to offer the same things on a phone as on a
 * laptop. The three staff directories and the two "view as" entries lived
 * only in the desktop TopNav, so an admin working from a phone could not
 * reach them at all — the same gap the superadmin menu had.
 */

// PortalSwitchButtonRows reads the auth context and renders a row only for
// someone holding a second portal; stubbed so these assertions are about the
// rows this component owns.
vi.mock("../../../../shared/ui/portal/PortalSwitcher", () => ({
  PortalSwitchButtonRows: () => null,
}));

const handlers = {
  set: vi.fn(),
  onViewAs: vi.fn(),
  onLogout: vi.fn(),
  onProfile: vi.fn(),
  onMenuOpen: vi.fn(),
  onNotifications: vi.fn(),
};

async function openProfileMenu() {
  render(
    <MemoryRouter>
      <MobileTopNav {...handlers} />
    </MemoryRouter>,
  );
  // The avatar button is the only one labelled "BK".
  await userEvent.click(screen.getByRole("button", { name: /^BK$/ }));
}

describe("admin MobileTopNav profile menu", () => {
  beforeEach(() => Object.values(handlers).forEach((fn) => fn.mockClear()));

  it("offers every entry the desktop menu does", async () => {
    await openProfileMenu();

    for (const label of [
      "View Profile",
      "Worker Staff",
      "Shop Staff",
      "Accountant Staff",
      "View as Worker Staff",
      "View as Shop Staff",
      "Logout",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it.each([
    ["Worker Staff", "WorkerStaff"],
    ["Shop Staff", "ShopStaff"],
    ["Accountant Staff", "AccountantStaff"],
  ])("navigates to the %s directory", async (label, pageKey) => {
    await openProfileMenu();
    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(handlers.set).toHaveBeenCalledWith(pageKey);
  });

  it.each([
    ["View as Worker Staff", "worker"],
    ["View as Shop Staff", "shop"],
  ])("opens the staff portal from %s", async (label, role) => {
    await openProfileMenu();
    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(handlers.onViewAs).toHaveBeenCalledWith(role);
  });

  it("still logs out", async () => {
    await openProfileMenu();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(handlers.onLogout).toHaveBeenCalledTimes(1);
  });

  it("closes the menu once an entry is chosen", async () => {
    await openProfileMenu();
    await userEvent.click(screen.getByRole("button", { name: "Shop Staff" }));

    expect(screen.queryByRole("button", { name: "Shop Staff" })).not.toBeInTheDocument();
  });
});
