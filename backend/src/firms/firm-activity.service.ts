import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { creditedAmount } from "../purchases/purchases.service";
import { loadSupplierAllocation } from "../purchases/supplier-allocation";

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
  /** The payments that settled it — what, when, how, and from which firm. */
  settlements: FirmSettlement[];
}

/** One payment's share of a document. */
export interface FirmSettlement {
  paymentId: string;
  date: string;
  amount: number;
  method: string | null;
  utr: string | null;
  /** Firm the money came from; null when the payment named none. */
  fromFirmId: string | null;
  fromFirmName: string | null;
  /** LINKED — the payment named this document; GENERAL — a payment against
   *  no particular document, applied to the oldest open ones first. */
  appliedAs: "LINKED" | "GENERAL";
}

/** Where (part of) a payment went. */
export interface FirmPaymentApplication {
  documentRef: string;
  amount: number;
  /** Firm the document is booked to — may differ from the paying firm. */
  documentFirmId: string | null;
  documentFirmName: string | null;
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
  method: string | null;
  utr: string | null;
  recordedBy: string | null;
  /** The documents this payment settled, and how much went to each. */
  appliedTo: FirmPaymentApplication[];
  /** Paid beyond everything owed — an advance held against future bills. */
  unapplied: number;
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
    /** Paid against those documents — from this firm or any other. */
    paid: number;
    outstanding: number;
    /** Money this firm itself paid to (or received from) the party — can
     *  cover documents booked to another firm. */
    paidFromFirm: number;
    /** Most recent document or payment, yyyy-mm-dd. */
    lastActivity: string;
  };
}

const num = (v: unknown): number => Number(v ?? 0);
const round2 = (v: number): number => Math.round(v * 100) / 100;
const actor = (u: { firstName: string; lastName: string } | null | undefined): string | null =>
  u ? `${u.firstName} ${u.lastName}`.trim() : null;
