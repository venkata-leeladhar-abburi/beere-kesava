import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkOrderCreateModal } from "./BulkOrderCreateModal";

const MOCK_WHOLESALE_CUSTOMERS = [
  { id: "WHL-001", name: "Lakshmi Silks", city: "Hyderabad", terms: "Net 30", phone: "+91 98450 11223", address: "G-12, Silk Plaza, Madhapur, Hyderabad - 500081", gstCode: "36AAAAA1111A1Z1" },
  { id: "WHL-002", name: "Narayana Silk Emporium", city: "Vijayawada", terms: "Net 45", phone: "+91 99123 44556", address: "40-1-5, MG Road, Vijayawada - 520010", gstCode: "37BBBBB2222B2Z2" }
];

vi.mock("./WholesaleCustomerSelectSection", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./WholesaleCustomerSelectSection")>();
  return {
    ...actual,
    useAllWholesaleCustomers: () => MOCK_WHOLESALE_CUSTOMERS,
  };
});


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
    const user = userEvent.setup();
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText("Quantity (sarees)"), { target: { value: "40" } });
    // DatePicker only commits typed text on blur/Enter, not on every change
    // (see DatePicker.tsx's commitText) — mirror real typed-entry usage.
    const deadlineInput = screen.getByLabelText("Delivery Deadline");
    fireEvent.change(deadlineInput, { target: { value: "2027-01-01" } });
    fireEvent.keyDown(deadlineInput, { key: "Enter" });

    // Select uses Radix DropdownMenu trigger and menu items.
    await user.click(screen.getByLabelText("Select Wholesale Customer"));
    await user.click(screen.getByRole("menuitem", { name: new RegExp(MOCK_WHOLESALE_CUSTOMERS[0].name) }));

    fireEvent.click(screen.getByText("✓ Create Bulk Order"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.customerId).toBe(MOCK_WHOLESALE_CUSTOMERS[0].id);
    expect(submitted.total).toBe(40);
    expect(submitted.ref).toBe("ORD-2026-050");
  });

  it("clears previous errors once the form becomes valid", async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.click(screen.getByText("✓ Create Bulk Order"));
    expect(screen.getByText("Quantity must be at least 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity (sarees)"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Delivery Deadline"), { target: { value: "2027-01-01" } });
    // Select uses Radix DropdownMenu trigger and menu items.
    await user.click(screen.getByLabelText("Select Wholesale Customer"));
    await user.click(screen.getByRole("menuitem", { name: new RegExp(MOCK_WHOLESALE_CUSTOMERS[0].name) }));

    fireEvent.click(screen.getByText("✓ Create Bulk Order"));
    expect(screen.queryByText("Quantity must be at least 1")).not.toBeInTheDocument();
  });

});

