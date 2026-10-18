import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StepOTP } from "./StepOTP";
import { authApi } from "../../../shared/api/auth";

vi.mock("../../../shared/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../shared/api/auth")>();
  return { ...actual, authApi: { ...actual.authApi, requestOtp: vi.fn(), verifyOtp: vi.fn() } };
});

const advance = async (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
  }
};

describe("StepOTP resend", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(authApi.requestOtp).mockResolvedValue({} as never);
  });
  afterEach(() => vi.useRealTimers());

  it("counts down from five minutes and holds Resend for 30 seconds", async () => {
    render(<StepOTP phone="9014952056" onVerify={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/Code expires in: 5:00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend in 30s/ })).toBeDisabled();
    await advance(30);
    expect(screen.getByRole("button", { name: "Resend" })).toBeEnabled();
  });

  it("requests a fresh code and restarts the countdown", async () => {
    render(<StepOTP phone="9014952056" onVerify={vi.fn()} onBack={vi.fn()} />);
    await advance(40);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    });
    expect(authApi.requestOtp).toHaveBeenCalledWith("9014952056");
    expect(screen.getByRole("status")).toHaveTextContent(/new code has been sent/i);
    expect(screen.getByText(/Code expires in: 5:00/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend in 30s/ })).toBeDisabled();
  });

  it("shows the server's reason when a new code cannot be sent", async () => {
    vi.mocked(authApi.requestOtp).mockRejectedValue(
      new Error("This mobile number is not registered.")
    );
    render(<StepOTP phone="9014952056" onVerify={vi.fn()} onBack={vi.fn()} />);
    await advance(30);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    });
    expect(screen.getByText("This mobile number is not registered.")).toBeInTheDocument();
  });
});
