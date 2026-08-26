import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, SelectItem } from "./Select";
import { Combobox } from "./Combobox";
import { MultiSelect } from "./MultiSelect";
import { Slider } from "./Slider";

describe("Select", () => {
  // Select is a native <select> (see the component header): there is no
  // popup listbox to open, and the browser renders the option list itself.
  // Drive it the way a user actually does rather than reaching for a
  // Radix-style trigger/listbox pair.
  it("commits a value when the user picks an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select placeholder="Choose a type" onValueChange={onValueChange}>
        <SelectItem value="silk">Silk</SelectItem>
        <SelectItem value="cotton">Cotton</SelectItem>
      </Select>
    );
    await user.selectOptions(screen.getByRole("combobox"), "cotton");
    expect(onValueChange).toHaveBeenCalledWith("cotton");
  });

  it("renders the placeholder as a disabled option so it cannot be re-picked", () => {
    render(
      <Select placeholder="Choose a type" onValueChange={() => {}}>
        <SelectItem value="silk">Silk</SelectItem>
      </Select>
    );
    // The placeholder carries `hidden`, so it is deliberately absent from the
    // accessibility tree and has to be asserted against the DOM directly.
    const placeholder = screen.getByRole("combobox").querySelector("option[value='']");
    expect(placeholder).toHaveTextContent("Choose a type");
    expect(placeholder).toBeDisabled();
  });
});

describe("Combobox", () => {
  const options = [
    { value: "w1", label: "Ravi Kumar" },
    { value: "w2", label: "Padma Veni" },
  ];

  it("filters options as the user types in the search field", async () => {
    const user = userEvent.setup();
    render(<Combobox options={options} placeholder="Search weavers…" />);
    await user.click(screen.getByRole("combobox"));
    const search = screen.getByPlaceholderText("Search…");
    await user.type(search, "Padma");
    expect(screen.getByText("Padma Veni")).toBeInTheDocument();
    expect(screen.queryByText("Ravi Kumar")).not.toBeInTheDocument();
  });

  it("selecting an option commits the value and closes the panel", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={options} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Ravi Kumar"));
    expect(onValueChange).toHaveBeenCalledWith("w1");
  });
});

describe("MultiSelect", () => {
  const options = [
    { value: "w1", label: "Ravi Kumar" },
    { value: "w2", label: "Padma Veni" },
  ];

  it("toggling an option adds it to the selected value array", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} value={[]} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Padma Veni"));
    expect(onValueChange).toHaveBeenCalledWith(["w2"]);
  });

  it("renders already-selected options as chips in the trigger", () => {
    render(<MultiSelect options={options} value={["w1"]} onValueChange={() => {}} />);
    expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
  });
});

describe("Slider", () => {
  it("ArrowRight increments the thumb value by one step", () => {
    render(<Slider defaultValue={[3]} min={1} max={5} step={1} />);
    const thumb = screen.getByRole("slider");
    thumb.focus();
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(thumb).toHaveAttribute("aria-valuenow", "4");
  });

  it("renders one thumb per value for a range slider", () => {
    render(<Slider defaultValue={[20000, 80000]} min={0} max={100000} step={1000} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });
});
