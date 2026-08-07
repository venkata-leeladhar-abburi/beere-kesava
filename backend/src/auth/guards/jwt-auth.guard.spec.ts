import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
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

    guard.canActivate(buildContext());

    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });

  it("delegates to the passport JWT strategy when no @Public metadata is set at all", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    guard.canActivate(buildContext());

    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });
});