const recordedBySelect = { select: { firstName: true, lastName: true } } as const;
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
          vendorBills: {
            include: {
              payments: { select: { id: true, amount: true, date: true, method: true, utr: true, firmId: true } },
            },
          },
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
          sareeLines: { select: { price: true, quantity: true, returnedQuantity: true } },
        },
      }),
      this.prisma.dispatchRecord.findMany({
        where: { firmId },
        include: {
          customer: { select: { name: true } },
          invoice: {
            include: {
              payments: { select: { id: true, amount: true, date: true, method: true, utr: true, firmId: true } },
            },
          },
        },
      }),
      this.prisma.weaverPayment.findMany({
        where: { firmId },
        include: { weaver: { select: { name: true } }, recordedBy: recordedBySelect },
      }),
      this.prisma.vendorPayment.findMany({
        where: { firmId },
        include: {
          vendor: { select: { name: true } },
          bill: { select: { purchaseOrder: { select: { poNumber: true, firmId: true } } } },
          recordedBy: recordedBySelect,
        },
      }),
      this.prisma.supplierPayment.findMany({
        where: { firmId },
        include: { supplier: { select: { name: true } }, recordedBy: recordedBySelect },
      }),
      this.prisma.invoicePayment.findMany({
        where: { firmId },
        include: {
          invoice: { include: { customer: { select: { name: true } }, dispatch: { select: { firmId: true } } } },
          recordedBy: recordedBySelect,
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

    // Every supplier this firm bought from or paid: their payments are
    // allocated across all their purchases, whichever firm each is booked to,
    // so "settled" here matches the Supplier Payments page exactly.
    const [firms, allocation] = await Promise.all([
      this.prisma.firm.findMany({ select: { id: true, firmName: true } }),
      loadSupplierAllocation(this.prisma, [
        ...purchases.flatMap((p) => (p.supplierId ? [p.supplierId] : [])),
        ...supplierPayments.map((p) => p.supplierId),
      ]),
    ]);
    const firmName = (id: string | null | undefined) =>
      id ? (firms.find((f) => f.id === id)?.firmName ?? id) : null;
    const settlement = (
      p: { id: string; date: Date; amount: unknown; method?: string | null; utr?: string | null; firmId: string | null },
      appliedAs: FirmSettlement["appliedAs"],
      amount = num(p.amount),
    ): FirmSettlement => ({
      paymentId: p.id,
      date: iso(p.date),
      amount: round2(amount),
      method: p.method ?? null,
      utr: p.utr || null,
      fromFirmId: p.firmId,
      fromFirmName: firmName(p.firmId),
      appliedAs,
    });

    const documents: FirmDocument[] = [];

    for (const po of purchaseOrders) {
      const amount = num(po.totalValue);
      const poPayments = po.vendorBills.flatMap((bill) => bill.payments);
      const paid = poPayments.reduce((s, p) => s + num(p.amount), 0);
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
        settlements: poPayments.map((p) => settlement(p, "LINKED")),
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
    const unallocatedByVendor = new Map<string, { payment: (typeof vendorPayments)[number]; left: number }[]>();
    for (const p of [...vendorPayments].sort((a, b) => a.date.getTime() - b.date.getTime())) {
      if (p.billId) continue;
      const pool = unallocatedByVendor.get(p.vendorId) ?? [];
      pool.push({ payment: p, left: num(p.amount) });
      unallocatedByVendor.set(p.vendorId, pool);
    }
    const vendorApplied = new Map<string, FirmPaymentApplication[]>();

    const adhocReceipts = grnReceipts
      .filter((grn) => grn.purchaseOrders.length === 0)
      .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

    for (const grn of adhocReceipts) {
      const amount = grn.items.reduce((s, i) => s + num(i.totalPrice), 0);
      let paid = 0;
      const grnSettlements: FirmSettlement[] = [];
      for (const slot of unallocatedByVendor.get(grn.vendorId) ?? []) {
        const take = Math.min(slot.left, amount - paid);
        if (take <= 0) continue;
        slot.left -= take;
        paid += take;
        grnSettlements.push(settlement(slot.payment, "GENERAL", take));
        const list = vendorApplied.get(slot.payment.id) ?? [];
        list.push({ documentRef: grn.id, amount: round2(take), documentFirmId: firmId, documentFirmName: firm.firmName });
        vendorApplied.set(slot.payment.id, list);
      }
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
        settlements: grnSettlements,
      });
    }

    // An external purchase is settled by the supplier payments linked to it,
    // the same way a purchase order is settled through its bills. Sarees
    // sent back on an approved debit note are credited off the bill, so the
    // amount here is what the purchase costs net of returns.
    const allocatedPayment = new Map(allocation.payments.map((p) => [p.id, p]));
    for (const purchase of purchases) {
      const amount = Math.round(
        (num(purchase.billAmount) - creditedAmount(purchase.billAmount, purchase.sareeLines)) * 100,
      ) / 100;
      // Linked payments plus this purchase's share of general ones.
      const slices = allocation.allocations.filter((a) => a.purchaseId === purchase.id);
      const paid = round2(slices.reduce((s, a) => s + a.amount, 0));
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
        // Every piece sent back settles the bill with nothing paid.
        status: amount <= 0 ? "PAID" : statusOf(amount, paid),
        category: "Saree Purchase",
        settlements: slices.flatMap((a) => {
          const p = allocatedPayment.get(a.paymentId);
          return p ? [settlement(p, p.purchaseId === purchase.id ? "LINKED" : "GENERAL", a.amount)] : [];
        }),
      });
    }

    for (const d of dispatches) {
      const amount = num(d.invoice?.total ?? d.grandTotal);
      const invoicePays = d.invoice?.payments ?? [];
      const paid = invoicePays.reduce((s, p) => s + num(p.amount), 0);
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
        settlements: invoicePays.map((p) => settlement(p, "LINKED")),
      });
    }

    // Where each of this firm's supplier payments went — possibly to purchases
    // booked to another firm (the money still left this firm's account).
    const purchaseFirm = new Map<string, string | null>(
      (await this.prisma.purchase.findMany({
        where: { id: { in: [...new Set(allocation.allocations.map((a) => a.purchaseId))] } },
        select: { id: true, firmId: true },
      })).map((p) => [p.id, p.firmId]),
    );
    const supplierApplied = (paymentId: string): FirmPaymentApplication[] =>
      allocation.allocations
        .filter((a) => a.paymentId === paymentId)
        .map((a) => {
          const docFirm = purchaseFirm.get(a.purchaseId) ?? null;
          return { documentRef: a.purchaseId, amount: a.amount, documentFirmId: docFirm, documentFirmName: firmName(docFirm) };
        });

    const payments: FirmPayment[] = [
      ...weaverPayments.map((p) => ({
        id: p.id,
        type: "WEAVER" as const,
        direction: "EXPENSE" as const,
        reference: p.id,
        party: p.weaver.name,
        partyType: "WEAVER" as const,
        partyId: p.weaverId,
        documentRef: p.batchNo ?? null,
        date: iso(p.paymentDate),
        amount: num(p.amountPaid),
        category: "Weaver Payments",
        method: null,
        utr: p.utrNumber || null,
        recordedBy: actor(p.recordedBy),
        appliedTo: p.batchNo
          ? [{ documentRef: p.batchNo, amount: num(p.amountPaid), documentFirmId: firmId, documentFirmName: firm.firmName }]
          : [],
        unapplied: 0,
      })),
      ...vendorPayments.map((p) => {
        const poNumber = p.bill?.purchaseOrder?.poNumber ?? null;
        const appliedTo: FirmPaymentApplication[] = poNumber
          ? [{
              documentRef: poNumber,
              amount: num(p.amount),
              documentFirmId: p.bill?.purchaseOrder?.firmId ?? null,
              documentFirmName: firmName(p.bill?.purchaseOrder?.firmId),
            }]
          : (vendorApplied.get(p.id) ?? []);
        return {
          id: p.id,
          type: "VENDOR" as const,
          direction: "EXPENSE" as const,
          reference: p.id,
          party: p.vendor.name,
          partyType: "VENDOR" as const,
          partyId: p.vendorId,
          documentRef: poNumber,
          date: iso(p.date),
          amount: num(p.amount),
          category: "Material Purchase",
          method: p.method ?? null,
          utr: p.utr || null,
          recordedBy: actor(p.recordedBy),
          appliedTo,
          unapplied: round2(Math.max(0, num(p.amount) - appliedTo.reduce((s, a) => s + a.amount, 0))),
        };
      }),
      ...supplierPayments.map((p) => {
        const appliedTo = supplierApplied(p.id);
        return {
          id: p.id,
          type: "SUPPLIER" as const,
          direction: "EXPENSE" as const,
          reference: p.id,
          party: p.supplier.name,
          partyType: "SUPPLIER" as const,
          partyId: p.supplierId,
          documentRef: p.purchaseId ?? null,
          date: iso(p.date),
          amount: num(p.amount),
          category: "Saree Purchase",
          method: p.method ?? null,
          utr: p.utr || null,
          recordedBy: actor(p.recordedBy),
          appliedTo,
          unapplied: allocation.unallocatedByPayment.get(p.id) ?? 0,
        };
      }),
      ...invoicePayments.map((p) => {
        const docFirm = p.invoice.dispatch?.firmId ?? null;
        return {
          id: p.id,
          type: "INVOICE" as const,
          direction: "INCOME" as const,
          reference: p.id,
          party: p.invoice.customer.name,
          partyType: "CUSTOMER" as const,
          partyId: p.invoice.customerId,
          documentRef: p.invoice.code ?? null,
          date: iso(p.date),
          amount: num(p.amount),
          category: "Wholesale Sale",
          method: p.method ?? null,
          utr: p.utr || null,
          recordedBy: actor(p.recordedBy),
          appliedTo: [{
            documentRef: p.invoice.code ?? p.invoiceId,
            amount: num(p.amount),
            documentFirmId: docFirm,
            documentFirmName: firmName(docFirm),
          }],
          unapplied: 0,
        };
      }),
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
        method: null,
        utr: null,
        recordedBy: null,
        appliedTo: [],
        unapplied: 0,
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
          totals: { documentCount: 0, amount: 0, paid: 0, outstanding: 0, paidFromFirm: 0, lastActivity: "" },
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
      connection.totals.paid += document.paidAmount;
      connection.totals.outstanding += document.outstanding;
      touch(connection, document.date);
    }
    for (const payment of payments) {
      if (payment.type === "RETAIL_SALE") continue;
      const connection = connectionFor(payment);
      if (!connection) continue;
      connection.payments.push(payment);
      connection.totals.paidFromFirm += payment.amount;
      touch(connection, payment.date);
    }

    for (const c of byParty.values()) {
      c.totals.amount = round2(c.totals.amount);
      c.totals.paid = round2(c.totals.paid);
      c.totals.outstanding = round2(c.totals.outstanding);
      c.totals.paidFromFirm = round2(c.totals.paidFromFirm);
    }

    return {
      firmId,
      connections: [...byParty.values()].sort((a, b) =>
        b.totals.lastActivity.localeCompare(a.totals.lastActivity),
      ),
    };
  }
}
