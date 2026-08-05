import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckboxField } from "./Checkbox";
import { RadioField, RadioGroup } from "./Radio";
import { SwitchField } from "./Switch";
import { StatusPill } from "./Badge";
import { Chip } from "./Chip";
import { SearchInput } from "./SearchInput";

describe("CheckboxField", () => {
  it("clicking the label toggles the checkbox — the whole label is the target", () => {
    const onCheckedChange = vi.fn();
    render(<CheckboxField label="Select all" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByText("Select all"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("RadioGroup", () => {
  it("only one option can be selected at a time", () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioField value="retail" label="Retail" />
        <RadioField value="wholesale" label="Wholesale" />
      </RadioGroup>
    );
    fireEvent.click(screen.getByText("Wholesale"));
    expect(onValueChange).toHaveBeenCalledWith("wholesale");
  });
});

describe("SwitchField", () => {
  it("fires onCheckedChange immediately on click — no separate save step", () => {
    const onCheckedChange = vi.fn();
    render(<SwitchField label="Email notifications" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("StatusPill", () => {
  it("always renders a dot alongside the text label — never colour alone", () => {
    const { container } = render(<StatusPill tone="danger" label="Overdue" />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("the remove button has an accessible name derived from the label", () => {
    render(<Chip label="Status: Active" onRemove={() => {}} />);
    expect(screen.getByRole("button", { name: "Remove Status: Active" })).toBeInTheDocument();
  });

  it("Backspace on a focused chip triggers onRemove", () => {
    const onRemove = vi.fn();
    render(<Chip label="City: Hyderabad" onRemove={onRemove} />);
    const chip = screen.getByText("City: Hyderabad").closest("span")!;
    fireEvent.keyDown(chip, { key: "Backspace" });
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("SearchInput", () => {
  it("debounces onSearch and does not fire on every keystroke", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "Ravi" } });
    expect(onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("Ravi");
    vi.useRealTimers();
  });
});
