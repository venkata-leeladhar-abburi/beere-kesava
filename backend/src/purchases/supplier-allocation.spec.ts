import { allocateSupplierPayments, AllocationPayment, AllocationPurchase } from "./supplier-allocation";

const purchase = (id: string, owed: number, day: string, firmId: string | null = "FIRM-1"): AllocationPurchase => ({
  id, supplierId: "SUP-1", firmId, date: new Date(day), owed,
});
const payment = (
  id: string, amount: number, day: string, purchaseId: string | null = null, firmId: string | null = "FIRM-1",
): AllocationPayment => ({ id, supplierId: "SUP-1", firmId, purchaseId, date: new Date(day), amount });

describe("allocateSupplierPayments", () => {
  it("spreads a general payment over the oldest open purchases first", () => {
    const { paidByPurchase, unallocatedByPayment } = allocateSupplierPayments(
      [purchase("P2", 400, "2026-02-01"), purchase("P1", 300, "2026-01-01"), purchase("P3", 500, "2026-03-01")],
      [payment("PAY", 500, "2026-03-05")],
    );

    expect(paidByPurchase.get("P1")).toBe(300);
    expect(paidByPurchase.get("P2")).toBe(200);
    expect(paidByPurchase.get("P3")).toBe(0);
    expect(unallocatedByPayment.size).toBe(0);
  });

  it("settles linked payments before spreading general ones, so nothing is paid twice", () => {
    const { paidByPurchase } = allocateSupplierPayments(
      [purchase("P1", 300, "2026-01-01"), purchase("P2", 400, "2026-02-01")],
      [payment("GEN", 400, "2026-01-02"), payment("LINK", 300, "2026-03-01", "P1")],
    );

    expect(paidByPurchase.get("P1")).toBe(300);
    expect(paidByPurchase.get("P2")).toBe(400);
  });

  it("prefers the paying firm's own purchases", () => {
    const { allocations } = allocateSupplierPayments(
      [purchase("OTHER", 300, "2026-01-01", "FIRM-2"), purchase("OWN", 300, "2026-02-01", "FIRM-1")],
      [payment("PAY", 300, "2026-03-01")],
    );

    expect(allocations).toEqual([{ paymentId: "PAY", purchaseId: "OWN", amount: 300 }]);
  });

  it("keeps what's paid beyond everything owed as an advance", () => {
    const { unallocatedByPayment } = allocateSupplierPayments(
      [purchase("P1", 100.1, "2026-01-01")],
      [payment("PAY", 150.3, "2026-01-02")],
    );

    expect(unallocatedByPayment.get("PAY")).toBe(50.2);
  });
});
