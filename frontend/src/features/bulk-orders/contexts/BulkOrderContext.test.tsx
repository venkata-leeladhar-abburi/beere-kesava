import React from "react";
import { describe, it, expect } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQueryClient } from "../../../test/render";
import { BulkOrderProvider, useBulkOrders, type BulkOrder } from "./BulkOrderContext";

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
            sareeType: "Test Type", design: "TEST-001", done: 0, total: 10,
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
  it("seeds 6 orders and computes the next order ref from the highest existing number", () => {
    renderHarness();
    expect(screen.getByTestId("count")).toHaveTextContent("6");
    expect(screen.getByTestId("next-ref")).toHaveTextContent("ORD-2026-042");
  });

  it("addBulkOrder prepends the new order and advances nextOrderRef", async () => {
    renderHarness();
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("7"));
    expect(screen.getByTestId("order-ORD-2026-042")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("next-ref")).toHaveTextContent("ORD-2026-043"));
  });

  it("markDispatched sets dispatchStatus and records the invoice id", async () => {
    renderHarness();
    fireEvent.click(screen.getByText("Dispatch"));
    await waitFor(() =>
      expect(screen.getByTestId("order-ORD-2026-041")).toHaveTextContent("dispatched"),
    );
  });

  it("recordPayment accumulates amountPaid across multiple calls", async () => {
    renderHarness();
    fireEvent.click(screen.getByText("Pay"));
    await waitFor(() =>
      expect(screen.getByTestId("order-ORD-2026-041")).toHaveTextContent("paid=5000"),
    );
    fireEvent.click(screen.getByText("Pay"));
    await waitFor(() =>
      expect(screen.getByTestId("order-ORD-2026-041")).toHaveTextContent("paid=10000"),
    );
  });

  it("tallyOrder marks the order as tallied", async () => {
    renderHarness();
    fireEvent.click(screen.getByText("Tally"));
    await waitFor(() =>
      expect(screen.getByTestId("order-ORD-2026-041")).toHaveTextContent("tallied=true"),
    );
  });
});
