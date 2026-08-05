import { Injectable } from "@nestjs/common";
import { PurchaseOrderStatus, PurchaseRequestStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type ApprovalQueueItem =
  | { kind: "purchase_order"; id: string; reference: string; createdAt: Date; data: unknown }
  | { kind: "purchase_request"; id: string; reference: string; createdAt: Date; data: unknown };

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(): Promise<ApprovalQueueItem[]> {
    const [purchaseOrders, purchaseRequests] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { status: PurchaseOrderStatus.PENDING },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.purchaseRequest.findMany({
        where: { status: PurchaseRequestStatus.PENDING },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const items: ApprovalQueueItem[] = [
      ...purchaseOrders.map((po) => ({
        kind: "purchase_order" as const,
        id: po.id,
        reference: po.poNumber,
        createdAt: po.createdAt,
        data: po,
      })),
      ...purchaseRequests.map((pr) => ({
        kind: "purchase_request" as const,
        id: pr.id,
        reference: pr.id,
        createdAt: pr.createdAt,
        data: pr,
      })),
    ];

    return items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
