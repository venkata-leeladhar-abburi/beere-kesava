import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Firm activity — the "why is this number what it is" view behind a firm's
 * ledger.
 *
 * A firm is named on real business documents (purchase orders, goods
 * receipts, external purchases, wholesale dispatch invoices) long before any money
 * actually moves. Those documents were previously invisible on the Firms
 * page, which showed only manually-typed FirmFinancialEntry rows — so a firm
 * carrying ₹4L of raised purchase orders read as ₹0 until somebody
 * re-keyed it by hand.
 *
 * This service reads both halves and keeps them clearly separated:
 *
 *   • COMMITTED — a document names this firm, money has not moved yet.
 *     Contributes to `pendingIncome` / `pendingExpense`.
 *   • REALIZED  — money actually moved (a payment row), or an accountant
 *     recorded it manually. Contributes to `realizedIncome` /
 *     `realizedExpense`, which is what the firm's net balance is built from.
 *
 * A part-paid document splits across both: its paid portion is realized (and
 * already counted by the payment rows themselves), its unpaid remainder
 * stays committed. This is why documents report `amount` and `paidAmount`
 * separately rather than a single figure.
 */

export type FirmActivityDirection = "INCOME" | "EXPENSE";
export type FirmActivityStatus = "PENDING" | "PARTIAL" | "PAID";

export type FirmDocumentType =
  | "PURCHASE_ORDER"
  | "GOODS_RECEIPT"
  | "EXTERNAL_PURCHASE"
  | "DISPATCH_INVOICE";

/** Who a document or payment is with. A firm is never tied to a party as
 *  such — only through the documents and payments that name both. */
export type FirmPartyType = "SUPPLIER" | "VENDOR" | "CUSTOMER" | "WEAVER";

export type FirmPaymentType = "WEAVER" | "VENDOR" | "SUPPLIER" | "INVOICE" | "RETAIL_SALE";

export interface FirmDocument {
  id: string;
  type: FirmDocumentType;
  direction: FirmActivityDirection;
  /** Human-facing document code — PO-2026-004, GRN-2026-011, INV-WHL001-3. */
  reference: string;
  /** Who the document is with — vendor, supplier or customer name. */
  party: string;
  partyType: FirmPartyType;
  /** The party's record id; null when the document names nobody on file (an
   *  unregistered supplier, a shop transfer). */
  partyId: string | null;
  date: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: FirmActivityStatus;
  /** Which ledger bucket this lands in once paid. */
  category: string;
}

export interface FirmPayment {
  id: string;
  type: FirmPaymentType;
  direction: FirmActivityDirection;
  reference: string;
  party: string;
  partyType: FirmPartyType;
  partyId: string | null;
  /** The document this payment settles (PO number, purchase id, invoice
   *  code); null for a payment made against no particular document. */
  documentRef: string | null;
  date: string;
  amount: number;
  category: string;
}

/** One supplier, vendor or wholesale customer this firm has dealt with, and
 *  everything that passed between them. */
export interface FirmConnection {
  partyType: Exclude<FirmPartyType, "WEAVER">;
  partyId: string;
  name: string;
  documents: FirmDocument[];
  payments: FirmPayment[];
  totals: {
    documentCount: number;
    /** Value of every document raised between the firm and this party. */
    amount: number;
    /** Money that actually moved between this firm and the party. */
    paid: number;
    outstanding: number;
    /** Most recent document or payment, yyyy-mm-dd. */
    lastActivity: string;
  };
}

const num = (v: unknown): number => Number(v ?? 0);
const iso = (d: Date | null | undefined): string =>
  (d ?? new Date()).toISOString().slice(0, 10);

function statusOf(amount: number, paid: number): FirmActivityStatus {
  if (paid <= 0) return "PENDING";
  // Rounded to paise before comparing: Decimal→Number on two separately
  // summed columns otherwise leaves a sub-cent residue that reads as
  // "PARTIAL" on a fully-settled document.
  if (Math.round((amount - paid) * 100) <= 0) return "PAID";
  return "PARTIAL";
}

