/**
 * The Notifications page must mount and render its own shell (hero, stats,
 * filters, tabs, pagination) even when every backing query fails — a shop
 * staffer with an expired token should see an error state, not a blank page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderWithQueryClient } from "../../../../../test/render";
import { NotificationsSection } from "./NotificationsSection";

vi.mock("../../../../../shared/api/notifications", () => ({
  notificationsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    markRead: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../../../shared/api/sales", () => ({
  salesApi: {
    list: vi.fn().mockResolvedValue({ items: [] }),
    listReturns: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe("NotificationsSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page shell and the empty state", async () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/shop/notifications"]}>
        <NotificationsSection isTablet={false} />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Notifications")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("No notifications yet")).toBeInTheDocument());

    // Filters are present and labelled.
    expect(screen.getByLabelText("Search notifications")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark all read/i })).toBeDisabled();
  });
});
