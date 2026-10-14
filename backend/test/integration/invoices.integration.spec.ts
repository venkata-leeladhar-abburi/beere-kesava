/**
 * Invoice payments against real Postgres: Decimal(12, 2) round-tripping, and
 * the conditional update that stops two simultaneous payments from together
 * overpaying an invoice (invoices.service.ts recordPayment).
 */
import { InvoicesService } from "../../src/invoices/invoices.service";
import { createTestApp, TestApp, unique } from "../utils/test-app";

describe("Invoices (integration)", () => {
  let testApp: TestApp;
  let invoices: InvoicesService;

  const newInvoice = async (total: string) => {
    const customer = await testApp.prisma.customer.create({
      data: { name: `IT Wholesale ${unique()}`, type: "WHOLESALE" },
    });
    return testApp.prisma.invoice.create({ data: { customerId: customer.id, total } });
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    invoices = testApp.app.get(InvoicesService);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("settles 300.30 paid as 100.10 + 200.20", async () => {
    const inv = await newInvoice("300.30");

    await invoices.recordPayment(inv.id, { amount: 100.1, method: "UPI" });
    const settled = await invoices.recordPayment(inv.id, { amount: 200.2, method: "UPI" });

    expect(settled.status).toBe("PAID");
    expect(settled.paid.toString()).toBe("300.3");
  });

  it("lets only one of two simultaneous full payments through", async () => {
    const inv = await newInvoice("500.00");

    const results = await Promise.allSettled([
      invoices.recordPayment(inv.id, { amount: 500, method: "UPI" }),
      invoices.recordPayment(inv.id, { amount: 500, method: "CASH" }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const after = await testApp.prisma.invoice.findUniqueOrThrow({
      where: { id: inv.id },
      include: { payments: true },
    });
    expect(after.paid.toString()).toBe("500");
    expect(after.payments).toHaveLength(1);
  });
});
