import { WarpRequestsService } from "./warp-requests.service";

describe("WarpRequestsService.list (weaver self-scoping)", () => {
  let prisma: any;
  let service: WarpRequestsService;

  beforeEach(() => {
    prisma = {
      warpRequest: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new WarpRequestsService(prisma, {} as any, { recordAction: jest.fn() } as any);
  });

  it("filters by weaverId when the controller passes one (WEAVER-role caller)", async () => {
    await service.list(undefined, "weaver-42");

    expect(prisma.warpRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { weaverId: "weaver-42" } }),
    );
  });

  it("does not filter by weaverId when none is passed (non-WEAVER caller sees everything)", async () => {
    await service.list(undefined, undefined);

    expect(prisma.warpRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("combines status and weaverId filters when both are supplied", async () => {
    await service.list("PENDING", "weaver-7");

    expect(prisma.warpRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PENDING", weaverId: "weaver-7" } }),
    );
  });
});
