import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JobsController } from "./jobs.controller";

describe("JobsController", () => {
  const scheduler: any = { tick: jest.fn().mockResolvedValue({ ok: true, outcomes: [] }) };
  const controller = new JobsController(scheduler);
  const original = process.env.JOBS_TRIGGER_SECRET;

  afterEach(() => {
    process.env.JOBS_TRIGGER_SECRET = original;
    jest.clearAllMocks();
  });

  it("does not exist while no secret is configured", () => {
    delete process.env.JOBS_TRIGGER_SECRET;
    expect(() => controller.tick("anything")).toThrow(NotFoundException);
  });

  it("refuses a missing or wrong secret", () => {
    process.env.JOBS_TRIGGER_SECRET = "s3cret-value";
    expect(() => controller.tick(undefined)).toThrow(UnauthorizedException);
    expect(() => controller.tick("wrong")).toThrow(UnauthorizedException);
    expect(scheduler.tick).not.toHaveBeenCalled();
  });

  it("ticks with the right secret", async () => {
    process.env.JOBS_TRIGGER_SECRET = "s3cret-value";
    await expect(controller.tick("s3cret-value")).resolves.toEqual({ ok: true, outcomes: [] });
    expect(scheduler.tick).toHaveBeenCalledWith("external");
  });
});
