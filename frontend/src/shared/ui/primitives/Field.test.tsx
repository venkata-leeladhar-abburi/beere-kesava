import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./Field";
import { Input } from "./Input";

describe("Field + Input", () => {
  it("wires a real <label htmlFor> to the input — the fix for placeholder-only labels", () => {
    render(
      <Field label="Weaver code">
        <Input placeholder="WV-001" />
      </Field>
    );
    // getByLabelText only succeeds if label/for and input/id are correctly wired
    const input = screen.getByLabelText("Weaver code");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("shows the required marker and an sr-only 'required' text", () => {
    render(
      <Field label="Mobile number" required>
        <Input />
      </Field>
    );
    expect(screen.getByText("required")).toHaveClass("sr-only");
  });

  it("wires aria-invalid and aria-describedby to the error message when error is set", () => {
    render(
      <Field label="GSTIN" error="GSTIN is required">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText("GSTIN");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toHaveTextContent("GSTIN is required");
    expect(errorEl).toHaveAttribute("role", "alert");
  });

  it("wires aria-describedby to the hint when there is no error", () => {
    render(
      <Field label="Weaver code" hint="Format: WV-000">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText("Weaver code");
    expect(input).not.toHaveAttribute("aria-invalid");
    const describedBy = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)).toHaveTextContent("Format: WV-000");
  });
});
