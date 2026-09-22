import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SAMobileTopNav } from "./SAMobileNav";

/**
 * The superadmin profile menu has to offer the same things on a phone as on a
 * laptop. Five rows — the three staff directories and the two "view as"
 * entries — existed only in SATopNav, so the same account could reach them
 * from a desktop and simply not find them on mobile.
 */

const handlers = {
  set: vi.fn(),
  onViewAs: vi.fn(),
  onLogout: vi.fn(),
  onBack: vi.fn(),
  onProfile: vi.fn(),
  onMenuOpen: vi.fn(),
  onNotifications: vi.fn(),
};

async function openProfileMenu() {
  render(<SAMobileTopNav {...handlers} />);
  // The avatar button is the only one labelled "SA".
  await userEvent.click(screen.getByRole("button", { name: /^SA$/ }));
}

describe("SAMobileTopNav profile menu", () => {
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
      "Switch Portal",
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
    // Viewing as staff is not a portal switch; onBack would send the user to
    // the portal picker instead of into the portal.
    expect(handlers.onBack).not.toHaveBeenCalled();
  });

  it("actually logs out instead of returning to the portal picker", async () => {
    // The bug this guards: Logout called onBack, so it looked like it worked
    // while leaving the session open — on a shared phone, the next person
    // picked a portal straight back into the account.
    await openProfileMenu();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(handlers.onLogout).toHaveBeenCalledTimes(1);
    expect(handlers.onBack).not.toHaveBeenCalled();
  });

  it("falls back to going back when no logout handler is given", async () => {
    render(<SAMobileTopNav {...handlers} onLogout={undefined} />);
    await userEvent.click(screen.getByRole("button", { name: /^SA$/ }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  it("closes the menu once an entry is chosen", async () => {
    await openProfileMenu();
    expect(screen.getByRole("button", { name: "Worker Staff" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Worker Staff" }));

    expect(screen.queryByRole("button", { name: "Worker Staff" })).not.toBeInTheDocument();
  });
});
