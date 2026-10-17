import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ReportPeriodProvider,
  useRegisterExport,
  useReportPeriod,
  usePeriodSplit,
} from "./PeriodContext";
import { ReportTabNav } from "./sections/ReportTabNav";
import type { ReportTabKey } from "./types";

vi.mock("@/contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/AuthContext")>();
  return { ...actual, useAuth: () => ({ user: { id: "u1", accessLevel: "FULL" } }) };
});
vi.mock("../../../contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../contexts/AuthContext")>();
  return { ...actual, useAuth: () => ({ user: { id: "u1", accessLevel: "FULL" } }) };
});

const SALES = [
  { id: "a", date: "2026-10-03T10:00:00" },
  { id: "b", date: "2026-10-15T10:00:00" },
  { id: "c", date: "2026-09-10T10:00:00" }, // inside 1–17 Sep
  { id: "d", date: "2026-09-25T10:00:00" }, // after the like-for-like prior window
];

/** A stand-in report section: registers its rows and shows what it is comparing. */
function FakeSection() {
  const split = usePeriodSplit(SALES, (s) => s.date);
  const { compareActive } = useReportPeriod();
  useRegisterExport(
    useMemo(
      () => ({
        name: "Fake Report",
        headers: ["id"],
        rows: split.cur.map((s) => [s.id]),
        ready: true,
      }),
      [split]
    )
  );
  return (
    <div data-testid="split">
      {split.cur.length} now{compareActive ? ` / ${split.prev.length} before` : ""}
    </div>
  );
}

function setup(initialTab: ReportTabKey = "retail") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReportPeriodProvider initialTab={initialTab}>
        <ReportTabNav />
        <FakeSection />
      </ReportPeriodProvider>
    </QueryClientProvider>
  );
}

describe("Reports period comparison", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 17, 10, 30));
  });
  afterEach(() => vi.useRealTimers());

  it("starts on All Time with every record and no comparison", () => {
    setup();
    expect(screen.getByTestId("split")).toHaveTextContent("4 now");
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("moves to This Month when comparing from All Time, cut to the same days", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toBeChecked();
    // October so far (2 sales) against 1–17 September (1 sale, not the 25th).
    expect(screen.getByTestId("split")).toHaveTextContent("2 now / 1 before");
    expect(screen.getAllByText("1–17 Oct 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1–17 Sep 2026").length).toBeGreaterThan(0);
  });

  it("switches the comparison off on a live report", () => {
    setup("overdue");
    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByText(/period and comparison don.t apply/i)).toBeInTheDocument();
  });

  it("enables Download once the section has registered rows", () => {
    setup();
    const button = screen.getByRole("button", { name: /Download Fake Report for All time/ });
    expect(button).toBeEnabled();
  });

  it("explains a disabled Download when there is nothing to export", () => {
    const client = new QueryClient();
    function EmptySection() {
      useRegisterExport(useMemo(() => ({ name: "Empty Report", headers: ["id"], rows: [] }), []));
      return null;
    }
    render(
      <QueryClientProvider client={client}>
        <ReportPeriodProvider>
          <ReportTabNav />
          <EmptySection />
        </ReportPeriodProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole("button", { name: "No records for All time to export." })
    ).toBeDisabled();
  });

  it("labels the download with the comparison it will include", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("switch"));
    expect(
      screen.getByRole("button", { name: /with the comparison against 1–17 Sep 2026/ })
    ).toBeEnabled();
  });
});
