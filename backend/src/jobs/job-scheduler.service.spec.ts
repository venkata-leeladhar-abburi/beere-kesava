import { JobScheduler } from "./job-scheduler.service";

describe("JobScheduler.tick", () => {
  const services = () => ({
    overdue: { runScan: jest.fn().mockResolvedValue({}) },
    ops: { runScan: jest.fn().mockResolvedValue({}) },
    reports: { checkDueSchedules: jest.fn().mockResolvedValue({ due: 0, failed: [] }) },
    watchdog: { run: jest.fn().mockResolvedValue({ problems: [] }) },
  });

  const build = (outcomeFor: (job: string, fn: () => Promise<unknown>) => Promise<any>) => {
    const s = services();
    const runner: any = {
      run: jest.fn((job, slot, _t, fn) => outcomeFor(job, fn).then((o) => ({ job, slot, ...o }))),
    };
    return {
      scheduler: new JobScheduler(
        runner,
        s.overdue as any,
        s.ops as any,
        s.reports as any,
        s.watchdog as any,
      ),
      runner,
      s,
    };
  };

  it("runs only what is due at that moment, in order", async () => {
    // 01:15 UTC = 06:45 IST: overdue-payments is due, ops-alerts (07:30) and watchdog (09:00) are not.
    const { scheduler, runner } = build(async (_job, fn) => ({
      outcome: "succeeded",
      summary: await fn(),
    }));

    const result = await scheduler.tick("external", new Date("2026-10-14T01:15:00Z"));

    expect(runner.run.mock.calls.map((c: any[]) => c[0])).toEqual([
      "overdue-payments",
      "scheduled-reports",
    ]);
    expect(result.ok).toBe(true);
  });

  it("is not ok when a job fails", async () => {
    const { scheduler } = build((job) =>
      Promise.resolve(
        job === "scheduled-reports" ? { outcome: "failed", error: "x" } : { outcome: "skipped" },
      ),
    );

    expect((await scheduler.tick("external", new Date("2026-10-14T05:00:00Z"))).ok).toBe(false);
  });

  it("is not ok when the watchdog found a problem", async () => {
    const { scheduler } = build((job) =>
      Promise.resolve(
        job === "watchdog"
          ? { outcome: "succeeded", summary: { problems: ["1 WhatsApp message(s) failed"] } }
          : { outcome: "skipped" },
      ),
    );

    expect((await scheduler.tick("external", new Date("2026-10-14T05:00:00Z"))).ok).toBe(false);
  });
});
