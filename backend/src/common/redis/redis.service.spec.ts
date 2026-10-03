import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

const config = (values: Record<string, string>) => ({ get: (k: string) => values[k] }) as unknown as ConfigService;

describe("RedisService", () => {
  afterEach(() => jest.restoreAllMocks());

  it("is a no-op miss when not configured", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const redis = new RedisService(config({}));
    expect(redis.enabled).toBe(false);
    await expect(redis.get("k")).resolves.toBeNull();
    await redis.set("k", "v", 10);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails open on errors and then skips Redis briefly", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
    const redis = new RedisService(config({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io/", UPSTASH_REDIS_REST_TOKEN: "t" }));
    await expect(redis.get("k")).resolves.toBeNull();
    await expect(redis.get("k")).resolves.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the result of a successful command", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: () => Promise.resolve({ result: "NEW" }) } as Response);
    const redis = new RedisService(config({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" }));
    await expect(redis.get("k")).resolves.toBe("NEW");
  });
});
