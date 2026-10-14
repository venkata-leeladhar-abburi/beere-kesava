import { WatchdogService } from "./watchdog.service";

const NOW = new Date("2026-10-14T04:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

describe("WatchdogService", () => {
  let prisma: any;
  let notifications: any;
  let watchdog: WatchdogService;

  beforeEach(() => {
    prisma = {
      whatsAppMessage: { groupBy: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
      jobRun: {
        findFirst: jest.fn().mockResolvedValue({ startedAt: hoursAgo(3) }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      scheduledReport: { findMany: jest.fn().mockResolvedValue([]) },
    };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    watchdog = new WatchdogService(prisma, notifications);
  });

  it("stays quiet when everything ran and nothing failed", async () => {
    await expect(watchdog.run(NOW)).resolves.toMatchObject({ problems: [] });
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it("reports failed WhatsApp sends with the latest error", async () => {
    prisma.whatsAppMessage.groupBy.mockResolvedValue([
      { kind: "REPORT", _count: { _all: 2 } },
      { kind: "RETAIL_BILL", _count: { _all: 1 } },
    ]);
    prisma.whatsAppMessage.findFirst.mockResolvedValue({ errorMessage: "Template paused" });

    const report = await watchdog.run(NOW);

    expect(report.whatsappFailures).toEqual({ REPORT: 2, RETAIL_BILL: 1 });
    expect(report.problems[0]).toContain("3 WhatsApp message(s) failed");
    expect(report.problems[0]).toContain("Template paused");
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN", type: "SYSTEM_HEALTH_ALERT" }),
    );
  });

  it("flags a daily job that has not succeeded in over a day", async () => {
    prisma.jobRun.findFirst.mockImplementation(({ where }: any) =>
      Promise.resolve(
        where.job === "ops-alerts" ? { startedAt: hoursAgo(30) } : { startedAt: hoursAgo(2) },
      ),
    );

    const report = await watchdog.run(NOW);

    expect(report.missedJobs).toEqual(["ops-alerts"]);
  });

  it("flags a job that has never run at all", async () => {
    prisma.jobRun.findFirst.mockResolvedValue(null);

    expect((await watchdog.run(NOW)).missedJobs).toEqual(["overdue-payments", "ops-alerts"]);
  });

  it("flags jobs that gave up and reports that were never delivered", async () => {
    prisma.jobRun.findMany.mockResolvedValue([
      { job: "scheduled-reports", slot: "2026-10-14T08:00" },
    ]);
    prisma.scheduledReport.findMany.mockResolvedValue([{ reportName: "Retail Sales Report" }]);

    const report = await watchdog.run(NOW);

    expect(report.exhaustedJobs).toEqual(["scheduled-reports [2026-10-14T08:00]"]);
    expect(report.lateReports).toEqual(["Retail Sales Report"]);
    expect(report.problems).toHaveLength(2);
  });
});
