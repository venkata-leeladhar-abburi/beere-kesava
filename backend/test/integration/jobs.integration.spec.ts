/**
 * The scheduled-job slot claim against real Postgres. The unique (job, slot)
 * index is what stops the server's own timer and the GitHub Actions trigger
 * from running a job twice; a mocked Prisma cannot prove that.
 */
import { JobRunner } from "../../src/jobs/job-runner.service";
import { createTestApp, TestApp, unique } from "../utils/test-app";

describe("Scheduled jobs (integration)", () => {
  let testApp: TestApp;
  let runner: JobRunner;

  beforeAll(async () => {
    testApp = await createTestApp();
    runner = testApp.app.get(JobRunner);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("runs a slot exactly once when several triggers race for it", async () => {
    const slot = `it-${unique()}`;
    let runs = 0;
    const job = async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true };
    };

    const outcomes = await Promise.all(
      Array.from({ length: 5 }, (_, i) => runner.run("ops-alerts", slot, `racer-${i}`, job)),
    );

    expect(runs).toBe(1);
    expect(outcomes.filter((o) => o.outcome === "succeeded")).toHaveLength(1);
    expect(outcomes.filter((o) => o.outcome === "skipped")).toHaveLength(4);
  });

  it("retries a failed slot, then gives up after three attempts", async () => {
    const slot = `it-${unique()}`;
    const failing = () => Promise.reject(new Error("upstream down"));

    for (let attempt = 1; attempt <= 3; attempt++) {
      expect((await runner.run("ops-alerts", slot, "test", failing)).outcome).toBe("failed");
    }
    expect((await runner.run("ops-alerts", slot, "test", failing)).outcome).toBe("skipped");

    const row = await testApp.prisma.jobRun.findUniqueOrThrow({
      where: { job_slot: { job: "ops-alerts", slot } },
    });
    expect(row).toMatchObject({ status: "FAILED", attempts: 3, error: "upstream down" });
  });

  it("POST /jobs/tick is closed without the shared secret", async () => {
    process.env.JOBS_TRIGGER_SECRET = "it-secret";
    try {
      expect((await testApp.http.post("/jobs/tick")).status).toBe(401);
      const ok = await testApp.http.post("/jobs/tick").set("x-jobs-secret", "it-secret");
      expect(ok.status).toBe(200);
      expect(ok.body.data).toHaveProperty("outcomes");
    } finally {
      delete process.env.JOBS_TRIGGER_SECRET;
    }
  });
});
