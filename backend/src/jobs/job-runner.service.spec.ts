import { Prisma } from "../generated/prisma/client";
import { JobRunner, MAX_ATTEMPTS } from "./job-runner.service";

const conflict = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
  });

describe("JobRunner", () => {
  let prisma: any;
  let notifications: any;
  let runner: JobRunner;

  beforeEach(() => {
    prisma = {
      jobRun: {
        create: jest.fn().mockResolvedValue({ id: "r1", attempts: 1 }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue({ id: "r1", attempts: 2 }),
      },
    };
    notifications = { create: jest.fn().mockResolvedValue({}) };
    runner = new JobRunner(prisma, notifications);
  });

  it("runs the job once it has claimed the slot, and records success", async () => {
    const fn = jest.fn().mockResolvedValue({ flagged: 2 });

    await expect(runner.run("ops-alerts", "2026-10-14", "timer", fn)).resolves.toEqual({
      job: "ops-alerts",
      slot: "2026-10-14",
      outcome: "succeeded",
      summary: { flagged: 2 },
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(prisma.jobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUCCEEDED" }) }),
    );
  });

  it("skips a slot another trigger already holds", async () => {
    prisma.jobRun.create.mockRejectedValue(conflict());
    const fn = jest.fn();

    await expect(runner.run("ops-alerts", "2026-10-14", "external", fn)).resolves.toMatchObject({
      outcome: "skipped",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("takes a failed slot over only while it has attempts left", async () => {
    prisma.jobRun.create.mockRejectedValue(conflict());
    prisma.jobRun.updateMany.mockResolvedValue({ count: 1 });
    const fn = jest.fn().mockResolvedValue(null);

    await expect(runner.run("ops-alerts", "2026-10-14", "external", fn)).resolves.toMatchObject({
      outcome: "succeeded",
    });
    expect(prisma.jobRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ attempts: { lt: MAX_ATTEMPTS } }),
      }),
    );
  });

  it("records a failure and tells admins, without throwing", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("db timeout"));

    await expect(runner.run("overdue-payments", "2026-10-14", "timer", fn)).resolves.toEqual({
      job: "overdue-payments",
      slot: "2026-10-14",
      outcome: "failed",
      error: "db timeout",
    });
    expect(prisma.jobRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED", error: "db timeout" }),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "ADMIN",
        type: "SYSTEM_JOB_FAILED",
        payload: expect.objectContaining({ job: "overdue-payments", willRetry: true }),
      }),
    );
  });
});