@Injectable()
export class FirmActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivity(firmId: string) {
    const firm = await this.prisma.firm.findUnique({ where: { id: firmId } });
    if (!firm) throw new NotFoundException(`Firm ${firmId} not found`);

    const [
      purchaseOrders,
      grnReceipts,
      purchases,
      dispatches,
      weaverPayments,
      vendorPayments,
      supplierPayments,
      invoicePayments,
      retailSales,
    ] = await Promise.all([
      // A rejected purchase order is a commitment that was called off — it
      // is not money this firm owes, so it never reaches the payable figure.
      this.prisma.purchaseOrder.findMany({
        where: { firmId, status: { not: "REJECTED" } },
        include: {
          vendor: { select: { name: true } },
          vendorBills: { include: { payments: { select: { amount: true } } } },
        },
      }),
      // A GRN raised against a purchase order restates the same money the PO
      // already reports, so only ad-hoc receipts (no PO behind them) are
      // listed as documents of their own.
      this.prisma.grnReceipt.findMany({
        where: { firmId },
        include: {
          vendor: { select: { name: true } },
          items: { select: { totalPrice: true } },
          purchaseOrders: { select: { id: true } },
        },
      }),
      this.prisma.purchase.findMany({
        where: { firmId },
        include: {
          supplier: { select: { name: true } },
          payments: { select: { amount: true } },
        },
      }),
      this.prisma.dispatchRecord.findMany({
        where: { firmId },
        include: {
          customer: { select: { name: true } },
          invoice: { include: { payments: { select: { amount: true } } } },
        },
      }),
      this.prisma.weaverPayment.findMany({
        where: { firmId },
        include: { weaver: { select: { name: true } } },
      }),
      this.prisma.vendorPayment.findMany({
        where: { firmId },
        include: {
          vendor: { select: { name: true } },
          bill: { select: { purchaseOrder: { select: { poNumber: true } } } },
        },
      }),
      this.prisma.supplierPayment.findMany({
        where: { firmId },
        include: { supplier: { select: { name: true } } },
      }),
      this.prisma.invoicePayment.findMany({
        where: { firmId },
        include: {
          invoice: { include: { customer: { select: { name: true } } } },
        },
      }),
      // Counter sales an accountant has connected to this firm. Money already
      // changed hands at the till, so these are realized income the moment
      // they are linked — never committed/pending.
      this.prisma.saleRecord.findMany({
        where: { firmId, channel: "RETAIL" },
        include: { customer: { select: { name: true } } },
      }),
    ]);

    const documents: FirmDocument[] = [];

    for (const po of purchaseOrders) {
      const amount = num(po.totalValue);
      const paid = po.vendorBills.reduce(
        (sum, bill) => sum + bill.payments.reduce((s, p) => s + num(p.amount), 0),
        0,
      );
      documents.push({
        id: po.id,
        type: "PURCHASE_ORDER",
        direction: "EXPENSE",
        reference: po.poNumber,
        party: po.vendor.name,
        partyType: "VENDOR",
        partyId: po.vendorId,
        date: iso(po.createdAt),
        amount,
        paidAmount: paid,
        outstanding: Math.max(0, amount - paid),
        status: statusOf(amount, paid),
        category: "Material Purchase",
      });
    }

    // An ad-hoc goods receipt has nothing to settle it against: vendor bills
    // hang off purchase orders, and a GRN raised without a PO has no bill, so
    // no payment can ever point at it. Left alone it would sit at its full
    // value as "payable" forever, while the vendor payment that actually
    // cleared it counted as an expense paid — the same rupee reported twice.
    //
    // So unallocated vendor payments (`billId` null — money paid to a vendor
    // that settles no specific bill) are applied to that vendor's ad-hoc
    // receipts oldest-first. Payments that DO name a bill are excluded: those
    // already settle a purchase order above, and would otherwise pay twice.
    const unallocatedByVendor = new Map<string, number>();
    for (const p of vendorPayments) {
      if (p.billId) continue;
      unallocatedByVendor.set(
        p.vendorId,
        (unallocatedByVendor.get(p.vendorId) ?? 0) + num(p.amount),
      );
    }

    const adhocReceipts = grnReceipts
      .filter((grn) => grn.purchaseOrders.length === 0)
      .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

