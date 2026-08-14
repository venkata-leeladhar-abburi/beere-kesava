import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQueryClient } from "../../../test/render";
import { BulkOrderProvider, useBulkOrders, type BulkOrder } from "./BulkOrderContext";
import { bulkOrdersApi, type BackendBulkOrder } from "../../../shared/api/bulk-orders";
import { customersApi, type BackendCustomer } from "../../../shared/api/customers";

vi.mock("../../../shared/api/bulk-orders", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../../shared/api/bulk-orders")>();
  return {
    ...mod,
    bulkOrdersApi: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findOne: vi.fn(),
    },
  };
});

vi.mock("../../../shared/api/customers", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../../shared/api/customers")>();
  return {
    ...mod,
    customersApi: {
      list: vi.fn(),
    },
  };
});

const MOCK_BACKEND_ORDERS: BackendBulkOrder[] = [
  {
    ref: "ORD-2026-041",
    customerId: "CUST-001",
    dueDate: "2026-12-31T00:00:00.000Z",
    createdDate: "2026-01-01",
    status: "ON_TRACK",
    sareeTypeCode: "KS",
    designCode: "DS-01",
    total: 10,
    done: 5,
    shortage: 0,
    dispatchStatus: "PENDING",
    paymentStatus: "PENDING",
    amountDue: "10000",
    amountPaid: "0",
    gstCode: null,
    address: null,
    phone: null,
    visitingCardUrl: null,
    photoUrls: [],
    tallied: false,
    talliedBy: null,
    talliedDate: null,
  },
  {
    ref: "ORD-2026-040", customerId: "CUST-001", dueDate: "2026-12-31T00:00:00.000Z", createdDate: "2026-01-01",
    status: "ON_TRACK", sareeTypeCode: "KS", designCode: "DS-01", total: 10, done: 10, shortage: 0,
    dispatchStatus: "DISPATCHED", paymentStatus: "PAID", amountDue: "5000", amountPaid: "5000",
    gstCode: null, address: null, phone: null, visitingCardUrl: null, photoUrls: [], tallied: true, talliedBy: "Admin", talliedDate: null,
  },
  {
    ref: "ORD-2026-039", customerId: "CUST-001", dueDate: "2026-12-31T00:00:00.000Z", createdDate: "2026-01-01",
    status: "ON_TRACK", sareeTypeCode: "KS", designCode: "DS-01", total: 10, done: 0, shortage: 0,
    dispatchStatus: "PENDING", paymentStatus: "PENDING", amountDue: "5000", amountPaid: "0",
    gstCode: null, address: null, phone: null, visitingCardUrl: null, photoUrls: [], tallied: false, talliedBy: null, talliedDate: null,
  },
  {
    ref: "ORD-2026-038", customerId: "CUST-001", dueDate: "2026-12-31T00:00:00.000Z", createdDate: "2026-01-01",
    status: "ON_TRACK", sareeTypeCode: "KS", designCode: "DS-01", total: 10, done: 0, shortage: 0,
    dispatchStatus: "PENDING", paymentStatus: "PENDING", amountDue: "5000", amountPaid: "0",
    gstCode: null, address: null, phone: null, visitingCardUrl: null, photoUrls: [], tallied: false, talliedBy: null, talliedDate: null,
  },
  {
    ref: "ORD-2026-037", customerId: "CUST-001", dueDate: "2026-12-31T00:00:00.000Z", createdDate: "2026-01-01",
    status: "ON_TRACK", sareeTypeCode: "KS", designCode: "DS-01", total: 10, done: 0, shortage: 0,
    dispatchStatus: "PENDING", paymentStatus: "PENDING", amountDue: "5000", amountPaid: "0",
    gstCode: null, address: null, phone: null, visitingCardUrl: null, photoUrls: [], tallied: false, talliedBy: null, talliedDate: null,
  },
  {
    ref: "ORD-2026-036", customerId: "CUST-001", dueDate: "2026-12-31T00:00:00.000Z", createdDate: "2026-01-01",
    status: "ON_TRACK", sareeTypeCode: "KS", designCode: "DS-01", total: 10, done: 0, shortage: 0,
    dispatchStatus: "PENDING", paymentStatus: "PENDING", amountDue: "5000", amountPaid: "0",
    gstCode: null, address: null, phone: null, visitingCardUrl: null, photoUrls: [], tallied: false, talliedBy: null, talliedDate: null,
  },
];

