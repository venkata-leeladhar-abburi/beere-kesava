/**
 * A counter sale can be billed to a walk-in who leaves no phone. The customer
 * step must say so (the field reads as optional), must not print "+91 —" for
 * a customer on file without one, and must stop a half-typed number from
 * reaching the bill, where the WhatsApp send would fail on it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerSelectStep, isPhoneEntryComplete, type Customer } from "./CustomerSelectStep";

const noop = () => {};

function renderStep(overrides: Partial<React.ComponentProps<typeof CustomerSelectStep>> = {}) {
  const phone = overrides.phone ?? "";
  return render(
    <CustomerSelectStep
      custSearch=""
      setCustSearch={noop}
      showCustomerList={false}
      setShowCustomerList={noop}
      selectedCustomer={null}
      setSelectedCustomer={noop}
      filteredCustomers={[]}
      isEditingCustomer={false}
      setIsEditingCustomer={noop}
      isNewCustomer
      setIsNewCustomer={noop}
      custName="Padma"
      setCustName={noop}
      phone={phone}
      setPhone={vi.fn()}
      custAddress=""
      setCustAddress={noop}
      handleSelectCustomer={noop}
      handleAddNew={noop}
      canProceedStep1={isPhoneEntryComplete(phone)}
      onNext={noop}
      {...overrides}
    />,
  );
}

describe("isPhoneEntryComplete", () => {
  it("accepts no phone at all", () => {
    expect(isPhoneEntryComplete("")).toBe(true);
    expect(isPhoneEntryComplete("   ")).toBe(true);
  });

  it("accepts a full 10-digit mobile", () => {
    expect(isPhoneEntryComplete("9876543210")).toBe(true);
  });

  it("rejects a half-typed number", () => {
    expect(isPhoneEntryComplete("98765")).toBe(false);
  });
});

describe("CustomerSelectStep phone field", () => {
  it("marks the phone as optional and lets a name-only customer continue", () => {
    renderStep();
    expect(screen.getByText("(Optional)", { selector: "label[for='cust-phone'] span" })).toBeInTheDocument();
    expect(screen.queryByText("Enter all 10 digits, or leave it empty")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next — Scan Saree/ })).toBeEnabled();
  });

  it("flags a half-typed number and blocks Next", () => {
    renderStep({ phone: "98765" });
    expect(screen.getByText("Enter all 10 digits, or leave it empty")).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: /Next — Scan Saree/ })).toBeDisabled();
  });

  it("shows 'No phone' for a customer on file without one, not '+91 —'", () => {
    const customer: Customer = {
      id: "c1", name: "Padma", phone: "", purchases: 2, total: "₹4,000", lastPurchase: "Sep 12", initials: "Padma",
    };
    renderStep({ isNewCustomer: false, selectedCustomer: customer, canProceedStep1: true });
    expect(screen.getByText("No phone")).toBeInTheDocument();
    expect(screen.queryByText(/\+91/)).not.toBeInTheDocument();
  });
});