    for (const grn of adhocReceipts) {
      const amount = grn.items.reduce((s, i) => s + num(i.totalPrice), 0);
      const pool = unallocatedByVendor.get(grn.vendorId) ?? 0;
      const paid = Math.min(pool, amount);
      unallocatedByVendor.set(grn.vendorId, pool - paid);
      documents.push({
        id: grn.id,
        type: "GOODS_RECEIPT",
        direction: "EXPENSE",
        reference: grn.id,
        party: grn.vendor.name || grn.supplierName,
        partyType: "VENDOR",
        partyId: grn.vendorId,
        date: iso(grn.receivedDate),
        amount,
        paidAmount: paid,
        outstanding: Math.max(0, amount - paid),
        status: statusOf(amount, paid),
        category: "Material Purchase",
      });
    }

    // An external purchase is settled by the supplier payments linked to it,
    // the same way a purchase order is settled through its bills.
    for (const purchase of purchases) {
      const amount = num(purchase.billAmount);
      const paid = purchase.payments.reduce((s, p) => s + num(p.amount), 0);
      documents.push({
        id: purchase.id,
        type: "EXTERNAL_PURCHASE",
        direction: "EXPENSE",
        reference: purchase.id,
        party: purchase.supplier?.name ?? purchase.supplierName ?? "—",
        partyType: "SUPPLIER",
        partyId: purchase.supplierId,
        date: iso(purchase.date),
        amount,
        paidAmount: paid,
        outstanding: Math.max(0, amount - paid),
        status: statusOf(amount, paid),
        category: "Saree Purchase",
      });
    }

    for (const d of dispatches) {
      const amount = num(d.invoice?.total ?? d.grandTotal);
      const paid = d.invoice
        ? d.invoice.payments.reduce((s, p) => s + num(p.amount), 0)
        : 0;
      documents.push({
        id: d.id,
        type: "DISPATCH_INVOICE",
        direction: "INCOME",
        reference: d.invoice?.code ?? d.invoiceNumber ?? d.lrNumber ?? d.id,
        party: d.customer?.name ?? "—",
        partyType: "CUSTOMER",
        partyId: d.customerId,
        date: iso(d.invoiceDate ?? d.dispatchDate),
        amount,
        paidAmount: paid,
        outstanding: Math.max(0, amount - paid),
        status: statusOf(amount, paid),
        category: d.type === "SHOP" ? "Retail Sale" : "Wholesale Sale",
      });
    }

    const payments: FirmPayment[] = [
      ...weaverPayments.map((p) => ({
        id: p.id,
        type: "WEAVER" as const,
        direction: "EXPENSE" as const,
        reference: p.utrNumber ?? p.id,
        party: p.weaver.name,
        partyType: "WEAVER" as const,
        partyId: p.weaverId,
        documentRef: p.batchNo ?? null,
        date: iso(p.paymentDate),
        amount: num(p.amountPaid),
        category: "Weaver Payments",
      })),
      ...vendorPayments.map((p) => ({
        id: p.id,
        type: "VENDOR" as const,
        direction: "EXPENSE" as const,
        reference: p.utr ?? p.id,
        party: p.vendor.name,
        partyType: "VENDOR" as const,
        partyId: p.vendorId,
        documentRef: p.bill?.purchaseOrder?.poNumber ?? null,
        date: iso(p.date),
        amount: num(p.amount),
        category: "Material Purchase",
      })),
      ...supplierPayments.map((p) => ({
        id: p.id,
        type: "SUPPLIER" as const,
        direction: "EXPENSE" as const,
        reference: p.utr ?? p.id,
        party: p.supplier.name,
        partyType: "SUPPLIER" as const,
        partyId: p.supplierId,
        documentRef: p.purchaseId ?? null,
        date: iso(p.date),
        amount: num(p.amount),
        category: "Saree Purchase",
      })),
      ...invoicePayments.map((p) => ({
        id: p.id,
        type: "INVOICE" as const,
        direction: "INCOME" as const,
        reference: p.utr ?? p.invoice.code ?? p.id,
        party: p.invoice.customer.name,
        partyType: "CUSTOMER" as const,
        partyId: p.invoice.customerId,
        documentRef: p.invoice.code ?? null,
        date: iso(p.date),
        amount: num(p.amount),
        category: "Wholesale Sale",
      })),
      ...retailSales.map((sale) => ({
        id: sale.saleRef,
        type: "RETAIL_SALE" as const,
        direction: "INCOME" as const,
        reference: sale.saleRef,
        party: sale.customer?.name ?? "Walk-in Customer",
        partyType: "CUSTOMER" as const,
        partyId: sale.customerId,
        documentRef: null,
        date: iso(sale.date),
        amount: num(sale.amount),
        category: "Retail Sale",
      })),
    ];

