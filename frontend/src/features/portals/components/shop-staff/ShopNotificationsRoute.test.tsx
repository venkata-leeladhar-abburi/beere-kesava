/**
 * `/shop/notifications` must resolve to the Notifications page rather than
 * falling through to Shop Home — the portal derives its screen from the
 * pathname, so a missed branch here is invisible to a type-check.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { renderWithQueryClient } from "../../../../test/render";
import { ShopStaffPortal } from "../ShopStaffPortal";

vi.mock("../../../../shared/api/notifications", () => ({
  notificationsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    markRead: vi.fn().mockResolvedValue({}),
  },
  connectNotificationsSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn(), disconnect: vi.fn() })),
}));

vi.mock("../../../../shared/api/sales", () => ({
  salesApi: {
    list: vi.fn().mockResolvedValue({ items: [] }),
    listReturns: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe("shop portal routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the Notifications page at /shop/notifications", async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/shop/notifications"]}>
        <ShopStaffPortal />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Every sale, return, stock alert/i)).toBeInTheDocument(),
    );
    // ...and not the home screen it used to fall back to.
    expect(screen.queryByText("Shop Home")).not.toBeInTheDocument();
  });

  it("navigates to the page from the bell dropdown's footer link", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/shop/home"]}>
        <ShopStaffPortal />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: /Notifications/i }));
    await user.click(await screen.findByText("View all notifications"));

    await waitFor(() =>
      expect(screen.getByText(/Every sale, return, stock alert/i)).toBeInTheDocument(),
    );
  });
});
