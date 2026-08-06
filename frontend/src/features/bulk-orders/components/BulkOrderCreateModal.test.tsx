import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkOrderCreateModal } from "./BulkOrderCreateModal";
import { WHOLESALE_CUSTOMERS } from "./WholesaleCustomerSelectSection";

function setup() {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <BulkOrderCreateModal open onClose={onClose} onSubmit={onSubmit} nextRef="ORD-2026-050" />,
  );
  return { onSubmit, onClose };
}

describe("BulkOrderCreateModal validation", () => {
  it("blocks submit and shows all three errors when the form is empty", () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByText("✓ Create Bulk Order"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Please select a wholesale customer")).toBeInTheDocument();
    expect(screen.getByText("Quantity must be at least 1")).toBeInTheDocument();
    expect(screen.getByText("Please select a delivery deadline")).toBeInTheDocument();
  });

  it("rejects a quantity of 0 or a non-numeric quantity", () => {
    setup();
    const qty = screen.getByLabelText("Quantity (sarees)");

    fireEvent.change(qty, { target: { value: "0" } });
    fireEvent.click(screen.getByText("✓ Create Bulk Order"));
    expect(screen.getByText("Quantity must be at least 1")).toBeInTheDocument();
  });

  it("submits successfully once all required fields are valid", async () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Quantity (sarees)"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Delivery Deadline"), { target: { value: "2027-01-01" } });

    const customerSelect = screen.getByLabelText("Select Wholesale Customer");
    fireEvent.keyDown(customerSelect, { key: "ArrowDown", code: "ArrowDown" });

    const optionText = new RegExp(WHOLESALE_CUSTOMERS[0].name);
    const option = await screen.findByText(optionText);
    fireEvent.click(option);

    fireEvent.click(screen.getByText("✓ Create Bulk Order"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.customerId).toBe(WHOLESALE_CUSTOMERS[0].id);
    expect(submitted.total).toBe(40);
    expect(submitted.ref).toBe("ORD-2026-050");
  });

  it("clears previous errors once the form becomes valid", async () => {
    setup();
    fireEvent.click(screen.getByText("✓ Create Bulk Order"));
    expect(screen.getByText("Quantity must be at least 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity (sarees)"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Delivery Deadline"), { target: { value: "2027-01-01" } });
    const customerSelect = screen.getByLabelText("Select Wholesale Customer");
    fireEvent.keyDown(customerSelect, { key: "ArrowDown", code: "ArrowDown" });

    const optionText = new RegExp(WHOLESALE_CUSTOMERS[0].name);
    const option = await screen.findByText(optionText);
    fireEvent.click(option);

    fireEvent.click(screen.getByText("✓ Create Bulk Order"));
    expect(screen.queryByText("Quantity must be at least 1")).not.toBeInTheDocument();
  });

});