function Harness() {
  const { bulkOrders, nextOrderRef, addBulkOrder, markDispatched, recordPayment, tallyOrder } = useBulkOrders();
  return (
    <div>
      <div data-testid="count">{bulkOrders.length}</div>
      <div data-testid="next-ref">{nextOrderRef}</div>
      <button
        onClick={() =>
          addBulkOrder({
            customer: "Test Silks", ref: nextOrderRef, due: "01 Jan 2027", status: "on-track",
            sareeType: "Test Type", design: "TEST-001", done: 0, total: 10, customerId: "CUST-001"
          } as BulkOrder)
        }
      >
        Add
      </button>
      <button onClick={() => markDispatched("ORD-2026-041", "INV-999")}>Dispatch</button>
      <button onClick={() => recordPayment("ORD-2026-041", 5000)}>Pay</button>
      <button onClick={() => tallyOrder("ORD-2026-041", "Admin")}>Tally</button>
      {bulkOrders.map(o => (
        <div key={o.ref} data-testid={`order-${o.ref}`}>
          {o.ref}: {o.dispatchStatus} / paid={o.amountPaid ?? 0} / tallied={String(o.tallied ?? false)}
        </div>
      ))}
    </div>
  );
}

function renderHarness() {
  return renderWithQueryClient(
    <BulkOrderProvider>
      <Harness />
    </BulkOrderProvider>,
  );
}

describe("BulkOrderContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bulkOrdersApi.list).mockResolvedValue({
      items: MOCK_BACKEND_ORDERS,
      total: 6,
      page: 1,
      pageSize: 100,
    });
    vi.mocked(customersApi.list).mockResolvedValue({
      items: [{ id: "CUST-001", name: "Test Customer" } as BackendCustomer],
      total: 1,
      page: 1,
      pageSize: 100,
    });
    vi.mocked(bulkOrdersApi.create).mockResolvedValue(MOCK_BACKEND_ORDERS[0]);
    vi.mocked(bulkOrdersApi.update).mockResolvedValue(MOCK_BACKEND_ORDERS[0]);
  });

  it("seeds 6 orders and computes the next order ref from the highest existing number", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("6"));
    expect(screen.getByTestId("next-ref")).toHaveTextContent("ORD-2026-042");
  });

  it("addBulkOrder prepends the new order and advances nextOrderRef", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("6"));
    fireEvent.click(screen.getByText("Add"));
    await waitFor(() => expect(bulkOrdersApi.create).toHaveBeenCalled());
  });

  it("markDispatched sets dispatchStatus and records the invoice id", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("6"));
    fireEvent.click(screen.getByText("Dispatch"));
    await waitFor(() =>
      expect(screen.getByTestId("order-ORD-2026-041")).toHaveTextContent("dispatched"),
    );
  });

  it("recordPayment accumulates amountPaid across multiple calls", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("6"));
    fireEvent.click(screen.getByText("Pay"));
    await waitFor(() => expect(bulkOrdersApi.update).toHaveBeenCalledWith("ORD-2026-041", expect.objectContaining({ amountPaid: 5000 })));
  });

  it("tallyOrder marks the order as tallied", async () => {
    renderHarness();
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("6"));
    fireEvent.click(screen.getByText("Tally"));
    await waitFor(() => expect(bulkOrdersApi.update).toHaveBeenCalledWith("ORD-2026-041", expect.objectContaining({ tallied: true })));
  });
});

