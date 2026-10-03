import { describe, expect, it } from "vitest";
import { acquireSlot, isPriorityRequest } from "./requestQueue";

describe("requestQueue", () => {
  it("runs at most 4 at once and lets scans jump the queue", async () => {
    const releases = await Promise.all([1, 2, 3, 4].map(() => acquireSlot(false)));
    const order: string[] = [];
    const background = acquireSlot(false).then((r) => { order.push("background"); return r; });
    const scan = acquireSlot(true).then((r) => { order.push("scan"); return r; });

    await Promise.resolve();
    expect(order).toEqual([]); // all 4 slots busy

    releases[0]();
    const scanRelease = await scan;
    expect(order).toEqual(["scan"]); // scan ran before the older background read

    scanRelease();
    (await background)();
    expect(order).toEqual(["scan", "background"]);
    releases.slice(1).forEach((r) => r());
  });

  it("treats scans, auth and writes as priority; plain GETs as background", () => {
    expect(isPriorityRequest("/scan/ABC", "GET")).toBe(true);
    expect(isPriorityRequest("/auth/verify-otp", "POST")).toBe(true);
    expect(isPriorityRequest("/customers", "POST")).toBe(true);
    expect(isPriorityRequest("/customers", "GET")).toBe(false);
    expect(isPriorityRequest("/customers", undefined)).toBe(false);
  });
});
