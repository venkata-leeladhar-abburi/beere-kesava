/**
 * One-off backfill of the notification feed from records that already exist.
 *
 * The feed is written at the moment an action happens, so until the emitters
 * were added nothing but `po_stock_received` was ever recorded — the console's
 * Weavers, Production, Payments and Shop tabs read empty even though the work
 * they describe demonstrably happened. This walks the real records and writes
 * the notification each one *would* have produced, stamped with that record's
 * own date so the feed reads as history rather than as a burst of "just now".
 *
 * Only events that genuinely occurred are written: a clean QC pass emitted
 * nothing when it happened and emits nothing here either, a batch that is
 * still DRAFT was never finalized, and a material issue that was signed on
 * paper never raised a remote-signature request. Nothing is invented to fill
 * a tab.
 *
 * Idempotent: every row it writes carries `payload.backfilled = true`, and a
 * re-run deletes its own previous output first. Rows written by the live
 * application are matched on their own ids and never duplicated or deleted.
 *
 *   npx ts-node prisma/backfill-notifications.ts           # dry run, writes nothing
 *   npx ts-node prisma/backfill-notifications.ts --commit  # actually writes
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { NotificationTargetType, PrismaClient, UserRole } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COMMIT = process.argv.includes("--commit");

type Planned = {
  targetType: NotificationTargetType;
  role?: UserRole;
  userId?: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

const planned: Planned[] = [];

function forRole(role: UserRole, type: string, createdAt: Date, payload: Record<string, unknown>) {
  planned.push({ targetType: NotificationTargetType.ROLE, role, type, payload, createdAt });
}

function forUser(userId: string | null | undefined, type: string, createdAt: Date, payload: Record<string, unknown>) {
  // A weaver with no portal login has nobody to address — the live emitters
  // no-op in that case (NotificationsService.notifyWeaver), so this does too.
  if (!userId) return;
  planned.push({ targetType: NotificationTargetType.USER, userId, type, payload, createdAt });
}

const n = (v: unknown) => Number(v ?? 0);

async function build() {
  // Weaver id → the User row that can actually receive a notification.
  const weaverUsers = await prisma.user.findMany({
    where: { linkedWeaverId: { not: null } },
    select: { id: true, linkedWeaverId: true },
  });
  const userForWeaver = new Map(weaverUsers.map((u) => [u.linkedWeaverId!, u.id]));

  // ── Weavers & Looms ──────────────────────────────────────────────────
  const warpRequests = await prisma.warpRequest.findMany({ include: { weaver: true } });
  for (const w of warpRequests) {
    forRole(UserRole.ADMIN, "WEAVER_WARP_REQUEST_RAISED", w.requestedAt, {
      warpRequestId: w.id,
      weaverName: w.weaver.name,
      warpType: w.warpType,
      lengthMeters: n(w.lengthMeters),
      loomNumber: w.loomNumber,
    });
    if (w.status === "APPROVED" && w.decidedAt) {
      forUser(userForWeaver.get(w.weaverId), "WEAVER_WARP_REQUEST_APPROVED", w.decidedAt, {
        warpRequestId: w.id,
        warpType: w.warpType,
        lengthMeters: n(w.lengthMeters),
      });
    }
    if (w.status === "REJECTED" && w.decidedAt) {
      forUser(userForWeaver.get(w.weaverId), "WEAVER_WARP_REQUEST_REJECTED", w.decidedAt, {
        warpRequestId: w.id,
        warpType: w.warpType,
        reason: w.notes,
      });
    }
  }

  const rateRequests = await prisma.rateChangeRequest.findMany({ include: { requestedBy: true } });
  for (const r of rateRequests) {
    forRole(UserRole.ADMIN, "WEAVER_RATE_REQUEST_RAISED", r.createdAt, {
      rateRequestId: r.id,
      sareeTypeCode: r.sareeTypeCode,
      requestedByName: `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.trim(),
      oldMakingCharge: n(r.oldMakingCharge),
      newMakingCharge: n(r.newMakingCharge),
    });
    if (r.status !== "PENDING" && r.decidedAt) {
      forUser(
        r.requestedById,
        r.status === "APPROVED" ? "WEAVER_RATE_REQUEST_APPROVED" : "WEAVER_RATE_REQUEST_REJECTED",
        r.decidedAt,
        { rateRequestId: r.id, sareeTypeCode: r.sareeTypeCode, newMakingCharge: n(r.newMakingCharge), reason: r.reason },
      );
    }
  }

  const weaverPayments = await prisma.weaverPayment.findMany({ include: { weaver: true } });
  for (const p of weaverPayments) {
    forUser(userForWeaver.get(p.weaverId), "WEAVER_PAYMENT_PAID", p.paymentDate, {
      weaverPaymentId: p.id,
      weaverName: p.weaver.name,
      amountPaid: n(p.amountPaid),
      utrNumber: p.utrNumber,
    });
  }

  const designDispatches = await prisma.designDispatch.findMany({ where: { recipientType: "WEAVER" } });
  for (const d of designDispatches) {
    forUser(userForWeaver.get(d.recipientId), "WEAVER_DESIGN_ASSIGNED", d.sentAt, {
      designDispatchId: d.id,
      recipientName: d.recipientName,
      instructions: d.instructions,
    });
  }

  // ── Production & Batches ─────────────────────────────────────────────
  const qcRecords = await prisma.qcRecord.findMany({ where: { result: { not: "PASSED" } } });
  for (const q of qcRecords) {
    const type = q.result === "DEFECTIVE" ? "BATCH_QC_FAILED" : "BATCH_QC_SEMI_DEFECT";
    const payload = {
      sareeId: q.sareeId,
      batchId: q.batchId,
      result: q.result,
      defects: q.defects,
      deduction: n(q.deduction),
    };
    forRole(UserRole.ADMIN, type, q.qcDate, payload);
    if (q.weaverId) forUser(userForWeaver.get(q.weaverId), type, q.qcDate, payload);
  }

  // DRAFT batches were never finalized, so nothing was emitted for them.
  // updatedAt is the closest record of when the transition happened.
  const batches = await prisma.batch.findMany({
    where: { status: { not: "DRAFT" } },
    select: { id: true, updatedAt: true, totalCount: true, _count: { select: { rows: true } } },
  });
  for (const b of batches) {
    forRole(UserRole.ADMIN, "BATCH_FINALIZED", b.updatedAt, { batchId: b.id, rowCount: b._count.rows });
  }

  const finishing = await prisma.finishingAssignment.findMany({
    include: { finishingStaff: true },
  });
  for (const f of finishing) {
    if (f.status !== "RETURNED") continue;
    forRole(
      UserRole.ADMIN,
      f.condition === "DAMAGED" ? "FINISHING_RETURN_DAMAGED" : "FINISHING_RETURN_RECEIVED",
      f.updatedAt,
      {
        assignmentId: f.id,
        sareeId: f.sareeId,
        condition: f.condition,
        damageType: f.damageType,
        damageSeverity: f.damageSeverity,
      },
    );
  }

  // ── Raw Materials & Stock ────────────────────────────────────────────
  // po_stock_received is the one type the live app already wrote, so the
  // POs that carry a real row are skipped rather than duplicated.
  const existing = await prisma.notification.findMany({
    where: { type: "po_stock_received" },
    select: { payload: true },
  });
  const alreadyAnnounced = new Set(
    existing
      .map((e) => (e.payload as { purchaseOrderId?: string } | null)?.purchaseOrderId)
      .filter((id): id is string => !!id),
  );

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: { vendor: true, items: true },
  });
  for (const po of purchaseOrders) {
    forRole(UserRole.SUPERADMIN, "PURCHASE_ORDER_RAISED", po.createdAt, {
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendor.name,
      totalValue: n(po.totalValue),
      urgency: po.urgency,
      itemCount: po.items.length,
    });
    if (po.status === "RECEIVED" && po.grnId && !alreadyAnnounced.has(po.id)) {
      forRole(UserRole.SUPERADMIN, "po_stock_received", po.actualReceivedDate ?? po.createdAt, {
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        vendorName: po.vendor.name,
        grnId: po.grnId,
      });
    }
  }

  const purchaseRequests = await prisma.purchaseRequest.findMany({ include: { requestedBy: true } });
  for (const r of purchaseRequests) {
    forRole(UserRole.SUPERADMIN, "PURCHASE_REQUEST_RAISED", r.createdAt, {
      purchaseRequestId: r.id,
      sareeType: r.sareeType,
      quantity: r.quantity,
      estimatedAmount: r.estimatedAmount ? n(r.estimatedAmount) : null,
      urgency: r.urgency,
      requestedByName: `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.trim(),
    });
    if (r.status !== "PENDING" && r.decidedDate) {
      forUser(
        r.requestedById,
        r.status === "APPROVED" ? "PURCHASE_REQUEST_APPROVED" : "PURCHASE_REQUEST_REJECTED",
        r.decidedDate,
        { purchaseRequestId: r.id, sareeType: r.sareeType, quantity: r.quantity, decisionNote: r.decisionNote },
      );
    }
  }

  const supplierReturns = await prisma.supplierReturnRequest.findMany({ include: { supplier: true } });
  for (const r of supplierReturns) {
    forRole(UserRole.ADMIN, "SUPPLIER_RETURN_RAISED", r.createdAt, {
      supplierReturnId: r.id,
      supplierName: r.supplier.name,
      quantity: r.quantity,
      reason: r.reason,
      purchaseId: r.purchaseId,
    });
    if (r.status !== "PENDING" && r.decidedAt) {
      forUser(r.requestedById, "SUPPLIER_RETURN_DECIDED", r.decidedAt, {
        supplierReturnId: r.id,
        supplierName: r.supplier.name,
        quantity: r.quantity,
        decision: r.status,
        decisionNote: r.decisionNote,
      });
    }
  }

  // Only a REMOTE signature ever raised a request; a paper signature did not.
  const issues = await prisma.materialIssueRecord.findMany({
    where: { signatureMethod: "REMOTE" },
    include: { weaver: true },
  });
  for (const i of issues) {
    if (i.weaverId) {
      forUser(userForWeaver.get(i.weaverId), "material_signature_request", i.issuedAt, {
        recordId: i.id,
        recordKind: "ISSUE",
      });
    }
    if (i.status === "SIGNED" && i.signatureTimestamp) {
      forRole(UserRole.ADMIN, "MATERIAL_SIGNATURE_COMPLETED", i.signatureTimestamp, {
        recordId: i.id,
        recordKind: "ISSUE",
        weaverName: i.weaver?.name ?? null,
      });
    }
  }

  const returns = await prisma.materialReturnRecord.findMany({
    where: { signatureMethod: "REMOTE" },
    include: { weaver: true },
  });
  for (const r of returns) {
    if (r.weaverId) {
      forUser(userForWeaver.get(r.weaverId), "material_signature_request", r.receivedAt, {
        recordId: r.id,
        recordKind: "RETURN",
      });
    }
    if (r.status === "APPROVED" && r.signatureTimestamp) {
      forRole(UserRole.ADMIN, "MATERIAL_SIGNATURE_COMPLETED", r.signatureTimestamp, {
        recordId: r.id,
        recordKind: "RETURN",
        weaverName: r.weaver?.name ?? null,
      });
    }
  }

  const vendors = await prisma.vendor.findMany();
  for (const v of vendors) {
    forRole(UserRole.ADMIN, "VENDOR_ADDED", v.createdAt, {
      vendorId: v.id,
      code: v.code,
      name: v.name,
      contactName: v.contactName,
      city: v.city,
      phone: v.phone,
    });
  }

  const suppliers = await prisma.supplier.findMany();
  for (const s of suppliers) {
    forRole(UserRole.ADMIN, "SUPPLIER_ADDED", s.createdAt, {
      supplierId: s.id,
      code: s.code,
      name: s.name,
      contactName: s.contactName,
      city: s.city,
      phone: s.phone,
    });
  }

  // ── Payments & Invoices ──────────────────────────────────────────────
  const invoices = await prisma.invoice.findMany({ include: { customer: true, payments: true } });
  for (const inv of invoices) {
    forRole(UserRole.ACCOUNTANT, "INVOICE_CREATED", inv.invoiceDate, {
      invoiceId: inv.id,
      invoiceNumber: inv.code,
      customerName: inv.customer.name,
      total: n(inv.total),
      dueDate: inv.dueDate,
    });

    // Each recorded payment, in order, so a part payment reads as a part
    // payment and only the one that settled the invoice reads as settled.
    const ordered = [...inv.payments].sort((a, b) => a.date.getTime() - b.date.getTime());
    let running = 0;
    for (const pay of ordered) {
      running += n(pay.amount);
      const settled = running >= n(inv.total);
      forRole(
        UserRole.ACCOUNTANT,
        settled ? "INVOICE_PAID" : "INVOICE_PAYMENT_RECEIVED",
        pay.date,
        {
          invoiceId: inv.id,
          invoiceNumber: inv.code,
          amount: n(pay.amount),
          paid: running,
          total: n(inv.total),
          outstanding: n(inv.total) - running,
        },
      );
    }

    if (inv.status === "OVERDUE") {
      forRole(UserRole.ACCOUNTANT, "invoice_overdue", inv.dueDate ?? inv.invoiceDate, {
        invoiceId: inv.id,
        invoiceNumber: inv.code,
        customerId: inv.customerId,
        dueDate: inv.dueDate,
        outstanding: n(inv.total) - n(inv.paid),
      });
    }
  }

  const vendorBills = await prisma.vendorBill.findMany({
    include: { vendor: true, purchaseOrder: true },
  });
  for (const b of vendorBills) {
    forRole(UserRole.ACCOUNTANT, "VENDOR_BILL_CREATED", b.createdAt, {
      vendorBillId: b.id,
      vendorName: b.vendor.name,
      amount: n(b.amount),
      poNumber: b.purchaseOrder?.poNumber ?? null,
      dueDate: b.dueDate,
    });
    const ordered = b.purchaseOrder ? n(b.purchaseOrder.totalValue) : 0;
    if (b.purchaseOrder && ordered > 0 && Math.abs(ordered - n(b.amount)) >= 1) {
      const payload = {
        vendorBillId: b.id,
        vendorName: b.vendor.name,
        poNumber: b.purchaseOrder.poNumber,
        billedAmount: n(b.amount),
        orderedValue: ordered,
        difference: Number((n(b.amount) - ordered).toFixed(2)),
      };
      forRole(UserRole.ACCOUNTANT, "VENDOR_BILL_MISMATCH", b.createdAt, payload);
      forRole(UserRole.SUPERADMIN, "VENDOR_BILL_MISMATCH", b.createdAt, payload);
    }
  }

  const vendorPayments = await prisma.vendorPayment.findMany({ include: { vendor: true } });
  for (const p of vendorPayments) {
    forRole(UserRole.ACCOUNTANT, "VENDOR_PAYMENT_PAID", p.date, {
      vendorPaymentId: p.id,
      vendorName: p.vendor.name,
      amount: n(p.amount),
      billId: p.billId,
    });
  }

  const supplierPayments = await prisma.supplierPayment.findMany({ include: { supplier: true } });
  for (const p of supplierPayments) {
    forRole(UserRole.ACCOUNTANT, "SUPPLIER_PAYMENT_PAID", p.date, {
      supplierPaymentId: p.id,
      supplierName: p.supplier.name,
      amount: n(p.amount),
      purchaseId: p.purchaseId,
    });
  }

  // ── Shop & Dispatch ──────────────────────────────────────────────────
  const bulkOrders = await prisma.bulkOrder.findMany({ include: { customer: true } });
  for (const o of bulkOrders) {
    const payload = {
      bulkOrderRef: o.ref,
      customerName: o.customer.name,
      total: n(o.total),
      dueDate: o.dueDate,
      designCode: o.designCode,
    };
    forRole(UserRole.ADMIN, "BULK_ORDER_PLACED", o.createdDate, payload);
    forRole(UserRole.ACCOUNTANT, "BULK_ORDER_PLACED", o.createdDate, payload);

    // Individual part payments were never itemised on the order, so only the
    // standing paid total can be stated — dated to the order, not invented.
    if (n(o.amountPaid) > 0) {
      forRole(UserRole.ACCOUNTANT, "BULK_ORDER_PAYMENT_RECEIVED", o.talliedDate ?? o.createdDate, {
        bulkOrderRef: o.ref,
        customerName: o.customer.name,
        amount: n(o.amountPaid),
        amountPaid: n(o.amountPaid),
        amountDue: n(o.amountDue),
        paymentStatus: o.paymentStatus,
      });
    }
    if (o.paymentStatus !== "PAID" && o.dueDate < new Date()) {
      forRole(UserRole.ACCOUNTANT, "bulk_order_payment_overdue", o.dueDate, {
        bulkOrderRef: o.ref,
        customerId: o.customerId,
        dueDate: o.dueDate,
        outstanding: n(o.amountDue) - n(o.amountPaid),
      });
    }
  }

  const dispatches = await prisma.dispatchRecord.findMany({
    where: { type: "SHOP" },
    select: {
      id: true,
      dispatchDate: true,
      challanNumber: true,
      lrNumber: true,
      _count: { select: { sarees: true } },
    },
  });
  for (const d of dispatches) {
    forRole(UserRole.SHOP, "SHOP_DISPATCH_INCOMING_STOCK", d.dispatchDate, {
      dispatchId: d.id,
      challanNumber: d.challanNumber,
      lrNumber: d.lrNumber,
      sareeCount: d._count.sarees,
    });
  }

  const receipts = await prisma.shopReceipt.findMany({
    include: { items: true, dispatch: { select: { id: true, challanNumber: true } } },
  });
  for (const r of receipts) {
    const counts = {
      received: r.items.filter((i) => i.status === "RECEIVED").length,
      damaged: r.items.filter((i) => i.status === "DAMAGED").length,
      missing: r.items.filter((i) => i.status === "MISSING").length,
    };
    forRole(
      UserRole.ADMIN,
      counts.damaged || counts.missing ? "SHOP_RECEIPT_DISCREPANCY_ALERT" : "SHOP_DISPATCH_RECEIVED",
      r.receivedAt,
      {
        receiptId: r.id,
        code: r.code,
        dispatchId: r.dispatch.id,
        challanNumber: r.dispatch.challanNumber,
        ...counts,
      },
    );
  }

  const sales = await prisma.saleRecord.findMany({ include: { customer: true } });
  for (const s of sales) {
    forRole(UserRole.ADMIN, "SHOP_SALE_RECORDED", s.date, {
      saleRef: s.saleRef,
      sareeId: s.sareeId,
      channel: s.channel,
      customerName: s.customer.name,
      amount: n(s.amount),
    });
  }

  const saleReturns = await prisma.returnRecord.findMany();
  for (const r of saleReturns) {
    forRole(UserRole.ADMIN, "SHOP_SALE_RETURNED", r.createdAt, {
      returnRef: r.returnRef,
      sareeId: r.sareeId,
      reason: r.reason,
      refundAmount: r.refundAmount ? n(r.refundAmount) : null,
      restocked: r.restocked,
    });
  }
}

async function main() {
  await build();
  planned.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const byType = new Map<string, number>();
  for (const p of planned) byType.set(p.type, (byType.get(p.type) ?? 0) + 1);

  console.table(
    [...byType.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
  );
  console.log(`\n${planned.length} notification(s) planned.`);

  if (!COMMIT) {
    console.log("Dry run — nothing written. Re-run with --commit to apply.");
    return;
  }

  const removed = await prisma.notification.deleteMany({
    where: { payload: { path: ["backfilled"], equals: true } },
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} row(s) from a previous backfill.`);
  }

  await prisma.notification.createMany({
    data: planned.map((p) => ({
      targetType: p.targetType,
      role: p.role,
      userId: p.userId,
      type: p.type,
      payload: { ...p.payload, backfilled: true },
      createdAt: p.createdAt,
      // Historical events are not new news: they land read, so the unread
      // badge keeps meaning "something happened that you have not seen".
      readAt: new Date(),
    })),
  });

  console.log(`Wrote ${planned.length} notification(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
