import { notificationsStub } from "../common/testing/notifications.stub";
import { SalesService } from "./sales.service";
import { SalesChannel } from "../generated/prisma/client";

/**
 * Shop staff never choose a firm — a retail sale is booked to whichever firm is
 * currently the active retail firm, at the moment it is rung up.
 */
describe("SalesService — active retail firm", () => {
  let prisma: any;
  let service: SalesService;

  beforeEach(() => {
    prisma = { firm: { findFirst: jest.fn().mockResolvedValue(null) } };
    service = new SalesService(prisma, {} as any, {} as any, notificationsStub());
  });

  const link = (channel: SalesChannel) =>
    (service as any).retailFirmLink(channel) as Promise<Record<string, unknown>>;

  it("stamps the active firm onto a retail sale, marked automatic", async () => {
    prisma.firm.findFirst.mockResolvedValue({ id: "FIRM-001" });

    await expect(link(SalesChannel.RETAIL)).resolves.toMatchObject({
      firmId: "FIRM-001",
      firmLinkedAuto: true,
    });
  });

  it("leaves the sale unconnected when no firm is active", async () => {
    await expect(link(SalesChannel.RETAIL)).resolves.toEqual({});
  });

  it("never touches wholesale — those reach a firm via the dispatch invoice", async () => {
    prisma.firm.findFirst.mockResolvedValue({ id: "FIRM-001" });

    await expect(link(SalesChannel.WHOLESALE)).resolves.toEqual({});
    expect(prisma.firm.findFirst).not.toHaveBeenCalled();
  });
});
