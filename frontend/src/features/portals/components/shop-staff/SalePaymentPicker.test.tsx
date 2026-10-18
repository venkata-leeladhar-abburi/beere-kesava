/**
 * The payment step as the counter uses it: one method by default, and a split
 * where typing the cash amount leaves the balance on UPI.
 */
import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SalePaymentPicker } from "./SalePaymentPicker";
import type { SplitDraftRow } from "./splitPaymentDraft";
import type { CounterPaymentMethod } from "@/lib/domain/salePayment";

function Harness({ total = 1600 }: { total?: number }) {
  const [split, setSplit] = useState(false);
  const [payment, setPayment] = useState<CounterPaymentMethod | null>(null);
  const [payRef, setPayRef] = useState("");
  const [rows, setRows] = useState<SplitDraftRow[]>([]);
  return (
    <SalePaymentPicker
      total={total}
      isMobile={false}
      split={split}
      onSplitChange={(on) => {
        setRows(on && payment ? [{ method: payment, amount: "", reference: payRef }] : []);
        setSplit(on);
      }}
      payment={payment}
      onPaymentChange={setPayment}
      payRef={payRef}
      onPayRefChange={setPayRef}
      rows={rows}
      onRowsChange={setRows}
    />
  );
}

describe("SalePaymentPicker", () => {
  it("picks one method, and asks for a reference only where one exists", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    await user.click(screen.getByRole("radio", { name: /Cash/ }));
    expect(screen.getByRole("radio", { name: /Cash/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByLabelText(/UPI reference/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /UPI/ }));
    expect(screen.getByLabelText(/UPI reference/)).toBeInTheDocument();
  });

  it("splits cash and UPI — the UPI row takes the balance", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: /Cash/ }));
    await user.click(screen.getByRole("switch", { name: /Split payment/ }));

    // The cards become a multi-select, starting from the method already picked.
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByRole("checkbox", { name: /Cash/ })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("checkbox", { name: /UPI/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Enter an amount for Cash, or remove it");

    await user.type(screen.getByLabelText("Cash amount"), "600");
    expect(screen.getByLabelText("UPI amount")).toHaveValue("1000");
    expect(screen.getByRole("status")).toHaveTextContent("Allocated ₹1,600 of ₹1,600");
    expect(screen.getByRole("status")).toHaveTextContent("Bill fully covered");

    // Typing over the balance makes it an ordinary amount — now it is short.
    await user.clear(screen.getByLabelText("UPI amount"));
    await user.type(screen.getByLabelText("UPI amount"), "900");
    expect(screen.getByRole("status")).toHaveTextContent("₹100 still to be allocated");

    await user.click(screen.getByRole("button", { name: "Remove UPI" }));
    expect(screen.getByRole("status")).toHaveTextContent("Pick at least two methods");
  });
});
