import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Firm activity — the "why is this number what it is" view behind a firm's
 * ledger.
 *
 * A firm is named on real business documents (purchase orders, goods
 * receipts, quotations, wholesale dispatch invoices) long before any money
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
  | "QUOTATION"
  | "DISPATCH_INVOICE";

export type FirmPaymentType = "WEAVER" | "VENDOR" | "SUPPLIER" | "INVOICE" | "RETAIL_SALE";

export interface FirmDocument {
  id: string;
  type: FirmDocumentType;
  direction: FirmActivityDirection;
  /** Human-facing document code — PO-2026-004, GRN-2026-011, INV-WHL001-3. */
  reference: string;
  /** Who the document is with — vendor, supplier or customer name. */
  party: string;
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
  date: string;
  amount: number;
  category: string;
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
      quotations,
      dispatches,
      weaverPayments,
      vendorPayments,
      supplierPayments,
      invoicePayments,
      retailSales,
    ] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { firmId },
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
      this.prisma.quotation.findMany({
        where: { firmId },
        include: { customer: { select: { name: true } } },
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
        include: { vendor: { select: { name: true } } },
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
        date: iso(po.createdAt),
        amount,
        paidAmount: paid,
        outstanding: Math.max(0, amount - paid),
        status: statusOf(amount, paid),
        category: "Material Purchase",
      });
    }

    for (const grn of grnReceipts) {
      if (grn.purchaseOrders.length > 0) continue;
      const amount = grn.items.reduce((s, i) => s + num(i.totalPrice), 0);
      documents.push({
        id: grn.id,
        type: "GOODS_RECEIPT",
        direction: "EXPENSE",
        reference: grn.id,
        party: grn.vendor.name || grn.supplierName,
        date: iso(grn.receivedDate),
        amount,
        paidAmount: 0,
        outstanding: amount,
        status: "PENDING",
        category: "Material Purchase",
      });
    }

    for (const q of quotations) {
      // A quotation is an offer, never a receivable — it is listed so the
      // firm's pipeline is visible, but it is deliberately excluded from
      // pending income (see totals below) so a quote that never converts
      // can't inflate the firm's expected earnings.
      const amount = num(q.grandTotal);
      documents.push({
        id: q.id,
        type: "QUOTATION",
        direction: "INCOME",
        reference: q.quotationNumber,
        party: q.customer.name,
        date: iso(q.quotationDate),
        amount,
        paidAmount: 0,
        outstanding: amount,
        status: "PENDING",
        category: "Wholesale Sale",
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
        date: iso(p.date),
        amount: num(p.amount),
        category: "Material Purchase",
      })),
      ...invoicePayments.map((p) => ({
        id: p.id,
        type: "INVOICE" as const,
        direction: "INCOME" as const,
        reference: p.utr ?? p.invoice.code ?? p.id,
        party: p.invoice.customer.name,
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

    // Quotations are excluded — an offer is not yet a receivable.
    const pendingIncome = documents
      .filter((d) => d.direction === "INCOME" && d.type !== "QUOTATION")
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
        quotedPipeline: documents
          .filter((d) => d.type === "QUOTATION")
          .reduce((s, d) => s + d.amount, 0),
      },
    };
  }
}
