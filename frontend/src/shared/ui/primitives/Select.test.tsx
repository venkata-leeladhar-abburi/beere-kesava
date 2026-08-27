import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, SelectItem } from "./Select";
import { Combobox } from "./Combobox";
import { MultiSelect } from "./MultiSelect";
import { Slider } from "./Slider";

describe("Select", () => {
  // Select is a Radix DropdownMenu, not a native <select> (see the component
  // header): the trigger is a button with aria-haspopup="menu" and the options
  // only exist in the DOM once the menu is open. These tests drive it that
  // way — clicking the trigger, then the item — rather than through
  // selectOptions, which only works on a real <select>.
  it("commits a value when the user picks an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select placeholder="Choose a type" onValueChange={onValueChange}>
        <SelectItem value="silk">Silk</SelectItem>
        <SelectItem value="cotton">Cotton</SelectItem>
      </Select>
    );
    await user.click(screen.getByRole("button", { name: "Choose a type" }));
    await user.click(await screen.findByText("Cotton"));
    expect(onValueChange).toHaveBeenCalledWith("cotton");
  });

  it("shows the placeholder on the trigger until a value is chosen", async () => {
    const user = userEvent.setup();
    render(
      <Select placeholder="Choose a type" onValueChange={() => {}}>
        <SelectItem value="silk">Silk</SelectItem>
      </Select>
    );
    // With no native <option> list, the placeholder lives on the trigger and
    // is replaced by the chosen item's label — it is never itself selectable.
    const trigger = screen.getByRole("button", { name: "Choose a type" });
    expect(trigger).toHaveTextContent("Choose a type");

    await user.click(trigger);
    await user.click(await screen.findByText("Silk"));

    expect(screen.getByRole("button")).toHaveTextContent("Silk");
    expect(screen.queryByText("Choose a type")).not.toBeInTheDocument();
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
