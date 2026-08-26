import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberInput } from "./NumberInput";

// Covers design-system/06-DOMAIN.md Part F.3's "Indian grouping everywhere"
// rule extended to entry fields — typing an amount should read grouped the
// same way a displayed one does, without changing the numeric value the
// caller receives.
describe("NumberInput", () => {
  it("groups digits Indian-style as the user types, reporting the plain number", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState<number | "">("");
      return (
        <NumberInput
          aria-label="Amount"
          value={value}
          onValueChange={v => {
            setValue(v);
            onValueChange(v);
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByLabelText("Amount");
    await user.type(input, "1234567");

    expect(input).toHaveValue("12,34,567");
    expect(onValueChange).toHaveBeenLastCalledWith(1234567);
  });

  it("keeps a trailing decimal point visible while typing a decimal amount", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState<number | "">("");
      return <NumberInput aria-label="Rate" step={0.01} value={value} onValueChange={setValue} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("Rate");
    await user.type(input, "12.5");

    expect(input).toHaveValue("12.5");
  });

  it("rejects a decimal point when step is a whole number", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState<number | "">("");
      return <NumberInput aria-label="Weight" value={value} onValueChange={setValue} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("Weight");
    await user.type(input, "12.5");

    expect(input).toHaveValue("125");
  });

  it("formats a value supplied externally (e.g. a form reset) the same way", () => {
    render(<NumberInput aria-label="Total" value={250000} onValueChange={() => {}} />);
    expect(screen.getByLabelText("Total")).toHaveValue("2,50,000");
  });
});
