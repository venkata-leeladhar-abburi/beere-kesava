import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCashFlow() {
    const invoices = await this.prisma.invoice.findMany({
      select: { invoiceDate: true, paid: true },
    });
    const weaverPayments = await this.prisma.weaverPayment.findMany({
      select: { paymentDate: true, amountPaid: true },
    });
    const vendorPayments = await this.prisma.vendorPayment.findMany({
      select: { date: true, amount: true },
    });

    const monthsMap: Record<string, { month: string; income: number; expenses: number }> = {};
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      monthsMap[key] = { month: key, income: 0, expenses: 0 };
    }

    invoices.forEach((inv) => {
      const key = new Date(inv.invoiceDate).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].income += Number(inv.paid) / 100000;
      }
    });

    weaverPayments.forEach((p) => {
      const key = new Date(p.paymentDate).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].expenses += Number(p.amountPaid) / 100000;
      }
    });

    vendorPayments.forEach((vp) => {
      const key = new Date(vp.date).toLocaleString("en-US", { month: "short" });
      if (monthsMap[key]) {
        monthsMap[key].expenses += Number(vp.amount) / 100000;
      }
    });

    return { items: Object.values(monthsMap) };
  }

  async getProductionTrends() {
    const sarees = await this.prisma.saree.findMany({
      select: { createdAt: true, qcPassed: true },
    });

    const passedCount = sarees.filter((s) => s.qcPassed === true).length;
    const pendingCount = sarees.filter((s) => s.qcPassed === false || s.qcPassed === null).length;

    return {
      passed: passedCount,
      pending: pendingCount,
      total: sarees.length,
    };
  }

  async getRevenueSplit() {
    const sales = await this.prisma.saleRecord.findMany({
      select: { channel: true, totalAmount: true },
    });

    let retail = 0;
    let wholesale = 0;

    sales.forEach((s) => {
      if (s.channel === "RETAIL") retail += Number(s.totalAmount);
      else wholesale += Number(s.totalAmount);
    });

    return {
      retail,
      wholesale,
      total: retail + wholesale,
    };
  }

  async getTopWeavers() {
    const payments = await this.prisma.weaverPayment.findMany({
      include: { weaver: true },
    });

    const weaverTotals: Record<string, { name: string; amount: number }> = {};

    payments.forEach((p) => {
      if (!p.weaver) return;
      const wId = p.weaver.id;
      if (!weaverTotals[wId]) {
        weaverTotals[wId] = { name: p.weaver.name, amount: 0 };
      }
      weaverTotals[wId].amount += Number(p.amountPaid);
    });

    const sorted = Object.values(weaverTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { items: sorted };
  }
}