    const manualEntries = await this.prisma.firmFinancialEntry.findMany({
      where: { firmId },
      orderBy: { date: "desc" },
    });

    const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);

    const realizedIncome =
      sum(payments.filter((p) => p.direction === "INCOME")) +
      manualEntries
        .filter((e) => e.kind === "INCOME" || (e.kind === "MISC" && e.category !== "Misc Expense"))
        .reduce((s, e) => s + num(e.amount), 0);

    const realizedExpense =
      sum(payments.filter((p) => p.direction === "EXPENSE")) +
      manualEntries
        .filter((e) => e.kind === "EXPENSE" || (e.kind === "MISC" && e.category === "Misc Expense"))
        .reduce((s, e) => s + num(e.amount), 0);

    const pendingIncome = documents
      .filter((d) => d.direction === "INCOME")
      .reduce((s, d) => s + d.outstanding, 0);
    const pendingExpense = documents
      .filter((d) => d.direction === "EXPENSE")
      .reduce((s, d) => s + d.outstanding, 0);

    return {
      firmId,
      documents: documents.sort((a, b) => b.date.localeCompare(a.date)),
      payments: payments.sort((a, b) => b.date.localeCompare(a.date)),
      totals: {
        realizedIncome,
        realizedExpense,
        net: realizedIncome - realizedExpense,
        pendingIncome,
        pendingExpense,
      },
    };
  }

  /**
   * The suppliers, vendors and wholesale customers this firm has dealt with.
   *
   * Nobody is connected to a firm by a setting: a party appears here because
   * a purchase, purchase order or invoice was raised under this firm with
   * them, or this firm paid or was paid by them. The same supplier can
   * therefore appear under several firms, each with only its own share.
   * Weavers and counter sales are left out — they are not trading parties.
   */
  async getConnections(firmId: string): Promise<{ firmId: string; connections: FirmConnection[] }> {
    const { documents, payments } = await this.getActivity(firmId);
    const byParty = new Map<string, FirmConnection>();

    const connectionFor = (row: { partyType: FirmPartyType; partyId: string | null; party: string }) => {
      if (row.partyType === "WEAVER" || !row.partyId) return undefined;
      const key = `${row.partyType}:${row.partyId}`;
      let connection = byParty.get(key);
      if (!connection) {
        connection = {
          partyType: row.partyType,
          partyId: row.partyId,
          name: row.party,
          documents: [],
          payments: [],
          totals: { documentCount: 0, amount: 0, paid: 0, outstanding: 0, lastActivity: "" },
        };
        byParty.set(key, connection);
      }
      return connection;
    };
    const touch = (connection: FirmConnection, date: string) => {
      if (date > connection.totals.lastActivity) connection.totals.lastActivity = date;
    };

    for (const document of documents) {
      const connection = connectionFor(document);
      if (!connection) continue;
      connection.documents.push(document);
      connection.totals.documentCount += 1;
      connection.totals.amount += document.amount;
      connection.totals.outstanding += document.outstanding;
      touch(connection, document.date);
    }
    for (const payment of payments) {
      if (payment.type === "RETAIL_SALE") continue;
      const connection = connectionFor(payment);
      if (!connection) continue;
      connection.payments.push(payment);
      connection.totals.paid += payment.amount;
      touch(connection, payment.date);
    }

    return {
      firmId,
      connections: [...byParty.values()].sort((a, b) =>
        b.totals.lastActivity.localeCompare(a.totals.lastActivity),
      ),
    };
  }
}
