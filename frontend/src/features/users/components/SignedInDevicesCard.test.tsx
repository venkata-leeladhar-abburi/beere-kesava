import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../../../test/render";
import { usersApi } from "../../../shared/api/users";
import { SignedInDevicesCard } from "./SignedInDevicesCard";

vi.mock("../../../shared/api/users", () => ({
  usersApi: {
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
  },
}));

const api = vi.mocked(usersApi);

// The dialog's confirm button comes after every row's own "Sign out".
const lastSignOutButton = () => {
  const buttons = screen.getAllByRole("button", { name: "Sign out" });
  return buttons[buttons.length - 1];
};

const session = (id: string, device: string) => ({
  id,
  device,
  createdAt: "2026-10-01T09:00:00.000Z",
  lastSeenAt: new Date().toISOString(),
});

describe("SignedInDevicesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.revokeSession.mockResolvedValue({ revoked: 1 });
    api.revokeAllSessions.mockResolvedValue({ revoked: 2 });
  });

  it("says so when the person is signed in nowhere", async () => {
    api.listSessions.mockResolvedValue([]);
    renderWithQueryClient(<SignedInDevicesCard userId="u1" fullName="Ravi Kumar" />);

    expect(
      await screen.findByText("Ravi Kumar is not signed in on any device.")
    ).toBeInTheDocument();
  });

  it("signs one device out only after confirming", async () => {
    api.listSessions.mockResolvedValue([session("s1", "Chrome on Android")]);
    const user = userEvent.setup();
    renderWithQueryClient(<SignedInDevicesCard userId="u1" fullName="Ravi Kumar" />);

    await user.click(await screen.findByRole("button", { name: /sign out/i }));
    expect(api.revokeSession).not.toHaveBeenCalled();
    expect(screen.getByText("Sign out this device?")).toBeInTheDocument();

    await user.click(lastSignOutButton());
    expect(api.revokeSession).toHaveBeenCalledWith("u1", "s1");
  });

  it("offers sign-out-everywhere once there is more than one device", async () => {
    api.listSessions.mockResolvedValue([
      session("s1", "Chrome on Android"),
      session("s2", "Safari on iPhone"),
    ]);
    const user = userEvent.setup();
    renderWithQueryClient(<SignedInDevicesCard userId="u1" fullName="Ravi Kumar" />);

    await user.click(await screen.findByRole("button", { name: /sign out of all 2 devices/i }));
    await user.click(lastSignOutButton());
    expect(api.revokeAllSessions).toHaveBeenCalledWith("u1");
  });
});
