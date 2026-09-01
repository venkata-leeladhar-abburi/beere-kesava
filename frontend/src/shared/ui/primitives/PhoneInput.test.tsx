import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PhoneInput, normalizePhoneInput } from "./PhoneInput";

describe("normalizePhoneInput", () => {
  it("keeps a plain 10-digit number as-is", () => {
    expect(normalizePhoneInput("9876543210")).toBe("9876543210");
  });

  it("strips everything that isn't a digit", () => {
    expect(normalizePhoneInput("98765-43210")).toBe("9876543210");
    expect(normalizePhoneInput("abc")).toBe("");
  });

  it("keeps the LAST ten digits, so a country code is dropped rather than the subscriber number", () => {
    expect(normalizePhoneInput("+91 98765 43210")).toBe("9876543210");
    expect(normalizePhoneInput("091-9876543210")).toBe("9876543210");
  });

  it("allows a partial number while it's still being typed", () => {
    expect(normalizePhoneInput("98765")).toBe("98765");
  });
});

describe("PhoneInput", () => {
  it("refuses an 11th digit", () => {
    const onValueChange = vi.fn();
    render(<PhoneInput value="9876543210" onValueChange={onValueChange} aria-label="Mobile" />);

    fireEvent.change(screen.getByLabelText("Mobile"), { target: { value: "98765432109" } });

    // The last ten of what was typed — never eleven digits.
    expect(onValueChange).toHaveBeenCalledWith("8765432109");
  });

  it("normalises a pasted +91 number instead of truncating it", () => {
    const onValueChange = vi.fn();
    render(<PhoneInput value="" onValueChange={onValueChange} aria-label="Mobile" />);

    fireEvent.change(screen.getByLabelText("Mobile"), { target: { value: "+919876543210" } });

    expect(onValueChange).toHaveBeenCalledWith("9876543210");
  });
});
