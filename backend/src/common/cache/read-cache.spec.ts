import { ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter } from "events";
import { lastValueFrom, of } from "rxjs";
import { ReadCacheInterceptor } from "./read-cache.interceptor";
import { ReadCacheService } from "./read-cache.service";

function ctx(method: string, url: string, user: object | null, res = new EventEmitter()) {
  const req = { method, originalUrl: url, path: url.split("?")[0], user };
  return {
    getType: () => "http",
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

describe("ReadCacheInterceptor", () => {
  const user = { id: "u1", role: "ADMIN", accessLevel: "FULL" };
  let cache: ReadCacheService;
  let interceptor: ReadCacheInterceptor;
  let calls: number;
  const handler = () => ({ handle: () => { calls++; return of({ n: calls }); } });

  beforeEach(() => {
    cache = new ReadCacheService({ get: () => undefined } as unknown as ConfigService);
    interceptor = new ReadCacheInterceptor(cache);
    calls = 0;
  });

  const run = (method: string, url: string, u: object | null = user, res?: EventEmitter) =>
    lastValueFrom(interceptor.intercept(ctx(method, url, u, res), handler()) as never);

  it("serves repeat reads of a cached route from memory", async () => {
    await run("GET", "/inventory");
    await expect(run("GET", "/inventory")).resolves.toEqual({ n: 1 });
    expect(calls).toBe(1);
  });

  it("never shares a response between different users or roles", async () => {
    await run("GET", "/inventory");
    await run("GET", "/inventory", { ...user, id: "u2" });
    await run("GET", "/inventory", { ...user, role: "SHOP" });
    expect(calls).toBe(3);
  });

  it("drops everything the moment any write happens", async () => {
    await run("GET", "/scan/ABC");
    const res = new EventEmitter();
    await run("POST", "/sales", user, res);
    await run("GET", "/scan/ABC");
    expect(calls).toBe(3); // read, write, read-again (not served from cache)
  });

  it("does not store a read that began before a write finished", () => {
    const version = cache.currentVersion();
    cache.bump(); // a write lands while that read was in flight
    cache.set("k", { stale: true }, 30, version);
    expect(cache.get("k")).toBeNull();
  });

  it("ignores uncached routes and unauthenticated requests", async () => {
    await run("GET", "/notifications");
    await run("GET", "/notifications");
    await run("GET", "/inventory", null);
    await run("GET", "/inventory", null);
    expect(calls).toBe(4);
  });

  it("expires entries after their TTL", async () => {
    jest.useFakeTimers();
    await run("GET", "/inventory");
    jest.advanceTimersByTime(31_000);
    await run("GET", "/inventory");
    jest.useRealTimers();
    expect(calls).toBe(2);
  });
});
