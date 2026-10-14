import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppException } from "../../common/errors";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;
  let superCanActivate: jest.SpyInstance;

  const buildContext = (): ExecutionContext =>
    ({
      getHandler: () => ({}) as any,
      getClass: () => ({}) as any,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    // AuthGuard("jwt") base class calls into passport internals we don't want
    // to exercise here — stub the prototype method so we can assert on
    // whether our override calls it.
    superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), "canActivate")
      .mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("allows the request through without invoking passport when the route is @Public()", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);

    const result = guard.canActivate(buildContext());

    expect(result).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it("delegates to the passport JWT strategy when the route is not public", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(false);

    void guard.canActivate(buildContext());

    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });

  it("delegates to the passport JWT strategy when no @Public metadata is set at all", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    void guard.canActivate(buildContext());

    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });

  describe("handleRequest", () => {
    const codeOf = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return { status: (e as AppException).getStatus(), code: (e as AppException).code };
      }
      throw new Error("expected a throw");
    };

    it("passes an ended session through with its own code", () => {
      const ended = new AppException(401, "AUTH_SESSION_EXPIRED", "You were signed out.");
      expect(codeOf(() => guard.handleRequest(ended, false, undefined))).toEqual({
        status: 401,
        code: "AUTH_SESSION_EXPIRED",
      });
    });

    it("reports a database failure as a retryable 503, not a sign-out", () => {
      expect(codeOf(() => guard.handleRequest(new Error("connection terminated"), false, undefined))).toEqual({
        status: 503,
        code: "UPSTREAM_UNAVAILABLE",
      });
    });

    it("still reports a missing or garbage token as AUTH_REQUIRED", () => {
      expect(codeOf(() => guard.handleRequest(null, false, new Error("jwt malformed")))).toEqual({
        status: 401,
        code: "AUTH_REQUIRED",
      });
    });
  });
});
